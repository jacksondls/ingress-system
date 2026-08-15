from datetime import timedelta

from django.db import transaction
from django.db.models import Count, F, Q
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import IsClient, IsGate, IsOrganizer, IsOrganizerOrReadOnly

from .models import (
    Event,
    Order,
    Seat,
    Session,
    Ticket,
    generate_ticket_code,
    sign_ticket_code,
)
from .serializers import (
    EventSerializer,
    GateValidateSerializer,
    OrderSerializer,
    PayOrderSerializer,
    SeatSerializer,
    SessionSerializer,
    TicketSerializer,
)
from .ticketmaster import search_attractions
from .tmdb import TmdbConfigError, search_movies

HOLD_MINUTES = 10


def generate_seats_for_session(session: Session) -> None:
    seats = []
    for r in range(session.seat_rows):
        row_label = chr(ord('A') + r)
        for n in range(1, session.seat_cols + 1):
            seats.append(
                Seat(session=session, row=row_label, number=n),
            )
    Seat.objects.bulk_create(seats)


def release_held_seats(order: Order) -> None:
    Seat.objects.filter(held_order=order, status=Seat.Status.HELD).update(
        status=Seat.Status.AVAILABLE,
        held_order=None,
    )


def expire_stale_holds() -> None:
    cutoff = timezone.now() - timedelta(minutes=HOLD_MINUTES)
    stale = list(
        Order.objects.select_for_update().filter(
            status=Order.Status.PENDING,
            created_at__lt=cutoff,
        )
    )
    for order in stale:
        release_held_seats(order)
        order.status = Order.Status.CANCELLED
        order.save(update_fields=['status'])


def restore_sold_seats(order: Order) -> None:
    Seat.objects.filter(held_order=order, status=Seat.Status.SOLD).update(
        status=Seat.Status.AVAILABLE,
        held_order=None,
    )
    seat_ids = list(
        Ticket.objects.filter(order=order, seat_id__isnull=False).values_list(
            'seat_id',
            flat=True,
        )
    )
    if seat_ids:
        Seat.objects.filter(id__in=seat_ids).update(
            status=Seat.Status.AVAILABLE,
            held_order=None,
        )


class EventViewSet(viewsets.ModelViewSet):
    serializer_class = EventSerializer
    http_method_names = ['get', 'post', 'put', 'delete', 'head', 'options']
    permission_classes = [IsOrganizerOrReadOnly]

    def get_queryset(self):
        qs = Event.objects.annotate(session_count=Count('sessions')).prefetch_related(
            'sessions',
        )
        query = self.request.query_params.get('query', '').strip()
        event_type = self.request.query_params.get('type', 'all').strip()
        state = self.request.query_params.get('state', '').strip().upper()

        if event_type and event_type != 'all':
            qs = qs.filter(type=event_type)
        if state:
            qs = qs.filter(state=state)
        if query:
            qs = qs.filter(Q(title__icontains=query) | Q(venue__icontains=query))
        return qs

    def perform_create(self, serializer):
        serializer.save(organizer=self.request.user)

    def perform_destroy(self, instance):
        Order.objects.filter(session__event=instance).delete()
        instance.delete()

    @action(detail=True, methods=['get'], url_path='sessions')
    def sessions(self, request, pk=None):
        event = self.get_object()
        sessions = event.sessions.all()
        serializer = SessionSerializer(sessions, many=True)
        return Response(serializer.data)


class SessionViewSet(viewsets.ModelViewSet):
    queryset = Session.objects.select_related('event').all()
    serializer_class = SessionSerializer
    http_method_names = ['get', 'post', 'put', 'delete', 'head', 'options']
    permission_classes = [IsOrganizerOrReadOnly]

    def perform_create(self, serializer):
        session = serializer.save()
        if session.seating_mode == Session.SeatingMode.SEATS:
            generate_seats_for_session(session)

    def perform_destroy(self, instance):
        instance.orders.all().delete()
        instance.delete()

    @action(detail=True, methods=['get'], url_path='seats')
    def seats(self, request, pk=None):
        session = self.get_object()
        seats = session.seats.all()
        return Response(SeatSerializer(seats, many=True).data)


class OrderViewSet(viewsets.ModelViewSet):
    serializer_class = OrderSerializer
    http_method_names = ['get', 'post', 'head', 'options']
    permission_classes = [IsAuthenticated, IsClient]

    def get_queryset(self):
        return Order.objects.filter(client=self.request.user).select_related(
            'session',
            'session__event',
        ).prefetch_related('held_seats', 'tickets__seat')

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        session = serializer.validated_data['session']
        seat_ids = serializer.validated_data.get('seat_ids') or []
        quantity = request.data.get('quantity')

        with transaction.atomic():
            expire_stale_holds()
            locked = Session.objects.select_for_update().get(pk=session.pk)

            if locked.seating_mode == Session.SeatingMode.SEATS:
                if not seat_ids:
                    return Response(
                        {'detail': 'Selecione ao menos um assento.'},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                seats = list(
                    Seat.objects.select_for_update().filter(
                        session=locked,
                        id__in=seat_ids,
                    )
                )
                if len(seats) != len(set(str(sid) for sid in seat_ids)):
                    return Response(
                        {'detail': 'Um ou mais assentos são inválidos.'},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                if any(s.status != Seat.Status.AVAILABLE for s in seats):
                    return Response(
                        {'detail': 'Assento indisponível.'},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                order = Order.objects.create(
                    client=request.user,
                    session=locked,
                    quantity=len(seats),
                    status=Order.Status.PENDING,
                )
                for seat in seats:
                    seat.status = Seat.Status.HELD
                    seat.held_order = order
                Seat.objects.bulk_update(seats, ['status', 'held_order'])
            else:
                try:
                    qty = int(quantity)
                except (TypeError, ValueError):
                    qty = 0
                if qty < 1:
                    return Response(
                        {'detail': 'Quantidade inválida.'},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                if locked.available < qty:
                    return Response(
                        {'detail': 'Ingressos insuficientes.'},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                order = Order.objects.create(
                    client=request.user,
                    session=locked,
                    quantity=qty,
                    status=Order.Status.PENDING,
                )

        return Response(
            OrderSerializer(order).data,
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=['post'], url_path='pay')
    def pay(self, request, pk=None):
        pay_ser = PayOrderSerializer(data=request.data)
        pay_ser.is_valid(raise_exception=True)
        approve = pay_ser.validated_data['approve']

        with transaction.atomic():
            try:
                order = Order.objects.select_for_update().get(
                    pk=pk,
                    client=request.user,
                )
            except Order.DoesNotExist:
                return Response(
                    {'detail': 'Não encontrado.'},
                    status=status.HTTP_404_NOT_FOUND,
                )
            if order.status != Order.Status.PENDING:
                return Response(
                    {'detail': 'Pedido não está pendente.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if not approve:
                release_held_seats(order)
                order.status = Order.Status.FAILED
                order.save(update_fields=['status'])
                return Response(OrderSerializer(order).data)

            locked = Session.objects.select_for_update().get(pk=order.session_id)

            if locked.seating_mode == Session.SeatingMode.SEATS:
                seats = list(
                    Seat.objects.select_for_update().filter(held_order=order)
                )
                if len(seats) != order.quantity:
                    release_held_seats(order)
                    order.status = Order.Status.FAILED
                    order.save(update_fields=['status'])
                    return Response(
                        {'detail': 'Assentos da reserva inválidos.', 'order': OrderSerializer(order).data},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                for seat in seats:
                    seat.status = Seat.Status.SOLD
                Seat.objects.bulk_update(seats, ['status'])
                Session.objects.filter(pk=locked.pk).update(
                    sold=F('sold') + order.quantity,
                )
                order.status = Order.Status.PAID
                order.save(update_fields=['status'])
                tickets = []
                for seat in seats:
                    raw = generate_ticket_code()
                    code = sign_ticket_code(raw)
                    tickets.append(
                        Ticket(order=order, seat=seat, code=f'{raw}.{code}'),
                    )
                Ticket.objects.bulk_create(tickets)
            else:
                if locked.available < order.quantity:
                    order.status = Order.Status.FAILED
                    order.save(update_fields=['status'])
                    return Response(
                        {
                            'detail': 'Ingressos insuficientes no pagamento.',
                            'order': OrderSerializer(order).data,
                        },
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                Session.objects.filter(pk=locked.pk).update(
                    sold=F('sold') + order.quantity,
                )
                order.status = Order.Status.PAID
                order.save(update_fields=['status'])
                tickets = []
                for _ in range(order.quantity):
                    raw = generate_ticket_code()
                    code = sign_ticket_code(raw)
                    tickets.append(
                        Ticket(order=order, code=f'{raw}.{code}'),
                    )
                Ticket.objects.bulk_create(tickets)

        order.refresh_from_db()
        return Response(OrderSerializer(order).data)

    @action(detail=True, methods=['post'], url_path='cancel')
    def cancel(self, request, pk=None):
        with transaction.atomic():
            try:
                order = Order.objects.select_for_update().get(
                    pk=pk,
                    client=request.user,
                )
            except Order.DoesNotExist:
                return Response(
                    {'detail': 'Não encontrado.'},
                    status=status.HTTP_404_NOT_FOUND,
                )
            if order.status not in (Order.Status.PENDING, Order.Status.PAID):
                return Response(
                    {'detail': 'Pedido não pode ser cancelado.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            locked = Session.objects.select_for_update().get(pk=order.session_id)
            if order.status == Order.Status.PENDING:
                release_held_seats(order)
                order.status = Order.Status.CANCELLED
                order.save(update_fields=['status'])
                return Response(OrderSerializer(order).data)

            if Ticket.objects.filter(
                order=order,
                status=Ticket.Status.USED,
            ).exists():
                return Response(
                    {'detail': 'Ingresso já utilizado; não é possível cancelar.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            restore_sold_seats(order)
            locked.sold = max(locked.sold - order.quantity, 0)
            locked.save(update_fields=['sold'])
            order.status = Order.Status.CANCELLED
            order.save(update_fields=['status'])

        order.refresh_from_db()
        return Response(OrderSerializer(order).data)


class TicketViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = TicketSerializer
    permission_classes = [IsAuthenticated, IsClient]
    http_method_names = ['get', 'head', 'options']

    def get_queryset(self):
        return Ticket.objects.filter(
            order__client=self.request.user,
            order__status=Order.Status.PAID,
        ).select_related(
            'order',
            'order__session',
            'order__session__event',
            'seat',
        )

    @action(detail=False, methods=['get'], url_path='mine')
    def mine(self, request):
        qs = self.get_queryset()
        return Response(TicketSerializer(qs, many=True).data)


@api_view(['GET'])
@permission_classes([AllowAny])
def ticket_share(request, token):
    try:
        ticket = Ticket.objects.select_related(
            'order',
            'order__session',
            'order__session__event',
            'seat',
        ).get(share_token=token, order__status=Order.Status.PAID)
    except Ticket.DoesNotExist:
        return Response({'detail': 'Ingresso não encontrado.'}, status=404)
    return Response(TicketSerializer(ticket).data)


class GateValidateView(APIView):
    permission_classes = [IsAuthenticated, IsGate]

    def post(self, request):
        ser = GateValidateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        code = ser.validated_data['code'].strip()
        event_id = ser.validated_data['event_id']

        with transaction.atomic():
            try:
                ticket = Ticket.objects.select_for_update().select_related(
                    'order',
                    'order__session',
                    'order__session__event',
                    'seat',
                ).get(code=code)
            except Ticket.DoesNotExist:
                return Response({'result': 'invalid', 'detail': 'Código inválido.'})

            if not _verify_ticket_code(code):
                return Response({'result': 'invalid', 'detail': 'Código forjado.'})

            event = ticket.order.session.event
            if str(event.id) != str(event_id):
                return Response(
                    {
                        'result': 'wrong_event',
                        'detail': 'Ingresso de outro evento.',
                        'eventTitle': event.title,
                    }
                )

            if ticket.order.status != Order.Status.PAID:
                return Response({'result': 'invalid', 'detail': 'Pedido não pago.'})

            if ticket.status == Ticket.Status.USED:
                return Response(
                    {
                        'result': 'already_used',
                        'detail': 'Ingresso já utilizado.',
                        'usedAt': ticket.used_at,
                    }
                )

            ticket.status = Ticket.Status.USED
            ticket.used_at = timezone.now()
            ticket.save(update_fields=['status', 'used_at'])
            return Response(
                {
                    'result': 'valid',
                    'detail': 'Ingresso válido.',
                    'ticket': TicketSerializer(ticket).data,
                }
            )


def _verify_ticket_code(code: str) -> bool:
    if '.' not in code:
        return False
    raw, signature = code.rsplit('.', 1)
    expected = sign_ticket_code(raw)
    return hmac_compare(signature, expected)


def hmac_compare(a: str, b: str) -> bool:
    import hmac as hm

    return hm.compare_digest(a, b)


class TmdbSearchView(APIView):
    permission_classes = [IsAuthenticated, IsOrganizer]

    def get(self, request):
        query = request.query_params.get('query', '').strip()
        if not query:
            return Response({'results': []})
        try:
            results = search_movies(query)
        except TmdbConfigError:
            return Response(
                {'detail': 'TMDB_API_KEY não configurada no servidor.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        except Exception:
            return Response(
                {'detail': 'Falha ao buscar na API externa.'},
                status=status.HTTP_502_BAD_GATEWAY,
            )
        return Response({'results': results})


class TicketmasterSearchView(APIView):
    permission_classes = [IsAuthenticated, IsOrganizer]

    def get(self, request):
        query = request.query_params.get('query', '').strip()
        if not query:
            return Response({'results': []})
        try:
            results = search_attractions(query)
        except Exception:
            return Response(
                {'detail': 'Falha ao buscar na API externa.'},
                status=status.HTTP_502_BAD_GATEWAY,
            )
        return Response({'results': results})

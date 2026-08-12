from rest_framework import serializers

from .models import Event, Order, Seat, Session, Ticket


class EventSerializer(serializers.ModelSerializer):
    session_count = serializers.IntegerField(read_only=True, required=False)

    class Meta:
        model = Event
        fields = (
            'id',
            'title',
            'type',
            'description',
            'venue',
            'image_url',
            'tmdb_id',
            'ticketmaster_id',
            'created_at',
            'session_count',
        )
        read_only_fields = ('id', 'created_at', 'session_count')


class SeatSerializer(serializers.ModelSerializer):
    label = serializers.CharField(read_only=True)

    class Meta:
        model = Seat
        fields = ('id', 'row', 'number', 'label', 'status')


class SessionSerializer(serializers.ModelSerializer):
    event_id = serializers.PrimaryKeyRelatedField(
        source='event',
        queryset=Event.objects.all(),
    )
    price = serializers.FloatField()
    available = serializers.IntegerField(read_only=True)
    seating_mode = serializers.ChoiceField(
        choices=Session.SeatingMode.choices,
        default=Session.SeatingMode.QUANTITY,
        required=False,
    )
    seat_rows = serializers.IntegerField(required=False, default=0, min_value=0)
    seat_cols = serializers.IntegerField(required=False, default=0, min_value=0)

    class Meta:
        model = Session
        fields = (
            'id',
            'event_id',
            'datetime',
            'room',
            'price',
            'capacity',
            'sold',
            'available',
            'seating_mode',
            'seat_rows',
            'seat_cols',
        )
        read_only_fields = ('id', 'sold', 'available')

    def validate(self, attrs):
        mode = attrs.get(
            'seating_mode',
            getattr(self.instance, 'seating_mode', Session.SeatingMode.QUANTITY),
        )
        rows = attrs.get('seat_rows', getattr(self.instance, 'seat_rows', 0) or 0)
        cols = attrs.get('seat_cols', getattr(self.instance, 'seat_cols', 0) or 0)
        if mode == Session.SeatingMode.SEATS:
            if rows < 1 or cols < 1:
                raise serializers.ValidationError(
                    {'seatRows': 'Informe fileiras e colunas para o mapa.'}
                )
            attrs['capacity'] = rows * cols
        return attrs


class OrderSerializer(serializers.ModelSerializer):
    session_id = serializers.PrimaryKeyRelatedField(
        source='session',
        queryset=Session.objects.all(),
        write_only=True,
    )
    seat_ids = serializers.ListField(
        child=serializers.UUIDField(),
        write_only=True,
        required=False,
        allow_empty=True,
    )
    session = SessionSerializer(read_only=True)
    tickets = serializers.SerializerMethodField()
    seats = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = (
            'id',
            'session_id',
            'seat_ids',
            'session',
            'quantity',
            'status',
            'created_at',
            'tickets',
            'seats',
        )
        read_only_fields = (
            'id',
            'status',
            'created_at',
            'tickets',
            'session',
            'seats',
            'quantity',
        )

    def get_tickets(self, obj):
        if obj.status != Order.Status.PAID:
            return []
        return TicketSerializer(obj.tickets.all(), many=True).data

    def get_seats(self, obj):
        seats = list(obj.held_seats.all())
        if not seats:
            seats = [t.seat for t in obj.tickets.all() if t.seat_id]
        return SeatSerializer(seats, many=True).data


class TicketSerializer(serializers.ModelSerializer):
    event_title = serializers.CharField(
        source='order.session.event.title',
        read_only=True,
    )
    event_id = serializers.UUIDField(
        source='order.session.event.id',
        read_only=True,
    )
    session_datetime = serializers.DateTimeField(
        source='order.session.datetime',
        read_only=True,
    )
    venue = serializers.CharField(
        source='order.session.event.venue',
        read_only=True,
    )
    seat_label = serializers.SerializerMethodField()
    share_url = serializers.SerializerMethodField()

    class Meta:
        model = Ticket
        fields = (
            'id',
            'code',
            'status',
            'used_at',
            'share_token',
            'share_url',
            'event_id',
            'event_title',
            'session_datetime',
            'venue',
            'seat_label',
        )

    def get_share_url(self, obj):
        return f'/ingresso/{obj.share_token}'

    def get_seat_label(self, obj):
        return obj.seat.label if obj.seat_id else None


class PayOrderSerializer(serializers.Serializer):
    approve = serializers.BooleanField()


class GateValidateSerializer(serializers.Serializer):
    code = serializers.CharField()
    event_id = serializers.UUIDField()

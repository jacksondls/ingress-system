from rest_framework import serializers

from .models import Event, Order, Session, Ticket


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
            'created_at',
            'session_count',
        )
        read_only_fields = ('id', 'created_at', 'session_count')


class SessionSerializer(serializers.ModelSerializer):
    event_id = serializers.PrimaryKeyRelatedField(
        source='event',
        queryset=Event.objects.all(),
    )
    price = serializers.FloatField()
    available = serializers.IntegerField(read_only=True)

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
        )
        read_only_fields = ('id', 'sold', 'available')


class OrderSerializer(serializers.ModelSerializer):
    session_id = serializers.PrimaryKeyRelatedField(
        source='session',
        queryset=Session.objects.all(),
        write_only=True,
    )
    session = SessionSerializer(read_only=True)
    tickets = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = (
            'id',
            'session_id',
            'session',
            'quantity',
            'status',
            'created_at',
            'tickets',
        )
        read_only_fields = ('id', 'status', 'created_at', 'tickets', 'session')

    def get_tickets(self, obj):
        if obj.status != Order.Status.PAID:
            return []
        return TicketSerializer(obj.tickets.all(), many=True).data


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
        )

    def get_share_url(self, obj):
        return f'/ingresso/{obj.share_token}'


class PayOrderSerializer(serializers.Serializer):
    approve = serializers.BooleanField()


class GateValidateSerializer(serializers.Serializer):
    code = serializers.CharField()
    event_id = serializers.UUIDField()

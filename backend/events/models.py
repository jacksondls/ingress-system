import hashlib
import hmac
import secrets
import uuid

from django.conf import settings
from django.contrib.auth.models import User
from django.db import models


class Event(models.Model):
    class Type(models.TextChoices):
        SHOW = 'show', 'Show'
        FILME = 'filme', 'Filme'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    type = models.CharField(max_length=10, choices=Type.choices)
    description = models.TextField()
    venue = models.CharField(max_length=255)
    image_url = models.URLField(blank=True, max_length=500)
    tmdb_id = models.PositiveIntegerField(null=True, blank=True)
    ticketmaster_id = models.CharField(max_length=64, blank=True)
    organizer = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='events',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['title']

    def __str__(self):
        return self.title


class Session(models.Model):
    class SeatingMode(models.TextChoices):
        QUANTITY = 'quantity', 'Pista / quantidade'
        SEATS = 'seats', 'Mapa de assentos'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    event = models.ForeignKey(
        Event,
        on_delete=models.CASCADE,
        related_name='sessions',
    )
    datetime = models.DateTimeField()
    room = models.CharField(max_length=120, blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    capacity = models.PositiveIntegerField()
    sold = models.PositiveIntegerField(default=0)
    seating_mode = models.CharField(
        max_length=20,
        choices=SeatingMode.choices,
        default=SeatingMode.QUANTITY,
    )
    seat_rows = models.PositiveSmallIntegerField(default=0)
    seat_cols = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ['datetime']

    @property
    def available(self):
        if self.seating_mode == self.SeatingMode.SEATS:
            return self.seats.filter(status=Seat.Status.AVAILABLE).count()
        return max(self.capacity - self.sold, 0)

    def __str__(self):
        return f'{self.event_id} @ {self.datetime}'


class Order(models.Model):
    class Status(models.TextChoices):
        PENDING = 'pending', 'Pendente'
        PAID = 'paid', 'Pago'
        FAILED = 'failed', 'Recusado'
        CANCELLED = 'cancelled', 'Cancelado'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    client = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='orders',
    )
    session = models.ForeignKey(
        Session,
        on_delete=models.PROTECT,
        related_name='orders',
    )
    quantity = models.PositiveIntegerField()
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']


class Seat(models.Model):
    class Status(models.TextChoices):
        AVAILABLE = 'available', 'Disponível'
        HELD = 'held', 'Reservado'
        SOLD = 'sold', 'Vendido'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.ForeignKey(
        Session,
        on_delete=models.CASCADE,
        related_name='seats',
    )
    row = models.CharField(max_length=4)
    number = models.PositiveSmallIntegerField()
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.AVAILABLE,
    )
    held_order = models.ForeignKey(
        Order,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='held_seats',
    )

    class Meta:
        ordering = ['row', 'number']
        unique_together = ('session', 'row', 'number')

    @property
    def label(self):
        return f'{self.row}{self.number}'


def generate_ticket_code():
    return secrets.token_urlsafe(16)


def generate_share_token():
    return secrets.token_urlsafe(24)


def sign_ticket_code(raw: str) -> str:
    key = settings.SECRET_KEY.encode()
    return hmac.new(key, raw.encode(), hashlib.sha256).hexdigest()[:32]


class Ticket(models.Model):
    class Status(models.TextChoices):
        VALID = 'valid', 'Válido'
        USED = 'used', 'Utilizado'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name='tickets',
    )
    seat = models.ForeignKey(
        Seat,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='tickets',
    )
    code = models.CharField(max_length=64, unique=True, db_index=True)
    share_token = models.CharField(
        max_length=64,
        unique=True,
        default=generate_share_token,
        db_index=True,
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.VALID,
    )
    used_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-order__created_at']

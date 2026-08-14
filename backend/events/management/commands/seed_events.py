from django.contrib.auth.models import User
from django.core.management.base import BaseCommand
from django.utils.dateparse import parse_datetime

from accounts.models import Profile
from events.models import Event, Session
from events.views import generate_seats_for_session


USERS = [
    ('organizador', 'organizador123', 'organizer'),
    ('cliente1', 'cliente123', 'client'),
    ('cliente2', 'cliente123', 'client'),
    ('portaria', 'portaria123', 'gate'),
]

SEED_EVENTS = [
    {
        'id': '11111111-1111-1111-1111-111111111111',
        'title': 'Arctic Monkeys ao Vivo',
        'type': 'show',
        'description': 'Turnê mundial com os clássicos e músicas novas.',
        'venue': 'Allianz Parque, São Paulo',
        'state': 'SP',
    },
    {
        'id': '22222222-2222-2222-2222-222222222222',
        'title': 'Duna: Parte Dois',
        'type': 'filme',
        'description': 'Paul Atreides une forças com Chani e os Fremen.',
        'venue': 'Cinemark Shopping Eldorado',
        'state': 'SP',
    },
]

SEED_SESSIONS = [
    {
        'id': 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        'event_id': '11111111-1111-1111-1111-111111111111',
        'datetime': '2026-09-15T21:00:00+00:00',
        'room': 'Pista',
        'price': '280.00',
        'capacity': 500,
        'seating_mode': 'quantity',
        'seat_rows': 0,
        'seat_cols': 0,
    },
    {
        'id': 'cccccccc-cccc-cccc-cccc-cccccccccccc',
        'event_id': '22222222-2222-2222-2222-222222222222',
        'datetime': '2026-08-20T19:30:00+00:00',
        'room': 'Sala 3',
        'price': '48.00',
        'capacity': 40,
        'seating_mode': 'seats',
        'seat_rows': 5,
        'seat_cols': 8,
    },
]


class Command(BaseCommand):
    help = 'Seed users, events and sessions for demo'

    def handle(self, *args, **options):
        organizer = None
        for username, password, role in USERS:
            user, created = User.objects.get_or_create(username=username)
            if created:
                user.set_password(password)
                user.save()
            else:
                user.set_password(password)
                user.save()
            Profile.objects.update_or_create(
                user=user,
                defaults={'role': role},
            )
            if role == 'organizer':
                organizer = user
            self.stdout.write(f'User {username} / {password} ({role})')

        for data in SEED_EVENTS:
            Event.objects.update_or_create(
                id=data['id'],
                defaults={
                    'title': data['title'],
                    'type': data['type'],
                    'description': data['description'],
                    'venue': data['venue'],
                    'state': data.get('state', 'SP'),
                    'organizer': organizer,
                },
            )

        for data in SEED_SESSIONS:
            session, _ = Session.objects.update_or_create(
                id=data['id'],
                defaults={
                    'event_id': data['event_id'],
                    'datetime': parse_datetime(data['datetime']),
                    'room': data['room'],
                    'price': data['price'],
                    'capacity': data['capacity'],
                    'seating_mode': data['seating_mode'],
                    'seat_rows': data['seat_rows'],
                    'seat_cols': data['seat_cols'],
                },
            )
            if session.seating_mode == Session.SeatingMode.SEATS:
                if not session.seats.exists():
                    generate_seats_for_session(session)

        self.stdout.write(self.style.SUCCESS('Seed concluído.'))

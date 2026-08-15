from datetime import timedelta

from django.contrib.auth.models import User
from django.utils import timezone
from rest_framework.test import APITestCase

from accounts.models import Profile
from events.models import Event, Order, Seat, Session
from events.views import generate_seats_for_session


class OrderAndGateTests(APITestCase):
    def setUp(self):
        self.organizer = self._user('org', 'organizer')
        self.client1 = self._user('c1', 'client')
        self.client2 = self._user('c2', 'client')
        self.gate = self._user('gateu', 'gate')
        self.event = Event.objects.create(
            title='Filme teste',
            type=Event.Type.FILME,
            description='Desc',
            venue='Sala 1',
            state=Event.State.SP,
            organizer=self.organizer,
        )
        self.session = Session.objects.create(
            event=self.event,
            datetime=timezone.now(),
            room='Sala 1',
            price='40.00',
            capacity=4,
            seating_mode=Session.SeatingMode.SEATS,
            seat_rows=1,
            seat_cols=4,
        )
        generate_seats_for_session(self.session)

    def _user(self, username, role):
        user = User.objects.create_user(username=username, password='pass12345')
        Profile.objects.create(user=user, role=role)
        return user

    def _auth(self, user):
        self.client.force_authenticate(user=user)

    def _first_available_seat(self):
        return Seat.objects.filter(
            session=self.session,
            status=Seat.Status.AVAILABLE,
        ).first()

    def _hold_seat(self, user, seat=None):
        self._auth(user)
        seat = seat or self._first_available_seat()
        response = self.client.post(
            '/api/orders/',
            {
                'sessionId': str(self.session.id),
                'seatIds': [str(seat.id)],
                'quantity': 1,
            },
            format='json',
        )
        return response, seat

    def test_second_client_cannot_hold_same_seat(self):
        first, seat = self._hold_seat(self.client1)
        self.assertEqual(first.status_code, 201)
        second, _ = self._hold_seat(self.client2, seat)
        self.assertEqual(second.status_code, 400)
        seat.refresh_from_db()
        self.assertEqual(seat.status, Seat.Status.HELD)

    def test_refused_pay_releases_seat(self):
        created, seat = self._hold_seat(self.client1)
        order_id = created.data['id']
        refused = self.client.post(
            f'/api/orders/{order_id}/pay/',
            {'approve': False},
            format='json',
        )
        self.assertEqual(refused.status_code, 200)
        self.assertEqual(refused.data['status'], 'failed')
        seat.refresh_from_db()
        self.assertEqual(seat.status, Seat.Status.AVAILABLE)

    def test_cancel_paid_restores_stock(self):
        created, seat = self._hold_seat(self.client1)
        order_id = created.data['id']
        paid = self.client.post(
            f'/api/orders/{order_id}/pay/',
            {'approve': True},
            format='json',
        )
        self.assertEqual(paid.status_code, 200)
        self.session.refresh_from_db()
        self.assertEqual(self.session.sold, 1)

        cancelled = self.client.post(f'/api/orders/{order_id}/cancel/')
        self.assertEqual(cancelled.status_code, 200)
        self.assertEqual(cancelled.data['status'], 'cancelled')
        self.session.refresh_from_db()
        self.assertEqual(self.session.sold, 0)
        seat.refresh_from_db()
        self.assertEqual(seat.status, Seat.Status.AVAILABLE)

    def test_gate_valid_then_already_used_then_invalid_after_cancel(self):
        created, _ = self._hold_seat(self.client1)
        order_id = created.data['id']
        paid = self.client.post(
            f'/api/orders/{order_id}/pay/',
            {'approve': True},
            format='json',
        )
        code = paid.data['tickets'][0]['code']

        self._auth(self.gate)
        first = self.client.post(
            '/api/gate/validate/',
            {'code': code, 'eventId': str(self.event.id)},
            format='json',
        )
        self.assertEqual(first.data['result'], 'valid')

        second = self.client.post(
            '/api/gate/validate/',
            {'code': code, 'eventId': str(self.event.id)},
            format='json',
        )
        self.assertEqual(second.data['result'], 'already_used')

        created2, _ = self._hold_seat(self.client1)
        order2 = created2.data['id']
        paid2 = self.client.post(
            f'/api/orders/{order2}/pay/',
            {'approve': True},
            format='json',
        )
        code2 = paid2.data['tickets'][0]['code']
        self.client.post(f'/api/orders/{order2}/cancel/')

        self._auth(self.gate)
        after = self.client.post(
            '/api/gate/validate/',
            {'code': code2, 'eventId': str(self.event.id)},
            format='json',
        )
        self.assertEqual(after.data['result'], 'invalid')

    def test_gate_accepts_share_url(self):
        created, _ = self._hold_seat(self.client1)
        paid = self.client.post(
            f'/api/orders/{created.data["id"]}/pay/',
            {'approve': True},
            format='json',
        )
        ticket = paid.data['tickets'][0]
        self._auth(self.gate)
        url = f'https://example.com{ticket["share_url"]}'
        res = self.client.post(
            '/api/gate/validate/',
            {'code': url, 'eventId': str(self.event.id)},
            format='json',
        )
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data['result'], 'valid')

    def test_expired_hold_releases_seat(self):
        created, seat = self._hold_seat(self.client1)
        Order.objects.filter(pk=created.data['id']).update(
            created_at=timezone.now() - timedelta(minutes=11),
        )
        second, _ = self._hold_seat(self.client2, seat)
        self.assertEqual(second.status_code, 201)
        seat.refresh_from_db()
        self.assertEqual(seat.status, Seat.Status.HELD)

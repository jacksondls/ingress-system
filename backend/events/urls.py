from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    EventViewSet,
    GateValidateView,
    OrderViewSet,
    SessionViewSet,
    TicketViewSet,
    TicketmasterSearchView,
    TmdbSearchView,
    ticket_share,
)

router = DefaultRouter()
router.register('events', EventViewSet, basename='event')
router.register('sessions', SessionViewSet, basename='session')
router.register('orders', OrderViewSet, basename='order')
router.register('tickets', TicketViewSet, basename='ticket')

urlpatterns = [
    path('tmdb/search/', TmdbSearchView.as_view(), name='tmdb-search'),
    path(
        'ticketmaster/search/',
        TicketmasterSearchView.as_view(),
        name='ticketmaster-search',
    ),
    path('gate/validate/', GateValidateView.as_view(), name='gate-validate'),
    path('tickets/share/<str:token>/', ticket_share, name='ticket-share'),
    path('', include(router.urls)),
]

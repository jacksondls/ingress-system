from django.contrib import admin

from .models import Event, Order, Seat, Session, Ticket


class SessionInline(admin.TabularInline):
    model = Session
    extra = 0


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ('title', 'type', 'state', 'venue', 'created_at')
    list_filter = ('type', 'state')
    search_fields = ('title', 'venue')
    inlines = [SessionInline]


@admin.register(Session)
class SessionAdmin(admin.ModelAdmin):
    list_display = (
        'event',
        'datetime',
        'room',
        'price',
        'capacity',
        'sold',
        'seating_mode',
    )


@admin.register(Seat)
class SeatAdmin(admin.ModelAdmin):
    list_display = ('session', 'row', 'number', 'status')
    list_filter = ('status',)


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'client', 'session', 'quantity', 'status', 'created_at')
    list_filter = ('status',)


@admin.register(Ticket)
class TicketAdmin(admin.ModelAdmin):
    list_display = ('code', 'order', 'seat', 'status', 'used_at')
    list_filter = ('status',)

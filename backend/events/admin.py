from django.contrib import admin

from .models import Event, Order, Session, Ticket


class SessionInline(admin.TabularInline):
    model = Session
    extra = 0


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ('title', 'type', 'venue', 'created_at')
    list_filter = ('type',)
    search_fields = ('title', 'venue')
    inlines = [SessionInline]


@admin.register(Session)
class SessionAdmin(admin.ModelAdmin):
    list_display = ('event', 'datetime', 'room', 'price', 'capacity', 'sold')


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'client', 'session', 'quantity', 'status', 'created_at')
    list_filter = ('status',)


@admin.register(Ticket)
class TicketAdmin(admin.ModelAdmin):
    list_display = ('code', 'order', 'status', 'used_at')
    list_filter = ('status',)

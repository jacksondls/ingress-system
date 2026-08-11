from rest_framework.permissions import BasePermission, SAFE_METHODS


def get_role(user):
    if not user or not user.is_authenticated:
        return None
    profile = getattr(user, 'profile', None)
    return profile.role if profile else None


class IsOrganizer(BasePermission):
    def has_permission(self, request, view):
        return get_role(request.user) == 'organizer'


class IsClient(BasePermission):
    def has_permission(self, request, view):
        return get_role(request.user) == 'client'


class IsGate(BasePermission):
    def has_permission(self, request, view):
        return get_role(request.user) == 'gate'


class IsOrganizerOrReadOnly(BasePermission):
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return get_role(request.user) == 'organizer'

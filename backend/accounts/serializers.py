from django.contrib.auth.models import User
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import Profile


class ProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = Profile
        fields = ('username', 'role')


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        profile = getattr(self.user, 'profile', None)
        data['user'] = {
            'id': self.user.id,
            'username': self.user.username,
            'role': profile.role if profile else None,
        }
        return data


class MeSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ('id', 'username', 'role')

    def get_role(self, obj):
        profile = getattr(obj, 'profile', None)
        return profile.role if profile else None

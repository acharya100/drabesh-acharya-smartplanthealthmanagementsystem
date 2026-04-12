from django.contrib import admin
from .models import ChatRoom, ChatMessage


@admin.register(ChatRoom)
class ChatRoomAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'title', 'is_active', 'created_at', 'updated_at']
    list_filter = ['is_active']
    search_fields = ['user__username', 'title']


@admin.register(ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
    list_display = ['id', 'room', 'sender_type', 'sender', 'content', 'created_at', 'is_read']
    list_filter = ['sender_type', 'is_read']
    search_fields = ['content', 'sender__username']

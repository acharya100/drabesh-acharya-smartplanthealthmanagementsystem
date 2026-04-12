from rest_framework import serializers
from .models import ChatRoom, ChatMessage


class ChatMessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.SerializerMethodField()
    
    class Meta:
        model = ChatMessage
        fields = ['id', 'room', 'sender_type', 'sender', 'sender_name', 'content', 'created_at', 'is_read']
        read_only_fields = ['id', 'sender', 'sender_name', 'created_at']
    
    def get_sender_name(self, obj):
        if obj.sender:
            return obj.sender.get_full_name() or obj.sender.username
        return "System"


class ChatRoomSerializer(serializers.ModelSerializer):
    last_message = serializers.SerializerMethodField()
    message_count = serializers.SerializerMethodField()
    
    class Meta:
        model = ChatRoom
        fields = ['id', 'user', 'title', 'created_at', 'updated_at', 'is_active', 'last_message', 'message_count']
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']
    
    def get_last_message(self, obj):
        msg = obj.messages.order_by('-created_at').first()
        if msg:
            return {'content': msg.content[:100], 'sender_type': msg.sender_type, 'created_at': msg.created_at}
        return None
    
    def get_message_count(self, obj):
        return obj.messages.count()


class ChatRoomDetailSerializer(ChatRoomSerializer):
    messages = ChatMessageSerializer(many=True, read_only=True)
    
    class Meta(ChatRoomSerializer.Meta):
        fields = ChatRoomSerializer.Meta.fields + ['messages']

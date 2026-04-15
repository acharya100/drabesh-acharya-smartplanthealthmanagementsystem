import time
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from typing import Any
from .models import ChatRoom, ChatMessage
from .serializers import ChatRoomSerializer, ChatRoomDetailSerializer, ChatMessageSerializer
from .plant_ai import get_ai_response


class ChatRoomViewSet(viewsets.ModelViewSet):
    """Chat rooms — users see only their own; staff see all."""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ChatRoomSerializer

    def get_queryset(self): # type: ignore[reportIncompatibleMethodOverride]
        if self.request.user.is_staff:
            return ChatRoom.objects.all().prefetch_related('messages')
        return ChatRoom.objects.filter(user=self.request.user).prefetch_related('messages')

    def get_serializer_class(self): # type: ignore[reportIncompatibleMethodOverride]
        if self.action == 'retrieve':
            return ChatRoomDetailSerializer
        return ChatRoomSerializer

    def perform_create(self, serializer):
        room = serializer.save(user=self.request.user)
        
        ChatMessage.objects.create(
            room=room,
            sender=None,
            sender_type='expert',
            content=(
                "Hi there! How can I help you today?\n\n"
                "I can answer questions about plant diseases, soil health, fertilizers, pest control, "
                "and how to use any part of this system. Just ask."
            ),
        )


    @action(detail=True, methods=['get'])
    def messages(self, request, pk=None):
        """Get all messages for a room, mark them read."""
        room = self.get_object()
        if not request.user.is_staff:
            room.messages.filter(sender_type='expert', is_read=False).update(is_read=True)
        msgs = room.messages.order_by('created_at')
        return Response(ChatMessageSerializer(msgs, many=True).data)

    @action(detail=True, methods=['post'])
    def send(self, request, pk=None):
        """Send a message and generate AI response for regular users."""
        room = self.get_object()
        content = request.data.get('content', '').strip()
        if not content:
            return Response({'error': 'Message content is required.'}, status=status.HTTP_400_BAD_REQUEST)

        sender_type = 'expert' if request.user.is_staff else 'user'

        # Save user/staff message
        msg = ChatMessage.objects.create(
            room=room,
            sender=request.user,
            sender_type=sender_type,
            content=content,
        )
        room.save()

        # Auto-generate AI reply only for non-staff user messages
        if sender_type == 'user':
            ai_content = get_ai_response(content)
            ChatMessage.objects.create(
                room=room,
                sender=None,
                sender_type='expert',
                content=ai_content,
            )
            room.save()

        return Response(ChatMessageSerializer(msg).data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'])
    def my_rooms(self, request):
        """Quick endpoint for user's own rooms."""
        rooms = ChatRoom.objects.filter(user=request.user).prefetch_related('messages')
        return Response(ChatRoomSerializer(rooms, many=True).data)

    @action(detail=False, methods=['get'])
    def pending(self, request):
        """For admins — rooms with unanswered user messages."""
        if not request.user.is_staff:
            return Response({'error': 'Admin only.'}, status=403)
        rooms = ChatRoom.objects.filter(
            messages__sender_type='user',
            is_active=True
        ).distinct().prefetch_related('messages')
        return Response(ChatRoomDetailSerializer(rooms, many=True).data)

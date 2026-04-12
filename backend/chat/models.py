from django.db import models
from django.conf import settings


class ChatRoom(models.Model):
    """A conversation thread between a user and experts."""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='chat_rooms')
    title = models.CharField(max_length=255, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['-updated_at']

    def __str__(self):
        return f"Chat #{self.id} - {self.user.username}"

    def save(self, *args, **kwargs):
        if not self.title:
            self.title = f"Conversation {self.id or 'New'}"
        super().save(*args, **kwargs)


class ChatMessage(models.Model):
    """Individual message within a chat room."""
    SENDER_CHOICES = [
        ('user', 'User'),
        ('expert', 'Expert'),
        ('system', 'System'),
    ]
    
    room = models.ForeignKey(ChatRoom, on_delete=models.CASCADE, related_name='messages')
    sender_type = models.CharField(max_length=10, choices=SENDER_CHOICES, default='user')
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"{self.sender_type}: {self.content[:50]}"

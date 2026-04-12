from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone

class Category(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    slug = models.SlugField(unique=True, blank=True)
    icon = models.CharField(max_length=10, blank=True, default='🌿')  # emoji icon
    name_ne = models.CharField(max_length=100, blank=True, null=True)
    description_ne = models.TextField(blank=True, null=True)

    class Meta:
        verbose_name_plural = "Categories"

    def __str__(self):
        return self.name

class Product(models.Model):
    category = models.ForeignKey(Category, related_name='products', on_delete=models.CASCADE)
    name = models.CharField(max_length=200)
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    discount_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, validators=[MinValueValidator(0)])
    sku = models.CharField(max_length=50, blank=True, unique=True, null=True)
    stock = models.PositiveIntegerField(default=0)
    low_stock_threshold = models.PositiveIntegerField(default=10)
    image = models.ImageField(upload_to='products/', blank=True, null=True)
    is_active = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False)
    is_organic = models.BooleanField(default=False)
    usage_instructions = models.TextField(blank=True)
    name_ne = models.CharField(max_length=200, blank=True, null=True)
    description_ne = models.TextField(blank=True, null=True)
    usage_instructions_ne = models.TextField(blank=True, null=True)
    tags = models.CharField(max_length=200, blank=True, help_text='Comma-separated tags e.g. bestseller,premium')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    @property
    def average_rating(self):
        reviews = self.reviews.all()
        if reviews.exists():
            return round(sum(r.rating for r in reviews) / reviews.count(), 1)
        return 0

    @property
    def review_count(self):
        return self.reviews.count()

    @property
    def effective_price(self):
        """Returns discount price if set, otherwise the normal price."""
        return self.discount_price if self.discount_price else self.price

    @property
    def is_low_stock(self):
        return self.stock <= self.low_stock_threshold

    @property
    def tag_list(self):
        if self.tags:
            return [t.strip() for t in self.tags.split(',') if t.strip()]
        return []

class Coupon(models.Model):
    """Discount coupons applicable at checkout."""
    DISCOUNT_TYPE_CHOICES = [
        ('percentage', 'Percentage'),
        ('fixed', 'Fixed Amount (NPR)'),
    ]
    code = models.CharField(max_length=50, unique=True)
    discount_type = models.CharField(max_length=20, choices=DISCOUNT_TYPE_CHOICES, default='percentage')
    discount_value = models.DecimalField(max_digits=8, decimal_places=2, validators=[MinValueValidator(0)])
    min_order_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    max_uses = models.PositiveIntegerField(null=True, blank=True, help_text='Leave blank for unlimited uses')
    used_count = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    valid_from = models.DateTimeField(default=timezone.now)
    valid_until = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.code} ({self.discount_type}: {self.discount_value})"

    @property
    def is_valid(self):
        now = timezone.now()
        if not self.is_active:
            return False
        if self.valid_until and now > self.valid_until:
            return False
        if self.max_uses and self.used_count >= self.max_uses:
            return False
        return True

    def calculate_discount(self, order_total):
        """Return the discount amount for a given order total."""
        if order_total < self.min_order_amount:
            return 0
        if self.discount_type == 'percentage':
            return round((self.discount_value / 100) * order_total, 2)
        return min(self.discount_value, order_total)

class Order(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('shipped', 'Shipped'),
        ('delivered', 'Delivered'),
        ('cancelled', 'Cancelled'),
    )
    PAYMENT_STATUS_CHOICES = [
        ('unpaid', 'Unpaid'),
        ('paid', 'Paid'),
        ('refunded', 'Refunded'),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='orders', on_delete=models.CASCADE)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='unpaid')
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    coupon = models.ForeignKey(Coupon, null=True, blank=True, on_delete=models.SET_NULL, related_name='orders')
    shipping_address = models.TextField()
    phone_number = models.CharField(max_length=20, blank=True)
    payment_method = models.CharField(max_length=20, default='cod')
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Order #{self.id} by {self.user.username}"

class OrderItem(models.Model):
    order = models.ForeignKey(Order, related_name='items', on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.PositiveIntegerField(default=1)

    @property
    def subtotal(self):
        return self.price * self.quantity

    def __str__(self):
        return f"{self.quantity} x {self.product.name}"

class Review(models.Model):
    """User reviews and ratings for products."""
    product = models.ForeignKey(Product, related_name='reviews', on_delete=models.CASCADE)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='reviews', on_delete=models.CASCADE)
    rating = models.PositiveIntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('product', 'user')  # One review per user per product

    def __str__(self):
        return f"{self.user.username} rated {self.product.name} {self.rating}/5"

class Wishlist(models.Model):
    """User's saved/favorited products."""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='wishlist', on_delete=models.CASCADE)
    product = models.ForeignKey(Product, related_name='wishlisted_by', on_delete=models.CASCADE)
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'product')

    def __str__(self):
        return f"{self.user.username} wishlisted {self.product.name}"

class SavedAddress(models.Model):
    """User's saved shipping addresses."""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='saved_addresses', on_delete=models.CASCADE)
    label = models.CharField(max_length=50, default='Home')  # Home, Office, etc.
    full_address = models.TextField()
    phone = models.CharField(max_length=20)
    is_default = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.label}"

class Notification(models.Model):
    """User notifications for order updates, stock alerts, etc."""
    TYPE_CHOICES = [
        ('order_placed', 'Order Placed'),
        ('order_shipped', 'Order Shipped'),
        ('order_delivered', 'Order Delivered'),
        ('order_cancelled', 'Order Cancelled'),
        ('low_stock', 'Low Stock Alert'),
        ('back_in_stock', 'Back in Stock'),
        ('general', 'General'),
    ]
    user = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='notifications', on_delete=models.CASCADE)
    notification_type = models.CharField(max_length=30, choices=TYPE_CHOICES, default='general')
    title = models.CharField(max_length=200)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    link = models.CharField(max_length=200, blank=True)  # Optional URL to navigate
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username}: {self.title}"

class DiseaseProductMapping(models.Model):
    """Links detected diseases to recommended products."""
    disease_name = models.CharField(max_length=200)  # Match against prediction disease name
    disease_name_ne = models.CharField(max_length=200, blank=True, null=True)
    product = models.ForeignKey(Product, related_name='disease_mappings', on_delete=models.CASCADE)
    priority = models.PositiveIntegerField(default=1)  # Lower = higher priority
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ['priority']

    def __str__(self):
        return f"{self.disease_name} → {self.product.name}"

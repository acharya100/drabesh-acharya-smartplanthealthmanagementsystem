from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.conf import settings
from .models import Order

def send_order_confirmation_email(order_id):
    try:
        order = Order.objects.get(id=order_id)
        user = order.user
        items = order.items.all()
        
        item_names = ", ".join([f"{item.product.name} (x{item.quantity})" for item in items])
        subject = f'Order Confirmation - {item_names} | Smart Plant Health'
        from_email = settings.DEFAULT_FROM_EMAIL
        to_email = [user.email]
        
        # Professional HTML Content
        html_content = f"""
        <html>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0;">
            <div style="max-width: 600px; margin: 20px auto; border: 1px solid #e0e0e0; border-top: 5px solid #10b981; border-bottom: 5px solid #10b981; border-radius: 8px; overflow: hidden; background-color: #ffffff;">
                <div style="padding: 30px; background-color: #f8fafc; text-align: center; border-bottom: 1px solid #e0e0e0;">
                    <h1 style="color: #065f46; margin: 0; font-size: 24px;">Order Confirmed!</h1>
                    <p style="color: #6b7280; font-size: 14px;">Thank you for your purchase from Smart Plant Health Management System.</p>
                </div>
                
                <div style="padding: 30px;">
                    <p>Dear <strong>{user.get_full_name() or user.username}</strong>,</p>
                    <p>Your order has been placed successfully. We are currently processing it and will notify you once it has been shipped.</p>
                    
                    <div style="background-color: #f1f5f9; padding: 15px; border-radius: 6px; margin: 20px 0;">
                        <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 4px 0; color: #64748b;">Order Number:</td>
                                <td style="padding: 4px 0; font-weight: 600; text-align: right;">#{order.id}</td>
                            </tr>
                            <tr>
                                <td style="padding: 4px 0; color: #64748b;">Date:</td>
                                <td style="padding: 4px 0; font-weight: 600; text-align: right;">{order.created_at.strftime('%B %d, %Y')}</td>
                            </tr>
                            <tr>
                                <td style="padding: 4px 0; color: #64748b;">Payment Method:</td>
                                <td style="padding: 4px 0; font-weight: 600; text-align: right;">{order.payment_method.upper()}</td>
                            </tr>
                            {f'''<tr>
                                <td style="padding: 4px 0; color: #64748b;">Coupon Used:</td>
                                <td style="padding: 4px 0; font-weight: 600; text-align: right; color: #10b981;">{order.coupon.code}</td>
                            </tr>''' if order.coupon else ""}
                        </table>
                    </div>
                    
                    <h3 style="border-bottom: 1px solid #e2e8f0; padding-bottom: 10px; margin-top: 30px; font-size: 18px; color: #1e293b;">Order Summary</h3>
                    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                        <thead>
                            <tr style="text-align: left; border-bottom: 2px solid #f1f5f9;">
                                <th style="padding: 10px 0; color: #64748b; font-size: 12px; text-transform: uppercase;">Product</th>
                                <th style="padding: 10px 0; color: #64748b; font-size: 12px; text-transform: uppercase; text-align: center;">Qty</th>
                                <th style="padding: 10px 0; color: #64748b; font-size: 12px; text-transform: uppercase; text-align: right;">Price</th>
                            </tr>
                        </thead>
                        <tbody>
        """
        
        for item in items:
            html_content += f"""
                            <tr style="border-bottom: 1px solid #f1f5f9;">
                                <td style="padding: 15px 0;">
                                    <span style="font-weight: 600; color: #1e293b;">{item.product.name}</span>
                                </td>
                                <td style="padding: 15px 0; text-align: center; color: #64748b;">{item.quantity}</td>
                                <td style="padding: 15px 0; text-align: right; color: #1e293b; font-weight: 600;">NPR {item.price:,.2f}</td>
                            </tr>
            """
            
        html_content += f"""
                        </tbody>
                    </table>
                    
                    <div style="margin-left: auto; width: 220px;">
                        <table style="width: 100%; font-size: 14px;">
                            <tr>
                                <td style="padding: 5px 0; color: #64748b;">Subtotal:</td>
                                <td style="padding: 5px 0; text-align: right; font-weight: 600;">NPR {sum(item.subtotal for item in items):,.2f}</td>
                            </tr>
        """
        
        if order.discount_amount > 0:
            html_content += f"""
                            <tr>
                                <td style="padding: 5px 0; color: #ef4444;">Discount:</td>
                                <td style="padding: 5px 0; text-align: right; color: #ef4444; font-weight: 600;">-NPR {order.discount_amount:,.2f}</td>
                            </tr>
            """
            
        html_content += f"""
                            <tr style="border-top: 2px solid #10b981; font-size: 18px;">
                                <td style="padding: 15px 0; font-weight: 800; color: #065f46;">Total:</td>
                                <td style="padding: 15px 0; text-align: right; font-weight: 800; color: #065f46;">NPR {order.total_amount:,.2f}</td>
                            </tr>
                        </table>
                    </div>
                    
                    <div style="margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 30px;">
                        <h3 style="font-size: 16px; color: #1e293b; margin-bottom: 15px;">Shipping Information</h3>
                        <p style="font-size: 14px; color: #64748b; line-height: 1.5; background: #f8fafc; padding: 15px; border-radius: 6px; border-left: 4px solid #cbd5e1;">
                            {order.shipping_address}
                        </p>
                    </div>
                </div>
                
                <div style="padding: 30px; background-color: #064e3b; color: #ffffff; text-align: center;">
                    <p style="margin: 0; font-size: 14px;">Happy Gardening!</p>
                    <p style="margin: 5px 0 0; font-size: 12px; opacity: 0.8;">Smart Plant Health Management System &copy; 2026</p>
                </div>
            </div>
            <div style="text-align: center; padding: 20px; font-size: 12px; color: #94a3b8;">
                This is an automated message. Please do not reply to this email.
            </div>
        </body>
        </html>
        """
        
        text_content = strip_tags(html_content)
        
        msg = EmailMultiAlternatives(subject, text_content, from_email, to_email)
        msg.attach_alternative(html_content, "text/html")
        msg.send()
        print(f"DEBUG: Professional email sent successfully to {user.email} for Order #{order.id}")
        return True
    except Exception as e:
        print(f"ERROR: Failed to send professional email for Order #{order_id}: {str(e)}")
        return False

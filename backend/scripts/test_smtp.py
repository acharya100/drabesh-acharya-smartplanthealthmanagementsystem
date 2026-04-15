"""
Run this from the backend directory:
  python test_smtp.py

It will tell you EXACTLY which email+password combination works.
"""
import smtplib

EMAIL_HOST_USER = "drabeshacharya@gmail.com"   # confirmed account
EMAIL_HOST_PASSWORD = "yaptbukwmnmbmgrr"        # new App Password

print(f"\n[TEST] Trying to authenticate as: {EMAIL_HOST_USER}")
print(f"[TEST] Using App Password:         {EMAIL_HOST_PASSWORD}")
print()

try:
    with smtplib.SMTP("smtp.gmail.com", 587) as s:
        s.ehlo()
        s.starttls()
        s.login(EMAIL_HOST_USER, EMAIL_HOST_PASSWORD)
        print("✅ SUCCESS! Credentials are CORRECT.")
        print(f"   Your .env is properly configured for {EMAIL_HOST_USER}")
except smtplib.SMTPAuthenticationError as e:
    print("❌ FAILED: Authentication error.")
    print(f"   Error: {e}")
    print()
    print("──────────────────────────────────────────────────────")
    print("FIX: The App Password was NOT generated from this account.")
    print("SOLUTION: Go to https://myaccount.google.com/apppasswords")
    print("          while logged into:", EMAIL_HOST_USER)
    print("          Generate a brand new App Password → paste it in .env")
    print("──────────────────────────────────────────────────────")
except Exception as e:
    print(f"❌ Unexpected error: {e}")

#!/usr/bin/env python3
"""
Simple SMTP email test script.
"""

import smtplib
from email.mime.text import MIMEText

# SMTP settings
SMTP_HOST = "smtp.zoho.com"
SMTP_PORT = 587
SMTP_USE_TLS = True
SMTP_USER = "noreply@opensok.com"
SMTP_PASSWORD = "Casa1010100693002005@gmail.com"

# Email settings
TO_EMAIL = "5454fey@2200freefonts.com"

try:
    # Connect to SMTP server
    server = smtplib.SMTP(SMTP_HOST, SMTP_PORT)
    
    if SMTP_USE_TLS:
        server.starttls()
    
    # Authenticate
    server.login(SMTP_USER, SMTP_PASSWORD)
    
    # Create message
    msg = MIMEText("This is a test email from Matcha backend.")
    msg['Subject'] = "Matcha - SMTP Test"
    msg['From'] = SMTP_USER
    msg['To'] = TO_EMAIL
    
    # Send email
    server.send_message(msg)
    server.quit()
    
    print("✅ Email sent successfully!")
    
except Exception as e:
    print(f"❌ Error: {e}")

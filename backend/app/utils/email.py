import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from config import Config

def send_verification_email(email: str, token: str):
    """Send email verification link"""
    verification_url = f"{Config.VERIFICATION_URL}/{token}"
    
    msg = MIMEMultipart('alternative')
    msg['Subject'] = "Verify your Matcha account"
    msg['From'] = Config.EMAIL_HOST_USER
    msg['To'] = email
    
    html = f"""
    <html>
      <body>
        <h2>Welcome to Matcha!</h2>
        <p>Click the link below to verify your account:</p>
        <a href="{verification_url}">{verification_url}</a>
        <p>This link expires in 24 hours.</p>
      </body>
    </html>
    """
    
    msg.attach(MIMEText(html, 'html'))
    
    try:
        # Connect to SMTP server (same pattern as test_smtp.py)
        server = smtplib.SMTP(Config.EMAIL_HOST, Config.EMAIL_PORT)
        
        if Config.EMAIL_USE_TLS:
            server.starttls()
        
        # Authenticate
        server.login(Config.EMAIL_HOST_USER, Config.EMAIL_HOST_PASSWORD)
        
        # Send email
        server.send_message(msg)
        server.quit()
        
        return True
        
    except Exception as e:
        print(f"Email sending failed: {e}")
        import traceback
        traceback.print_exc()
        return False
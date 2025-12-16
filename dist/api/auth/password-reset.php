<?php
// Karl's GIR - Password Reset Email Handler
// Sends password reset emails with site-styled design

require_once __DIR__ . '/../common/environment.php';

function sendPasswordResetEmail($email, $token) {
    // Get the base URL using environment detection
    $baseUrl = getBaseUrl();
    
    // Use hash router format for React Router (#/reset-password)
    $resetUrl = $baseUrl . '/#/reset-password?token=' . urlencode($token) . '&email=' . urlencode($email);
    $expiresIn = '1 hour';
    
    $subject = "Karl Golf GIR - Password Reset Request";
    
    $htmlContent = buildPasswordResetEmail($resetUrl, $expiresIn);
    
    // Email headers
    $headers = "MIME-Version: 1.0\r\n";
    $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
    $headers .= "From: Karl Golf GIR <noreply@karlgolf.app>\r\n";
    $headers .= "Reply-To: noreply@karlgolf.app\r\n";
    $headers .= "X-Mailer: PHP/" . phpversion();
    
    return mail($email, $subject, $htmlContent, $headers);
}

function buildPasswordResetEmail($resetUrl, $expiresIn) {
    // Get the domain for footer link using environment detection
    $domain = getDomain();
    $html = <<<HTML
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6; 
            color: #DDEDD2; 
            background-color: #0a140a;
            margin: 0;
            padding: 20px;
        }
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #0a140a;
            border-radius: 12px;
            overflow: hidden;
        }
        .header { 
            background: rgba(221, 237, 210, 0.2); 
            border: 2px solid #DDEDD2;
            color: #DDEDD2; 
            padding: 40px 30px; 
            text-align: center; 
            border-radius: 12px;
            margin-bottom: 30px;
        }
        .header h1 { 
            margin: 0; 
            font-size: 32px; 
            font-weight: bold;
            color: #DDEDD2;
        }
        .header p {
            margin: 10px 0 0 0;
            font-size: 16px;
            opacity: 0.9;
        }
        .content {
            padding: 40px 30px;
            background-color: #0a140a;
        }
        .content p {
            color: #DDEDD2;
            font-size: 16px;
            margin: 0 0 20px 0;
            line-height: 1.6;
        }
        .button-container {
            text-align: center;
            margin: 30px 0;
        }
        .reset-button {
            display: inline-block;
            background: #DDEDD2;
            color: #0a140a;
            padding: 16px 32px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: bold;
            font-size: 16px;
            border: 2px solid #DDEDD2;
            transition: all 0.2s;
        }
        .reset-button:hover {
            background: rgba(221, 237, 210, 0.8);
            transform: translateY(-2px);
        }
        .warning-box {
            background: rgba(242, 209, 164, 0.2);
            border: 2px solid #F2D1A4;
            border-left: 4px solid #F2D1A4;
            padding: 16px;
            border-radius: 6px;
            margin: 25px 0;
        }
        .warning-box p {
            margin: 0;
            color: #F2D1A4;
            font-size: 14px;
            font-weight: 500;
        }
        .info-box {
            background: rgba(221, 237, 210, 0.2);
            border: 2px solid #DDEDD2;
            border-left: 4px solid #DDEDD2;
            padding: 16px;
            border-radius: 6px;
            margin: 25px 0;
        }
        .info-box p {
            margin: 0;
            color: #DDEDD2;
            font-size: 14px;
        }
        .footer { 
            text-align: center; 
            padding: 30px;
            background-color: #0a140a;
            border-top: 2px solid rgba(221, 237, 210, 0.3);
        }
        .footer p {
            color: #DDEDD2;
            font-size: 14px;
            margin: 5px 0;
            opacity: 0.9;
        }
        .footer strong {
            color: #DDEDD2;
            font-size: 16px;
        }
        .footer a {
            color: #DDEDD2;
            text-decoration: none;
        }
        .footer a:hover {
            text-decoration: underline;
        }
        .link-fallback {
            margin-top: 20px;
            padding: 15px;
            background: rgba(221, 237, 210, 0.1);
            border: 1px solid rgba(221, 237, 210, 0.3);
            border-radius: 6px;
            word-break: break-all;
        }
        .link-fallback p {
            margin: 0;
            font-size: 12px;
            color: #DDEDD2;
            opacity: 0.8;
        }
        .link-fallback code {
            color: #DDEDD2;
            font-size: 11px;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>⛳ Karl Golf GIR</h1>
            <p>Password Reset Request</p>
        </div>
        
        <div class="content">
            <p>Hello,</p>
            
            <p>We received a request to reset your password for your Karl Golf GIR account. Click the button below to create a new password:</p>
            
            <div class="button-container">
                <a href="{$resetUrl}" class="reset-button">Reset Password</a>
            </div>
            
            <div class="warning-box">
                <p><strong>⚠️ Security Notice:</strong> This link will expire in {$expiresIn}. If you didn't request this, you can safely ignore this email.</p>
            </div>
            
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            
            <div class="link-fallback">
                <p><code>{$resetUrl}</code></p>
            </div>
            
            <div class="info-box">
                <p><strong>💡 Tip:</strong> For security, never share your password reset link with anyone.</p>
            </div>
        </div>
        
        <div class="footer">
            <p><strong>Karl Golf GIR</strong> - Golf Performance Tracker</p>
            <p>Track your game. Improve your score. 🏌️‍♂️</p>
            <p style="margin-top: 15px;">
                <a href="https://{$domain}">Visit {$domain}</a>
            </p>
        </div>
    </div>
</body>
</html>
HTML;

    return $html;
}
?>


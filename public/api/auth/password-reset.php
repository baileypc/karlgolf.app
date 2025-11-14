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
    
    $subject = "Karl's GIR - Password Reset Request";
    
    $htmlContent = buildPasswordResetEmail($resetUrl, $expiresIn);
    
    // Email headers
    $headers = "MIME-Version: 1.0\r\n";
    $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
    $headers .= "From: Karl's GIR <noreply@karlsgolf.app>\r\n";
    $headers .= "Reply-To: noreply@karlsgolf.app\r\n";
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
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
            line-height: 1.6; 
            color: #e2e8f0; 
            background-color: #0f172a;
            margin: 0;
            padding: 20px;
        }
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #1e293b;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
        }
        .header { 
            background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); 
            color: white; 
            padding: 40px 30px; 
            text-align: center; 
        }
        .header h1 { 
            margin: 0; 
            font-size: 32px; 
            font-weight: bold;
        }
        .header p {
            margin: 10px 0 0 0;
            font-size: 16px;
            opacity: 0.95;
        }
        .content {
            padding: 40px 30px;
            background-color: #1e293b;
        }
        .content p {
            color: #e2e8f0;
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
            background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
            color: white;
            padding: 16px 32px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: bold;
            font-size: 16px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
            transition: transform 0.2s;
        }
        .reset-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 8px rgba(0, 0, 0, 0.3);
        }
        .warning-box {
            background-color: #334155;
            border-left: 4px solid #fbbf24;
            padding: 16px;
            border-radius: 6px;
            margin: 25px 0;
        }
        .warning-box p {
            margin: 0;
            color: #fbbf24;
            font-size: 14px;
            font-weight: 500;
        }
        .info-box {
            background-color: #334155;
            border-left: 4px solid #60a5fa;
            padding: 16px;
            border-radius: 6px;
            margin: 25px 0;
        }
        .info-box p {
            margin: 0;
            color: #60a5fa;
            font-size: 14px;
        }
        .footer { 
            text-align: center; 
            padding: 30px;
            background-color: #0f172a;
            border-top: 1px solid #334155;
        }
        .footer p {
            color: #94a3b8;
            font-size: 14px;
            margin: 5px 0;
        }
        .footer a {
            color: #22c55e;
            text-decoration: none;
        }
        .footer a:hover {
            text-decoration: underline;
        }
        .link-fallback {
            margin-top: 20px;
            padding: 15px;
            background-color: #334155;
            border-radius: 6px;
            word-break: break-all;
        }
        .link-fallback p {
            margin: 0;
            font-size: 12px;
            color: #94a3b8;
        }
        .link-fallback code {
            color: #22c55e;
            font-size: 11px;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>⛳ Karl's GIR</h1>
            <p>Password Reset Request</p>
        </div>
        
        <div class="content">
            <p>Hello,</p>
            
            <p>We received a request to reset your password for your Karl's GIR account. Click the button below to create a new password:</p>
            
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
            <p><strong>Karl's GIR</strong> - Golf Performance Tracker</p>
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


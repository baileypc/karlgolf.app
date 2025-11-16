<?php
// Karl Golf GIR - Welcome Email Handler
// Sends welcome emails to new users with site-styled design

require_once __DIR__ . '/../common/environment.php';

function sendWelcomeEmail($email) {
    // Get the base URL using environment detection
    $baseUrl = getBaseUrl();
    $domain = getDomain();
    
    $subject = "Welcome to Karl Golf GIR! ⛳";
    
    $htmlContent = buildWelcomeEmail($baseUrl, $domain);
    
    // Email headers
    $headers = "MIME-Version: 1.0\r\n";
    $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
    $headers .= "From: Karl Golf GIR <noreply@karlgolf.app>\r\n";
    $headers .= "Reply-To: noreply@karlgolf.app\r\n";
    $headers .= "X-Mailer: PHP/" . phpversion();
    
    return mail($email, $subject, $htmlContent, $headers);
}

function buildWelcomeEmail($baseUrl, $domain) {
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
            font-size: 18px;
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
        .content h2 {
            color: #DDEDD2;
            font-size: 20px;
            margin: 30px 0 15px 0;
            font-weight: bold;
        }
        .feature-list {
            margin: 20px 0;
            padding: 0;
        }
        .feature-item {
            background: rgba(221, 237, 210, 0.1);
            border-left: 4px solid #DDEDD2;
            padding: 15px;
            margin: 10px 0;
            border-radius: 6px;
        }
        .feature-item strong {
            color: #DDEDD2;
            font-size: 16px;
            display: block;
            margin-bottom: 5px;
        }
        .feature-item p {
            margin: 0;
            font-size: 14px;
            opacity: 0.9;
        }
        .button-container {
            text-align: center;
            margin: 30px 0;
        }
        .cta-button {
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
        .cta-button:hover {
            background: rgba(221, 237, 210, 0.8);
            transform: translateY(-2px);
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
        .stats-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            margin: 20px 0;
        }
        .stat-card {
            background: rgba(221, 237, 210, 0.1);
            border: 1px solid rgba(221, 237, 210, 0.3);
            padding: 15px;
            border-radius: 6px;
            text-align: center;
        }
        .stat-card .emoji {
            font-size: 24px;
            display: block;
            margin-bottom: 8px;
        }
        .stat-card .label {
            color: #DDEDD2;
            font-size: 14px;
            font-weight: 500;
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
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>⛳ Welcome to Karl Golf GIR!</h1>
            <p>Your account is ready to go</p>
        </div>
        
        <div class="content">
            <p>Hello and welcome!</p>
            
            <p>Thank you for creating your Karl Golf GIR account. You're now ready to start tracking your golf performance and improving your game!</p>
            
            <h2>🏌️ What You Can Track:</h2>
            
            <div class="stats-grid">
                <div class="stat-card">
                    <span class="emoji">🎯</span>
                    <span class="label">Greens in Regulation</span>
                </div>
                <div class="stat-card">
                    <span class="emoji">⛳</span>
                    <span class="label">Putting Stats</span>
                </div>
                <div class="stat-card">
                    <span class="emoji">🏌️</span>
                    <span class="label">Fairway Accuracy</span>
                </div>
                <div class="stat-card">
                    <span class="emoji">📊</span>
                    <span class="label">Score Averages</span>
                </div>
            </div>
            
            <h2>🚀 Getting Started:</h2>
            
            <div class="feature-list">
                <div class="feature-item">
                    <strong>1. Start Your First Round</strong>
                    <p>Click "Start Round" and begin tracking your game hole-by-hole.</p>
                </div>
                <div class="feature-item">
                    <strong>2. Track Key Stats</strong>
                    <p>Record your score, putts, fairway hits, GIR, and penalties for each hole.</p>
                </div>
                <div class="feature-item">
                    <strong>3. View Your Dashboard</strong>
                    <p>See your performance trends and averages across all your rounds.</p>
                </div>
                <div class="feature-item">
                    <strong>4. Export Your Data</strong>
                    <p>Download your rounds as CSV or email yourself summaries after each round.</p>
                </div>
            </div>
            
            <div class="button-container">
                <a href="{$baseUrl}" class="cta-button">Start Tracking Now</a>
            </div>
            
            <div class="info-box">
                <p><strong>💡 Pro Tip:</strong> Karl Golf GIR works great as a mobile app! On your phone, tap "Add to Home Screen" for quick access on the course.</p>
            </div>
            
            <p>We're excited to help you improve your game. If you have any questions or feedback, feel free to reach out!</p>
            
            <p style="margin-top: 30px;">Happy golfing! 🏌️‍♂️</p>
        </div>
        
        <div class="footer">
            <p><strong>Karl Golf GIR</strong> - Golf Performance Tracker</p>
            <p>Track your game. Improve your score.</p>
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



export const getHtmlTemplate = (username: string, link: string, emailType: 'verify' | 'forgotPassword'): string => {
  let message
  let buttonLabel
  let fullLink

  if (emailType === 'verify') {
    message =
      'Thank you for registering with us. To complete your registration, please verify your email address by clicking the button below:'
    buttonLabel = 'Verify Email'
    fullLink = `http://localhost:5173/verify-email?token=${link}`
  } else if (emailType === 'forgotPassword') {
    message = 'We received a request to reset your password. You can reset your password by clicking the button below:'
    buttonLabel = 'Reset Password'
    fullLink = `http://localhost:5173/forgot-password?token=${link}`
  }

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${buttonLabel}</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                background-color: #f4f4f4;
                margin: 0;
                padding: 0;
            }
            .email-container {
                max-width: 600px;
                margin: 20px auto;
                background: #ffffff;
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            }
            .email-header {
                text-align: center;
                background: #007bff;
                color: #ffffff;
                padding: 10px 0;
                border-top-left-radius: 8px;
                border-top-right-radius: 8px;
            }
            .email-body {
                padding: 20px;
            }
            .email-body h2 {
                color: #333333;
            }
            .email-body p {
                color: #666666;
                margin-bottom: 20px;
            }
            .email-footer {
                text-align: center;
                color: #999999;
                padding: 10px;
                border-top: 1px solid #eeeeee;
            }
            .action-button {
                display: inline-block;
                padding: 10px 20px;
                margin-top: 10px;
                color: #ffffff;
                background-color: #007bff;
                border-radius: 5px;
                text-decoration: none;
            }
        </style>
    </head>
    <body>
        <div class="email-container">
            <div class="email-header">
                <h1>${buttonLabel}</h1>
            </div>
            <div class="email-body">
                <h2>Hello, ${username}!</h2>
                <p>${message}</p>
                <a href="${fullLink}" class="action-button">${buttonLabel}</a>
                <p>If you did not request this, please ignore this email.</p>
                <p>Thank you,<br>The Team</p>
            </div>
            <div class="email-footer">
                <p>&copy; 2024 Your Company. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
  `
}

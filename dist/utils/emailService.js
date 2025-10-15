"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createOTPEmailTemplate = exports.generateOTP = exports.sendEmail = void 0;
const createTransporter = () => {
    if (process.env.NODE_ENV === "development") {
        return {
            sendMail: async (mailOptions) => {
                return { messageId: "dev-" + Date.now() };
            },
        };
    }
    try {
        const { SESClient, SendEmailCommand } = require("@aws-sdk/client-ses");
        const sesClient = new SESClient({
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            },
            region: process.env.AWS_REGION || "ap-south-1",
        });
        return {
            sendMail: async (mailOptions) => {
                const command = new SendEmailCommand({
                    Source: mailOptions.from,
                    Destination: {
                        ToAddresses: [mailOptions.to],
                    },
                    Message: {
                        Subject: {
                            Data: mailOptions.subject,
                            Charset: "UTF-8",
                        },
                        Body: {
                            Html: {
                                Data: mailOptions.html,
                                Charset: "UTF-8",
                            },
                        },
                    },
                });
                const result = await sesClient.send(command);
                return { messageId: result.MessageId };
            },
        };
    }
    catch (error) {
        console.error("Failed to initialize AWS SES:", error);
        throw error;
    }
};
const sendEmail = async (options) => {
    const transporter = createTransporter();
    const mailOptions = {
        from: process.env.SES_EMAIL_FROM || "no-reply@manualfits.com",
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || options.html.replace(/<[^>]*>/g, ""),
    };
    try {
        await transporter.sendMail(mailOptions);
    }
    catch (error) {
        console.error("Error sending email:", error);
        throw new Error("Failed to send email");
    }
};
exports.sendEmail = sendEmail;
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};
exports.generateOTP = generateOTP;
const createOTPEmailTemplate = (username, otp) => {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verification - Manualfits</title>
        <style>
            body {
                font-family: 'Arial', sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f4f4f4;
            }
            .container {
                background-color: #ffffff;
                padding: 40px;
                border-radius: 10px;
                box-shadow: 0 0 20px rgba(0,0,0,0.1);
            }
            .header {
                text-align: center;
                margin-bottom: 30px;
            }
            .logo {
                font-size: 28px;
                font-weight: bold;
                color: #2c3e50;
                margin-bottom: 10px;
            }
            .otp-code {
                background-color: #f8f9fa;
                border: 2px solid #e9ecef;
                border-radius: 8px;
                padding: 20px;
                text-align: center;
                margin: 30px 0;
            }
            .otp-number {
                font-size: 36px;
                font-weight: bold;
                color: #2c3e50;
                letter-spacing: 8px;
                font-family: 'Courier New', monospace;
            }
            .message {
                margin: 20px 0;
                font-size: 16px;
            }
            .warning {
                background-color: #fff3cd;
                border: 1px solid #ffeaa7;
                border-radius: 5px;
                padding: 15px;
                margin: 20px 0;
                color: #856404;
            }
            .footer {
                text-align: center;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #e9ecef;
                color: #6c757d;
                font-size: 14px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">Manualfits</div>
                <h1>Email Verification</h1>
            </div>
            
            <div class="message">
                <p>Hello <strong>${username}</strong>,</p>
                <p>Thank you for signing up with Manualfits! To complete your registration, please verify your email address using the OTP code below:</p>
            </div>
            
            <div class="otp-code">
                <div class="otp-number">${otp}</div>
            </div>
            
            <div class="message">
                <p>Enter this code in the verification form to activate your account.</p>
            </div>
            
            <div class="warning">
                <strong>Important:</strong> This OTP will expire in 5 minutes for security reasons. If you didn't request this verification, please ignore this email.
            </div>
            
            <div class="footer">
                <p>Best regards,<br>The Manualfits Team</p>
                <p>This is an automated message. Please do not reply to this email.</p>
            </div>
        </div>
    </body>
    </html>
  `;
};
exports.createOTPEmailTemplate = createOTPEmailTemplate;

import nodemailer from "nodemailer";
import { config } from "../config/index.js";

const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: config.email.port,
  secure: config.email.secure,
  auth: {
    user: config.email.user,
    pass: config.email.pass,
  },
});


export async function sendVerificationEmail(email, name, verificationCode) {
  const mailOptions = {
    from: `"ESSAHUB Platform" <${config.email.user}>`,
    to: email,
    subject: "Email Verification - ESSAHUB",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #0F766E 0%, #14B8A6 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .code-box { background: white; border: 2px dashed #0F766E; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; color: #0F766E; letter-spacing: 8px; margin: 20px 0; border-radius: 8px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
          .button { display: inline-block; padding: 12px 30px; background: #0F766E; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to ESSAHUB!</h1>
          </div>
          <div class="content">
            <h2>Hi ${name},</h2>
            <p>Thank you for registering with ESSAHUB Ladies Club Platform. To complete your registration, please verify your email address.</p>
            
            <p>Your verification code is:</p>
            <div class="code-box">${verificationCode}</div>
            
            <p>This code will expire in 15 minutes.</p>
            
            <p>If you didn't create an account, please ignore this email.</p>
            
            <p>Best regards,<br>ESSAHUB Team</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} ESSAHUB. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Verification email sent to:", email);
    return true;
  } catch (error) {
    console.error("Error sending verification email:", error);
    throw error;
  }
}

/**
 * Send password reset OTP email
 */
export async function sendPasswordResetEmail(email, name, otp) {
  const mailOptions = {
    from: `"ESSAHUB Platform" <${config.email.user}>`,
    to: email,
    subject: "Password Reset Request - ESSAHUB",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #0F766E 0%, #14B8A6 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .otp-box { background: white; border: 2px solid #0F766E; padding: 20px; text-align: center; font-size: 36px; font-weight: bold; color: #0F766E; letter-spacing: 10px; margin: 20px 0; border-radius: 8px; }
          .warning { background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 15px; margin: 20px 0; border-radius: 4px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Password Reset Request</h1>
          </div>
          <div class="content">
            <h2>Hi ${name},</h2>
            <p>We received a request to reset your password for your ESSAHUB account.</p>
            
            <p>Your OTP verification code is:</p>
            <div class="otp-box">${otp}</div>
            
            <p style="text-align: center; color: #666;">Enter this code to verify your identity</p>
            
            <div class="warning">
              <strong>⚠️ Security Notice:</strong>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>This code will expire in 10 minutes</li>
                <li>Never share this code with anyone</li>
                <li>If you didn't request this, please ignore this email</li>
              </ul>
            </div>
            
            <p>Best regards,<br>ESSAHUB Team</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} ESSAHUB. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Password reset OTP sent to:", email);
    return true;
  } catch (error) {
    console.error("Error sending password reset email:", error);
    throw error;
  }
}

export async function sendPasswordResetConfirmation(email, name) {
  const mailOptions = {
    from: `"ESSAHUB Platform" <${config.email.user}>`,
    to: email,
    subject: "Password Reset Successful - ESSAHUB",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #059669 0%, #10B981 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .success { background: #D1FAE5; border-left: 4px solid #10B981; padding: 15px; margin: 20px 0; border-radius: 4px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Password Reset Successful</h1>
          </div>
          <div class="content">
            <h2>Hi ${name},</h2>
            
            <div class="success">
              <strong>✓ Your password has been successfully reset!</strong>
            </div>
            
            <p>You can now log in to your ESSAHUB account using your new password.</p>
            
            <p><strong>Security Tip:</strong> For your account security, we recommend:
              <ul>
                <li>Using a strong, unique password</li>
                <li>Never sharing your password with anyone</li>
                <li>Changing your password regularly</li>
              </ul>
            </p>
            
            <p>If you didn't make this change, please contact our support team immediately.</p>
            
            <p>Best regards,<br>ESSAHUB Team</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} ESSAHUB. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Password reset confirmation sent to:", email);
    return true;
  } catch (error) {
    console.error("Error sending confirmation email:", error);
    throw error;
  }
}

/**
 * Generate 5-digit OTP
 */
export function generateOTP() {
  return Math.floor(10000 + Math.random() * 90000).toString();
}

/**
 * Generate 6-digit verification code
 */
export function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

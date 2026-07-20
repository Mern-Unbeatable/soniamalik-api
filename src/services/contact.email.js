
import { config } from "../config/index.js";
import { emailService } from "../shared/email.js";

export const contactEmailService = {
    async sendNotificationToAdmin(contact) {
        try {
            const adminEmail = config.adminEmail || process.env.ADMIN_EMAIL || 'admin@essahub.co.uk';

            const emailHtml = `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: #4F46E5; color: white; padding: 20px; text-align: center; }
                        .content { background: #f9fafb; padding: 20px; border-radius: 8px; }
                        .field { margin-bottom: 15px; }
                        .label { font-weight: bold; color: #4F46E5; }
                        .value { margin-top: 5px; }
                        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #6b7280; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h2>New Contact Form Submission</h2>
                        </div>
                        <div class="content">
                            <div class="field">
                                <div class="label">Name:</div>
                                <div class="value">${contact.name}</div>
                            </div>
                            <div class="field">
                                <div class="label">Email:</div>
                                <div class="value">${contact.email}</div>
                            </div>
                            <div class="field">
                                <div class="label">Subject:</div>
                                <div class="value">${contact.subject}</div>
                            </div>
                            <div class="field">
                                <div class="label">Message:</div>
                                <div class="value">${contact.message}</div>
                            </div>
                            <div class="field">
                                <div class="label">Received At:</div>
                                <div class="value">${new Date(contact.createdAt).toLocaleString()}</div>
                            </div>
                        </div>
                        <div class="footer">
                            <p>Contact ID: ${contact.id}</p>
                        </div>
                    </div>
                </body>
                </html>
            `;

            await emailService.sendEmail({
                to: adminEmail,
                subject: 'New Contact Form Submission - Action Required',
                html: emailHtml,
            });

            console.log(`✅ Contact notification sent to admin: ${adminEmail}`);
            return true;

        } catch (error) {
            console.error('❌ Failed to send admin notification:', error);
            throw error;
        }
    },

    async sendConfirmationToUser(contact) {
        try {
            const emailHtml = `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: #10B981; color: white; padding: 20px; text-align: center; }
                        .content { background: #f9fafb; padding: 20px; border-radius: 8px; }
                        .message { margin: 20px 0; }
                        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #6b7280; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h2>Thank You for Contacting Us!</h2>
                        </div>
                        <div class="content">
                            <p>Dear ${contact.name},</p>
                            <p>Thank you for reaching out to us. We have received your message and our team will get back to you as soon as possible.</p>
                            <div class="message">
                                <p><strong>Your Message Summary:</strong></p>
                                <p><strong>Subject:</strong> ${contact.subject}</p>
                                <p><strong>Message:</strong> ${contact.message}</p>
                            </div>
                            <p>We aim to respond to all inquiries within 24 hours.</p>
                            <p>If you have any urgent questions, please feel free to reply to this email.</p>
                            <p>Best regards,<br>Your Support Team</p>
                        </div>
                        <div class="footer">
                            <p>Reference ID: ${contact.id.substring(0, 8)}</p>
                        </div>
                    </div>
                </body>
                </html>
            `;

            await emailService.sendEmail({
                to: contact.email,
                subject: 'Thank You for Contacting Us - We\'ll Get Back to You Soon',
                html: emailHtml,
            });

            console.log(`✅ Confirmation email sent to user: ${contact.email}`);
            return true;

        } catch (error) {
            console.error('❌ Failed to send user confirmation:', error);
            throw error;
        }
    }
};
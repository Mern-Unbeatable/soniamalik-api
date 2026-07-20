import nodemailer from 'nodemailer';
import { config } from '../../src/config/index.js';

class EmailService {
    constructor() {
        this.transporter = null;
        this.init();
    }

    init() {
        try {
            // Use config.email.user/pass from your config
            const emailUser = config.email?.user || process.env.SMTP_USER;
            const emailPass = config.email?.pass || process.env.SMTP_PASS;

            if (emailUser && emailPass) {
                this.transporter = nodemailer.createTransport({
                    host: config.email?.host || process.env.SMTP_HOST || 'smtp.gmail.com',
                    port: config.email?.port || parseInt(process.env.SMTP_PORT) || 587,
                    secure: true,
                    auth: {
                        user: emailUser,
                        pass: emailPass,
                    },
                });
                console.log('✅ Email service initialized successfully');
            } else {
                console.warn('⚠️ Email credentials not configured');
            }
        } catch (error) {
            console.error('❌ Failed to initialize email service:', error);
        }
    }

    async sendEmail({ to, subject, html, text }) {
        if (!this.transporter) {
            console.warn('⚠️ Email service not configured, skipping email send');
            return;
        }

        try {
            const from = config.EMAIL_FROM || process.env.EMAIL_FROM || config.email?.user || process.env.SMTP_USER;

            const info = await this.transporter.sendMail({
                from: `"Support" <${from}>`,
                to,
                subject,
                html,
                text: text || html?.replace(/<[^>]*>/g, ''),
            });

            console.log(`✅ Email sent to ${to}: ${info.messageId}`);
            return info;

        } catch (error) {
            console.error(`❌ Failed to send email to ${to}:`, error);
            throw error;
        }
    }
}

export const emailService = new EmailService();
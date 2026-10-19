import { config } from "../config/index.js";
import { emailService } from "../shared/email.js";
import { escapeHtml } from "../utils/escapeHtml.js";

const ROLE_LABELS = {
  USER: "Player",
  PLAYER: "Player",
  COACH: "Sport provider",
  PROVIDER: "Service provider",
  ADMIN: "Admin",
};

export const describeRole = (role) => ROLE_LABELS[String(role || "").toUpperCase()] || role || "Unknown";

/** Admin dashboard page for a listing, matching the provider's listing type. */
export const adminServicePath = (serviceId, providerRole) =>
  String(providerRole || "").toUpperCase() === "PROVIDER"
    ? `/admin/listings/service-provider/${serviceId}`
    : `/admin/listings/sport-provider/${serviceId}`;

export const adminEventPath = (eventId) => `/admin/event/${eventId}`;

export function buildAdminAlertHtml({ heading, rows = [], link, linkLabel }) {
  const rowsHtml = rows
    .filter(([, value]) => value !== undefined && value !== null && String(value).trim() !== "")
    .map(
      ([label, value]) =>
        `<tr><td style="padding: 6px 12px 6px 0; color: #555; white-space: nowrap; vertical-align: top;"><strong>${escapeHtml(label)}</strong></td><td style="padding: 6px 0; color: #222;">${escapeHtml(value)}</td></tr>`
    )
    .join("");

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #0f756d; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .button { display: inline-block; padding: 12px 24px; background-color: #0f756d; color: white !important; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { padding: 12px 20px; font-size: 12px; color: #777; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2 style="margin: 0;">ESSA Hub admin alert</h2>
        </div>
        <div class="content">
          <h3 style="margin-top: 0;">${escapeHtml(heading)}</h3>
          <table style="border-collapse: collapse;">${rowsHtml}</table>
          ${link ? `<a href="${escapeHtml(link)}" class="button">${escapeHtml(linkLabel || "Open in admin dashboard")}</a>` : ""}
        </div>
        <div class="footer">This is an automatic notification from ESSA Hub. You may need to log in as admin to open the link.</div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Emails the admin about new activity. Never throws and does not block the caller,
 * so a mail failure can't break sign-up or listing creation.
 */
export function sendAdminAlert({ subject, heading, rows, linkPath, linkLabel }) {
  const to = config.adminEmail;
  if (!to) return Promise.resolve();

  const link = linkPath ? `${String(config.frontendUrl || "").replace(/\/$/, "")}${linkPath}` : null;

  return Promise.resolve()
    .then(() =>
      emailService.sendEmail({
        to,
        subject: `[ESSA Hub] ${subject}`,
        html: buildAdminAlertHtml({ heading, rows, link, linkLabel }),
      })
    )
    .catch((error) => {
      console.error("Failed to send admin alert email:", error?.message || error);
    });
}

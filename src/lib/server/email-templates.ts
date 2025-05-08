/**
 * Email templates for various notifications
 */

import { format } from 'date-fns';
import { enUS, fr } from 'date-fns/locale';

// Interface for appointment data
export interface AppointmentData {
  id: string;
  client_name: string;
  client_email: string;
  client_phone?: string;
  date: string;
  notes?: string;
  status: string;
  appointment_type?: {
    name: string;
    color?: string;
    duration?: number;
  };
}

// Interface for email template data
export interface EmailTemplateData {
  appointment: AppointmentData;
  baseUrl: string;
  locale?: string;
  customText?: {
    subject?: string;
    greeting?: string;
    footer?: string;
  };
  branding?: {
    companyName?: string;
    logoUrl?: string;
    accentColor?: string;
  };
}

// Get the appropriate date-fns locale
function getDateLocale(locale: string = 'en') {
  return locale.startsWith('fr') ? fr : enUS;
}

/**
 * Generate the admin confirmation request email template
 */
export function getAdminConfirmationRequestTemplate(data: EmailTemplateData) {
  const { appointment, baseUrl, locale = 'en', customText, branding } = data;

  // Format the appointment date
  const appointmentDate = new Date(appointment.date);
  const dateLocale = getDateLocale(locale);
  const formattedDate = format(appointmentDate, 'PPP', { locale: dateLocale }); // e.g., April 29, 2023
  const formattedTime = format(appointmentDate, 'p', { locale: dateLocale }); // e.g., 12:00 PM

  // Create confirmation and rejection URLs
  const confirmUrl = `${baseUrl}/api/appointments/admin-action?action=confirm&id=${appointment.id}`;
  const rejectUrl = `${baseUrl}/api/appointments/admin-action?action=reject&id=${appointment.id}`;

  // Default company name
  const companyName = branding?.companyName || 'Promptly';

  // Default greeting
  const greeting = customText?.greeting || 'A new appointment has been requested and requires your confirmation.';

  // Default footer
  const footer = customText?.footer || `This email was sent from ${companyName}. If you did not expect this email, please ignore it.`;

  // Subject line
  const subject = customText?.subject || `New Appointment Request: ${appointment.client_name}`;

  // Plain text version
  const text = `
    New Appointment Request

    ${greeting}

    Client: ${appointment.client_name}
    Email: ${appointment.client_email}
    Phone: ${appointment.client_phone || 'Not provided'}
    Date: ${formattedDate}
    Time: ${formattedTime}
    Type: ${appointment.appointment_type?.name || 'Standard Appointment'}
    Notes: ${appointment.notes || 'None'}

    To confirm this appointment, visit: ${confirmUrl}
    To reject this appointment, visit: ${rejectUrl}

    ${footer}
  `;

  // HTML version
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Appointment Request</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 0;
          background-color: #f9f9f9;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #ffffff;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .header {
          text-align: center;
          padding-bottom: 20px;
          border-bottom: 1px solid #eee;
        }
        .logo {
          max-height: 60px;
          margin-bottom: 10px;
        }
        h1 {
          color: #333;
          font-size: 24px;
          margin: 0;
          padding: 0;
        }
        h2 {
          color: #555;
          font-size: 20px;
          margin-top: 20px;
        }
        .content {
          padding: 20px 0;
        }
        .appointment-details {
          background-color: #f5f5f5;
          border-radius: 6px;
          padding: 15px;
          margin: 20px 0;
        }
        .appointment-details ul {
          list-style-type: none;
          padding: 0;
          margin: 0;
        }
        .appointment-details li {
          padding: 8px 0;
          border-bottom: 1px solid #eee;
        }
        .appointment-details li:last-child {
          border-bottom: none;
        }
        .actions {
          text-align: center;
          margin: 30px 0;
        }
        .button {
          display: inline-block;
          padding: 10px 20px;
          margin: 0 10px;
          border-radius: 4px;
          text-decoration: none;
          font-weight: bold;
          color: white;
        }
        .confirm-button {
          background-color: #4CAF50;
        }
        .reject-button {
          background-color: #f44336;
        }
        .footer {
          text-align: center;
          padding-top: 20px;
          border-top: 1px solid #eee;
          font-size: 12px;
          color: #777;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          ${branding?.logoUrl ? `<img src="${branding.logoUrl}" alt="${companyName}" class="logo">` : ''}
          <h1>New Appointment Request</h1>
        </div>

        <div class="content">
          <p>${greeting}</p>

          <h2>Appointment Details:</h2>
          <div class="appointment-details">
            <ul>
              <li><strong>Client:</strong> ${appointment.client_name}</li>
              <li><strong>Email:</strong> ${appointment.client_email}</li>
              <li><strong>Phone:</strong> ${appointment.client_phone || 'Not provided'}</li>
              <li><strong>Date:</strong> ${formattedDate}</li>
              <li><strong>Time:</strong> ${formattedTime}</li>
              <li><strong>Type:</strong> ${appointment.appointment_type?.name || 'Standard Appointment'}</li>
              <li><strong>Notes:</strong> ${appointment.notes || 'None'}</li>
            </ul>
          </div>

          <div class="actions">
            <a href="${confirmUrl}" class="button confirm-button" style="background-color: #4CAF50;">Confirm Appointment</a>
            <a href="${rejectUrl}" class="button reject-button" style="background-color: #f44336;">Reject Appointment</a>
          </div>
        </div>

        <div class="footer">
          <p>${footer}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return { subject, text, html };
}

/**
 * Generate the client appointment confirmation email template
 */
export function getClientConfirmationTemplate(data: EmailTemplateData) {
  const { appointment, locale = 'en', customText, branding } = data;

  // Format the appointment date
  const appointmentDate = new Date(appointment.date);
  const dateLocale = getDateLocale(locale);
  const formattedDate = format(appointmentDate, 'PPP', { locale: dateLocale });
  const formattedTime = format(appointmentDate, 'p', { locale: dateLocale });

  // Default company name
  const companyName = branding?.companyName || 'Promptly';

  // Default greeting
  const greeting = customText?.greeting || `Hello ${appointment.client_name},`;

  // Default footer
  const footer = customText?.footer || `This email was sent from ${companyName}. If you did not expect this email, please contact us.`;

  // Subject line
  const subject = customText?.subject || 'Your Appointment Has Been Confirmed';

  // Plain text version
  const text = `
    Appointment Confirmation

    ${greeting}

    Your appointment has been confirmed.

    Appointment Details:
    Date: ${formattedDate}
    Time: ${formattedTime}
    Type: ${appointment.appointment_type?.name || 'Standard Appointment'}

    If you need to reschedule or cancel, please contact us.

    ${footer}
  `;

  // HTML version
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Appointment Confirmation</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 0;
          background-color: #f9f9f9;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #ffffff;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .header {
          text-align: center;
          padding-bottom: 20px;
          border-bottom: 1px solid #eee;
        }
        .logo {
          max-height: 60px;
          margin-bottom: 10px;
        }
        h1 {
          color: #333;
          font-size: 24px;
          margin: 0;
          padding: 0;
        }
        h2 {
          color: #555;
          font-size: 20px;
          margin-top: 20px;
        }
        .content {
          padding: 20px 0;
        }
        .appointment-details {
          background-color: #f5f5f5;
          border-radius: 6px;
          padding: 15px;
          margin: 20px 0;
        }
        .appointment-details ul {
          list-style-type: none;
          padding: 0;
          margin: 0;
        }
        .appointment-details li {
          padding: 8px 0;
          border-bottom: 1px solid #eee;
        }
        .appointment-details li:last-child {
          border-bottom: none;
        }
        .footer {
          text-align: center;
          padding-top: 20px;
          border-top: 1px solid #eee;
          font-size: 12px;
          color: #777;
        }
        .status-confirmed {
          color: #4CAF50;
          font-weight: bold;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          ${branding?.logoUrl ? `<img src="${branding.logoUrl}" alt="${companyName}" class="logo">` : ''}
          <h1>Appointment Confirmation</h1>
        </div>

        <div class="content">
          <p>${greeting}</p>

          <p>Your appointment has been <span class="status-confirmed">confirmed</span>.</p>

          <h2>Appointment Details:</h2>
          <div class="appointment-details">
            <ul>
              <li><strong>Date:</strong> ${formattedDate}</li>
              <li><strong>Time:</strong> ${formattedTime}</li>
              <li><strong>Type:</strong> ${appointment.appointment_type?.name || 'Standard Appointment'}</li>
            </ul>
          </div>

          <p>If you need to reschedule or cancel, please contact us.</p>
        </div>

        <div class="footer">
          <p>${footer}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return { subject, text, html };
}

/**
 * Generate the client appointment rejection email template
 */
export function getClientRejectionTemplate(data: EmailTemplateData) {
  const { appointment, baseUrl, locale = 'en', customText, branding } = data;

  // Format the appointment date
  const appointmentDate = new Date(appointment.date);
  const dateLocale = getDateLocale(locale);
  const formattedDate = format(appointmentDate, 'PPP', { locale: dateLocale });
  const formattedTime = format(appointmentDate, 'p', { locale: dateLocale });

  // Default company name
  const companyName = branding?.companyName || 'Promptly';

  // Default greeting
  const greeting = customText?.greeting || `Hello ${appointment.client_name},`;

  // Default footer
  const footer = customText?.footer || `This email was sent from ${companyName}. If you did not expect this email, please contact us.`;

  // Subject line
  const subject = customText?.subject || 'Your Appointment Request Could Not Be Accommodated';

  // Plain text version
  const text = `
    Appointment Update

    ${greeting}

    We regret to inform you that your appointment request could not be accommodated at this time.

    Appointment Details:
    Date: ${formattedDate}
    Time: ${formattedTime}
    Type: ${appointment.appointment_type?.name || 'Standard Appointment'}

    Please feel free to schedule another appointment at a different time.

    ${footer}
  `;

  // HTML version
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Appointment Update</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 0;
          background-color: #f9f9f9;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #ffffff;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .header {
          text-align: center;
          padding-bottom: 20px;
          border-bottom: 1px solid #eee;
        }
        .logo {
          max-height: 60px;
          margin-bottom: 10px;
        }
        h1 {
          color: #333;
          font-size: 24px;
          margin: 0;
          padding: 0;
        }
        h2 {
          color: #555;
          font-size: 20px;
          margin-top: 20px;
        }
        .content {
          padding: 20px 0;
        }
        .appointment-details {
          background-color: #f5f5f5;
          border-radius: 6px;
          padding: 15px;
          margin: 20px 0;
        }
        .appointment-details ul {
          list-style-type: none;
          padding: 0;
          margin: 0;
        }
        .appointment-details li {
          padding: 8px 0;
          border-bottom: 1px solid #eee;
        }
        .appointment-details li:last-child {
          border-bottom: none;
        }
        .footer {
          text-align: center;
          padding-top: 20px;
          border-top: 1px solid #eee;
          font-size: 12px;
          color: #777;
        }
        .status-rejected {
          color: #f44336;
          font-weight: bold;
        }
        .cta-button {
          display: inline-block;
          background-color: #6366f1;
          color: white;
          text-decoration: none;
          padding: 10px 20px;
          border-radius: 4px;
          margin-top: 15px;
          font-weight: bold;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          ${branding?.logoUrl ? `<img src="${branding.logoUrl}" alt="${companyName}" class="logo">` : ''}
          <h1>Appointment Update</h1>
        </div>

        <div class="content">
          <p>${greeting}</p>

          <p>We regret to inform you that your appointment request could not be <span class="status-rejected">accommodated</span> at this time.</p>

          <h2>Appointment Details:</h2>
          <div class="appointment-details">
            <ul>
              <li><strong>Date:</strong> ${formattedDate}</li>
              <li><strong>Time:</strong> ${formattedTime}</li>
              <li><strong>Type:</strong> ${appointment.appointment_type?.name || 'Standard Appointment'}</li>
            </ul>
          </div>

          <p>Please feel free to schedule another appointment at a different time.</p>

          <div style="text-align: center; margin-top: 20px;">
            <a href="${baseUrl}/book" class="cta-button" style="background-color: ${branding?.accentColor || '#6366f1'};">Book Another Appointment</a>
          </div>
        </div>

        <div class="footer">
          <p>${footer}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return { subject, text, html };
}

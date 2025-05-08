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
 * Replace placeholders in a string with actual values
 * @param text The text containing placeholders like {placeholderName}
 * @param replacements An object with keys matching the placeholder names and values to replace them with
 * @returns The text with placeholders replaced by their values
 */
function replacePlaceholders(text: string, replacements: Record<string, string>): string {
  return Object.entries(replacements).reduce((result, [key, value]) => {
    return result.replace(new RegExp(`{${key}}`, 'g'), value || '');
  }, text);
}

/**
 * Generate the admin confirmation request email template
 */
export function getAdminConfirmationRequestTemplate(data: EmailTemplateData) {
  const { appointment, baseUrl, locale = 'en', customText, branding } = data;

  // Import translations
  let translations: any = {
    newAppointmentRequest: "New Appointment Request",
    appointmentDetails: "Appointment Details",
    client: "Client",
    email: "Email",
    phone: "Phone",
    date: "Date",
    time: "Time",
    type: "Type",
    notes: "Notes",
    notProvided: "Not provided",
    none: "None",
    standardAppointment: "Standard Appointment",
    confirmAppointment: "Confirm Appointment",
    rejectAppointment: "Reject Appointment",
    toConfirm: "To confirm this appointment, visit:",
    toReject: "To reject this appointment, visit:"
  };

  // Use French translations if locale is French
  if (locale.startsWith('fr')) {
    translations = {
      newAppointmentRequest: "Nouvelle demande de rendez-vous",
      appointmentDetails: "Détails du rendez-vous",
      client: "Client",
      email: "Email",
      phone: "Téléphone",
      date: "Date",
      time: "Heure",
      type: "Type",
      notes: "Notes",
      notProvided: "Non fourni",
      none: "Aucune",
      standardAppointment: "Rendez-vous standard",
      confirmAppointment: "Confirmer le rendez-vous",
      rejectAppointment: "Rejeter le rendez-vous",
      toConfirm: "Pour confirmer ce rendez-vous, visitez :",
      toReject: "Pour rejeter ce rendez-vous, visitez :"
    };
  }

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
  const greeting = customText?.greeting || translations.adminGreeting;

  // Default footer
  const footer = customText?.footer || replacePlaceholders(translations.adminFooter, {
    companyName
  });

  // Subject line
  const subjectTemplate = customText?.subject || `${translations.newAppointmentRequest}: {clientName}`;
  const subject = replacePlaceholders(subjectTemplate, {
    clientName: appointment.client_name
  });

  // Plain text version
  const text = `
    ${translations.newAppointmentRequest}

    ${greeting}

    ${translations.client}: ${appointment.client_name}
    ${translations.email}: ${appointment.client_email}
    ${translations.phone}: ${appointment.client_phone || translations.notProvided}
    ${translations.date}: ${formattedDate}
    ${translations.time}: ${formattedTime}
    ${translations.type}: ${appointment.appointment_type?.name || translations.standardAppointment}
    ${translations.notes}: ${appointment.notes || translations.none}

    ${translations.toConfirm} ${confirmUrl}
    ${translations.toReject} ${rejectUrl}

    ${footer}
  `;

  // HTML version
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${translations.newAppointmentRequest}</title>
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
          <h1>${translations.newAppointmentRequest}</h1>
        </div>

        <div class="content">
          <p>${greeting}</p>

          <h2>${translations.appointmentDetails}:</h2>
          <div class="appointment-details">
            <ul>
              <li><strong>${translations.client}:</strong> ${appointment.client_name}</li>
              <li><strong>${translations.email}:</strong> ${appointment.client_email}</li>
              <li><strong>${translations.phone}:</strong> ${appointment.client_phone || translations.notProvided}</li>
              <li><strong>${translations.date}:</strong> ${formattedDate}</li>
              <li><strong>${translations.time}:</strong> ${formattedTime}</li>
              <li><strong>${translations.type}:</strong> ${appointment.appointment_type?.name || translations.standardAppointment}</li>
              <li><strong>${translations.notes}:</strong> ${appointment.notes || translations.none}</li>
            </ul>
          </div>

          <div class="actions">
            <a href="${confirmUrl}" class="button confirm-button" style="background-color: #4CAF50;">${translations.confirmAppointment}</a>
            <a href="${rejectUrl}" class="button reject-button" style="background-color: #f44336;">${translations.rejectAppointment}</a>
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

  // Import translations
  let translations: any = {
    appointmentConfirmation: "Appointment Confirmation",
    appointmentDetails: "Appointment Details",
    date: "Date",
    time: "Time",
    type: "Type",
    standardAppointment: "Standard Appointment",
    confirmed: "confirmed",
    appointmentConfirmed: "Your appointment has been confirmed.",
    rescheduleOrCancel: "If you need to reschedule or cancel, please contact us."
  };

  // Use French translations if locale is French
  if (locale.startsWith('fr')) {
    translations = {
      appointmentConfirmation: "Confirmation de rendez-vous",
      appointmentDetails: "Détails du rendez-vous",
      date: "Date",
      time: "Heure",
      type: "Type",
      standardAppointment: "Rendez-vous standard",
      confirmed: "confirmé",
      appointmentConfirmed: "Votre rendez-vous a été confirmé.",
      rescheduleOrCancel: "Si vous avez besoin de reprogrammer ou d'annuler, veuillez nous contacter."
    };
  }

  // Format the appointment date
  const appointmentDate = new Date(appointment.date);
  const dateLocale = getDateLocale(locale);
  const formattedDate = format(appointmentDate, 'PPP', { locale: dateLocale });
  const formattedTime = format(appointmentDate, 'p', { locale: dateLocale });

  // Default company name
  const companyName = branding?.companyName || 'Promptly';

  // Default greeting
  const greetingTemplate = customText?.greeting || translations.clientGreeting;
  const greeting = replacePlaceholders(greetingTemplate, {
    clientName: appointment.client_name
  });

  // Default footer
  const footer = customText?.footer || replacePlaceholders(translations.clientFooter, {
    companyName
  });

  // Subject line
  const subject = customText?.subject || translations.appointmentConfirmation;

  // Plain text version
  const text = `
    ${translations.appointmentConfirmation}

    ${greeting}

    ${translations.appointmentConfirmed}

    ${translations.appointmentDetails}:
    ${translations.date}: ${formattedDate}
    ${translations.time}: ${formattedTime}
    ${translations.type}: ${appointment.appointment_type?.name || translations.standardAppointment}

    ${translations.rescheduleOrCancel}

    ${footer}
  `;

  // HTML version
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${translations.appointmentConfirmation}</title>
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
          <h1>${translations.appointmentConfirmation}</h1>
        </div>

        <div class="content">
          <p>${greeting}</p>

          <p>${translations.appointmentConfirmed.replace('confirmed', `<span class="status-confirmed">${translations.confirmed}</span>`)}</p>

          <h2>${translations.appointmentDetails}:</h2>
          <div class="appointment-details">
            <ul>
              <li><strong>${translations.date}:</strong> ${formattedDate}</li>
              <li><strong>${translations.time}:</strong> ${formattedTime}</li>
              <li><strong>${translations.type}:</strong> ${appointment.appointment_type?.name || translations.standardAppointment}</li>
            </ul>
          </div>

          <p>${translations.rescheduleOrCancel}</p>
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

  // Import translations
  let translations: any = {
    appointmentUpdate: "Appointment Update",
    appointmentDetails: "Appointment Details",
    date: "Date",
    time: "Time",
    type: "Type",
    standardAppointment: "Standard Appointment",
    rejected: "accommodated",
    appointmentRejected: "We regret to inform you that your appointment request could not be accommodated at this time.",
    scheduleAnother: "Please feel free to schedule another appointment at a different time.",
    bookAnother: "Book Another Appointment"
  };

  // Use French translations if locale is French
  if (locale.startsWith('fr')) {
    translations = {
      appointmentUpdate: "Mise à jour du rendez-vous",
      appointmentDetails: "Détails du rendez-vous",
      date: "Date",
      time: "Heure",
      type: "Type",
      standardAppointment: "Rendez-vous standard",
      rejected: "acceptée",
      appointmentRejected: "Nous regrettons de vous informer que votre demande de rendez-vous n'a pas pu être acceptée pour le moment.",
      scheduleAnother: "N'hésitez pas à planifier un autre rendez-vous à un moment différent.",
      bookAnother: "Réserver un autre rendez-vous"
    };
  }

  // Format the appointment date
  const appointmentDate = new Date(appointment.date);
  const dateLocale = getDateLocale(locale);
  const formattedDate = format(appointmentDate, 'PPP', { locale: dateLocale });
  const formattedTime = format(appointmentDate, 'p', { locale: dateLocale });

  // Default company name
  const companyName = branding?.companyName || 'Promptly';

  // Default greeting
  const greetingTemplate = customText?.greeting || translations.clientGreeting;
  const greeting = replacePlaceholders(greetingTemplate, {
    clientName: appointment.client_name
  });

  // Default footer
  const footer = customText?.footer || replacePlaceholders(translations.clientFooter, {
    companyName
  });

  // Subject line
  const subject = customText?.subject || translations.appointmentUpdate;

  // Plain text version
  const text = `
    ${translations.appointmentUpdate}

    ${greeting}

    ${translations.appointmentRejected}

    ${translations.appointmentDetails}:
    ${translations.date}: ${formattedDate}
    ${translations.time}: ${formattedTime}
    ${translations.type}: ${appointment.appointment_type?.name || translations.standardAppointment}

    ${translations.scheduleAnother}

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
          <h1>${translations.appointmentUpdate}</h1>
        </div>

        <div class="content">
          <p>${greeting}</p>

          <p>${translations.appointmentRejected.replace('accommodated', `<span class="status-rejected">${translations.rejected}</span>`)}</p>

          <h2>${translations.appointmentDetails}:</h2>
          <div class="appointment-details">
            <ul>
              <li><strong>${translations.date}:</strong> ${formattedDate}</li>
              <li><strong>${translations.time}:</strong> ${formattedTime}</li>
              <li><strong>${translations.type}:</strong> ${appointment.appointment_type?.name || translations.standardAppointment}</li>
            </ul>
          </div>

          <p>${translations.scheduleAnother}</p>

          <div style="text-align: center; margin-top: 20px;">
            <a href="${baseUrl}/book" class="cta-button" style="background-color: ${branding?.accentColor || '#6366f1'};">${translations.bookAnother}</a>
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

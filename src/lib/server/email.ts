import nodemailer from 'nodemailer';
import {
  AppointmentData,
  EmailTemplateData,
  getAdminConfirmationRequestTemplate,
  getClientConfirmationTemplate,
  getClientRejectionTemplate
} from './email-templates';

// Email configuration
// In production, you would use real SMTP credentials
// For development, we can use a test account or ethereal email
let transporter: nodemailer.Transporter;

// Initialize the email transporter
export async function initEmailTransporter() {
  // Check if we already have a transporter
  if (transporter) {
    return transporter;
  }

  // If SMTP credentials are provided in environment variables, use them
  if (process.env.SMTP_HOST && process.env.SMTP_PORT) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  } else {
    // For development, create a test account using Ethereal
    const testAccount = await nodemailer.createTestAccount();

    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });

    console.log('Using test email account:', testAccount.user);
  }

  return transporter;
}

/**
 * Send an email using the provided template
 */
export async function sendEmail(
  to: string,
  templateData: {
    subject: string;
    text: string;
    html: string;
  },
  from?: string
): Promise<{ success: boolean; messageId?: string; previewUrl?: string; error?: any }> {
  try {
    // Initialize the email transporter if not already done
    const emailTransporter = await initEmailTransporter();

    // Send the email
    const info = await emailTransporter.sendMail({
      from: from || `"Promptly Appointments" <${process.env.SMTP_FROM || 'appointments@promptly.com'}>`,
      to,
      subject: templateData.subject,
      text: templateData.text,
      html: templateData.html,
    });

    console.log('Email sent:', info.messageId);

    // For development with Ethereal, provide the preview URL
    let previewUrl: string | undefined;
    if (info.messageId && !process.env.SMTP_HOST) {
      const testMessageUrl = nodemailer.getTestMessageUrl(info);
      // Convert to string if it's not undefined or false
      previewUrl = testMessageUrl ? testMessageUrl.toString() : undefined;
      console.log('Preview URL:', previewUrl);
    }

    return {
      success: true,
      messageId: info.messageId,
      previewUrl
    };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error };
  }
}

/**
 * Send an appointment confirmation request email to the administrator
 */
export async function sendAppointmentConfirmationRequestEmail(
  adminEmail: string,
  appointment: AppointmentData,
  baseUrl: string,
  locale?: string,
  customText?: {
    subject?: string;
    greeting?: string;
    footer?: string;
  },
  branding?: {
    companyName?: string;
    logoUrl?: string;
    accentColor?: string;
  }
): Promise<{ success: boolean; messageId?: string; previewUrl?: string; error?: any }> {
  try {
    // Get the email template
    const templateData: EmailTemplateData = {
      appointment,
      baseUrl,
      locale,
      customText,
      branding
    };

    const emailTemplate = getAdminConfirmationRequestTemplate(templateData);

    // Send the email
    return await sendEmail(adminEmail, emailTemplate);
  } catch (error) {
    console.error('Error sending admin confirmation request email:', error);
    return { success: false, error };
  }
}

/**
 * Send an appointment confirmation email to the client
 */
export async function sendClientConfirmationEmail(
  appointment: AppointmentData,
  baseUrl: string,
  locale?: string,
  customText?: {
    subject?: string;
    greeting?: string;
    footer?: string;
  },
  branding?: {
    companyName?: string;
    logoUrl?: string;
    accentColor?: string;
  }
): Promise<{ success: boolean; messageId?: string; previewUrl?: string; error?: any }> {
  try {
    // Get the email template
    const templateData: EmailTemplateData = {
      appointment,
      baseUrl,
      locale,
      customText,
      branding
    };

    const emailTemplate = getClientConfirmationTemplate(templateData);

    // Send the email
    return await sendEmail(appointment.client_email, emailTemplate);
  } catch (error) {
    console.error('Error sending client confirmation email:', error);
    return { success: false, error };
  }
}

/**
 * Send an appointment rejection email to the client
 */
export async function sendClientRejectionEmail(
  appointment: AppointmentData,
  baseUrl: string,
  locale?: string,
  customText?: {
    subject?: string;
    greeting?: string;
    footer?: string;
  },
  branding?: {
    companyName?: string;
    logoUrl?: string;
    accentColor?: string;
  }
): Promise<{ success: boolean; messageId?: string; previewUrl?: string; error?: any }> {
  try {
    // Get the email template
    const templateData: EmailTemplateData = {
      appointment,
      baseUrl,
      locale,
      customText,
      branding
    };

    const emailTemplate = getClientRejectionTemplate(templateData);

    // Send the email
    return await sendEmail(appointment.client_email, emailTemplate);
  } catch (error) {
    console.error('Error sending client rejection email:', error);
    return { success: false, error };
  }
}

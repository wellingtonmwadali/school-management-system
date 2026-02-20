import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
}

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
  try {
    // Skip if email not configured
    if (!process.env.SMTP_USER) {
      console.log('Email service not configured. Skipping email send.');
      return false;
    }

    const transporter = createTransporter();

    const mailOptions = {
      from: `${process.env.SMTP_FROM_NAME || 'School ERP'} <${process.env.SMTP_USER}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to ${options.to}`);
    return true;
  } catch (error) {
    console.error('Email send error:', error);
    return false;
  }
};

export const sendBulkEmail = async (recipients: string[], subject: string, html: string): Promise<void> => {
  try {
    const promises = recipients.map(email => 
      sendEmail({ to: email, subject, html })
    );
    
    await Promise.all(promises);
  } catch (error) {
    console.error('Bulk email error:', error);
  }
};

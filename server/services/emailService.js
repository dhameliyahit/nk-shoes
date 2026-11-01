import nodemailer from "nodemailer";
import Setting from "../models/Setting.js";

/**
 * Retrieve email configuration directly from MongoDB database
 */
export const getEmailConfig = async () => {
  const dbSetting = await Setting.get("email");

  if (dbSetting) {
    return {
      service: dbSetting.service || "gmail",
      host: dbSetting.host || "smtp.gmail.com",
      port: dbSetting.port ? Number(dbSetting.port) : 465,
      secure: dbSetting.secure !== undefined ? Boolean(dbSetting.secure) : true,
      auth: {
        user: dbSetting.auth?.user || dbSetting.email || process.env.SMTP_USER || "",
        pass: dbSetting.auth?.pass || dbSetting.password || process.env.SMTP_PASS || "",
      },
      fromName: dbSetting.fromName || "NK-SHOES",
      fromEmail: dbSetting.fromEmail || dbSetting.auth?.user || dbSetting.email || "",
    };
  }

  // Fallback to environment variables
  return {
    service: "gmail",
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.SMTP_USER || "",
      pass: process.env.SMTP_PASS || "",
    },
    fromName: "NK-SHOES",
    fromEmail: process.env.SMTP_FROM || process.env.SMTP_USER || "",
  };
};

/**
 * Create and return a Nodemailer transporter using dynamic database settings
 */
export const createTransporter = async () => {
  const config = await getEmailConfig();

  if (!config.auth.user || !config.auth.pass) {
    throw new Error(
      "Email service not configured. Please set email and app password in Admin Settings (key: 'email')."
    );
  }

  const transporterOptions = {
    auth: {
      user: config.auth.user,
      pass: config.auth.pass,
    },
  };

  // If using Gmail default service
  if (config.service === "gmail" || config.host === "smtp.gmail.com") {
    transporterOptions.service = "gmail";
    transporterOptions.host = config.host || "smtp.gmail.com";
    transporterOptions.port = config.port || 465;
    transporterOptions.secure = config.secure !== undefined ? config.secure : true;
  } else {
    // Custom SMTP server configuration
    transporterOptions.host = config.host;
    transporterOptions.port = config.port;
    transporterOptions.secure = config.secure;
  }

  const transporter = nodemailer.createTransport(transporterOptions);
  return { transporter, config };
};

/**
 * Core sendEmail function
 * @param {Object} options - { to, subject, html, text, from, attachments }
 */
export const sendEmail = async ({ to, subject, html, text, from, attachments = [] }) => {
  try {
    const { transporter, config } = await createTransporter();

    const fromAddress = from || `"${config.fromName}" <${config.fromEmail || config.auth.user}>`;

    const mailOptions = {
      from: fromAddress,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]+>/g, ""), // Strip tags for plain text fallback
      attachments,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[Email Service] Message sent successfully: ${info.messageId}`);
    return { success: true, messageId: info.messageId, response: info.response };
  } catch (error) {
    console.error(`[Email Service Error] Failed to send email to ${to}:`, error.message);
    throw error;
  }
};

/**
 * Send a verification/test email to verify SMTP configuration
 */
export const sendTestEmail = async (targetEmail) => {
  const subject = "NK-SHOES - SMTP Configuration Test";
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <h2 style="color: #111; text-align: center;">NK-SHOES</h2>
      <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
      <h3 style="color: #2e7d32;">SMTP Settings Verified Successfully!</h3>
      <p>Hello,</p>
      <p>Your Gmail SMTP email configuration is working perfectly on the <strong>NK-SHOES</strong> server.</p>
      <p>Timestamp: <strong>${new Date().toLocaleString()}</strong></p>
      <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
      <p style="font-size: 12px; color: #888; text-align: center;">This is an automated test email sent from NK-SHOES administration.</p>
    </div>
  `;
  return await sendEmail({ to: targetEmail, subject, html });
};

/**
 * Send email verification OTP & direct link
 */
export const sendVerificationEmail = async (user, otp, token) => {
  const subject = "Verify Your NK-SHOES Account";
  const verifyLink = `${process.env.CLIENT_URL || "http://localhost:3000"}/register?verify=true&email=${encodeURIComponent(user.email)}&token=${token}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 32px 24px; border: 1px solid #eaeaea; border-radius: 8px; background: #ffffff;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="font-size: 24px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; color: #111111; margin: 0;">NK-SHOES</h1>
        <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #707072; margin-top: 4px;">Exclusive Footwear & Sneaker Platform</p>
      </div>
      
      <hr style="border: 0; border-top: 1px solid #f0f0f0; margin: 20px 0;" />
      
      <h2 style="font-size: 18px; color: #111111; font-weight: 700; margin-bottom: 12px;">Confirm Your Email Address</h2>
      <p style="font-size: 14px; line-height: 1.6; color: #444444; margin: 0 0 20px 0;">
        Hello <strong>${user.name}</strong>,<br/>
        Welcome to NK-SHOES. Use the 6-digit verification code below to activate your account and begin shopping:
      </p>

      <div style="text-align: center; margin: 28px 0; padding: 20px; background: #f6f6f6; border-radius: 6px; border: 1px dashed #d5d5d5;">
        <span style="font-size: 32px; font-weight: 900; letter-spacing: 8px; color: #111111; font-family: monospace;">${otp}</span>
        <p style="font-size: 11px; color: #777777; margin: 8px 0 0 0;">This code is valid for 15 minutes.</p>
      </div>

      <div style="text-align: center; margin: 24px 0;">
        <p style="font-size: 13px; color: #666; margin-bottom: 12px;">Or simply click the button below to verify automatically:</p>
        <a href="${verifyLink}" style="display: inline-block; background-color: #111111; color: #ffffff; padding: 13px 28px; text-decoration: none; border-radius: 4px; font-weight: 700; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">Verify Account</a>
      </div>

      <hr style="border: 0; border-top: 1px solid #f0f0f0; margin: 28px 0 20px 0;" />
      <p style="font-size: 11px; color: #999999; text-align: center; margin: 0;">
        If you did not request this account creation, please ignore this email.
      </p>
    </div>
  `;

  return await sendEmail({ to: user.email, subject, html });
};

/**
 * Send welcome email on registration
 */
export const sendWelcomeEmail = async (user) => {
  const subject = "Welcome to NK-SHOES!";
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <h2 style="color: #111; text-align: center;">Welcome to NK-SHOES, ${user.name}!</h2>
      <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
      <p>Thank you for creating an account with us. We're excited to have you explore our exclusive sneaker collections.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.CLIENT_URL || "http://localhost:3000"}" style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Start Shopping</a>
      </div>
      <p style="font-size: 12px; color: #888;">If you have any questions, feel free to reply to this email.</p>
    </div>
  `;
  return await sendEmail({ to: user.email, subject, html });
};

/**
 * Send order confirmation email
 */
export const sendOrderConfirmationEmail = async (order, user) => {
  const subject = `Order Confirmation #${order._id || order.id}`;
  const itemsHtml = (order.orderItems || [])
    .map(
      (item) => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.name} (${item.size || "Standard"}) x ${item.qty}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">₹${item.price * item.qty}</td>
      </tr>
    `
    )
    .join("");

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <h2 style="color: #111; text-align: center;">Order Confirmed!</h2>
      <p>Thank you for your order, ${user.name || "Customer"}. We've received your request and are processing it.</p>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <thead>
          <tr style="background: #f7f7f7;">
            <th style="padding: 8px; text-align: left;">Item</th>
            <th style="padding: 8px; text-align: right;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
          <tr>
            <td style="padding: 8px; font-weight: bold;">Total Amount</td>
            <td style="padding: 8px; text-align: right; font-weight: bold;">₹${order.totalPrice}</td>
          </tr>
        </tbody>
      </table>
      <p>Status: <strong>${order.orderStatus || "Processing"}</strong></p>
    </div>
  `;
  return await sendEmail({ to: user.email, subject, html });
};

export default {
  getEmailConfig,
  createTransporter,
  sendEmail,
  sendTestEmail,
  sendVerificationEmail,
  sendWelcomeEmail,
  sendOrderConfirmationEmail,
};

const nodemailer = require('nodemailer');

let transporter = null;

const getTransporter = async () => {
  if (transporter) return transporter;

  // Direct Gmail Service (using App Password)
  if (process.env.GMAIL_USER && process.env.GMAIL_PASS) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
    });
    console.log(`⚡ Gmail SMTP Transporter initialized (${process.env.GMAIL_USER})`);
    return transporter;
  }

  // Custom SMTP Server
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    console.log(`⚡ Custom SMTP Transporter initialized (${process.env.SMTP_HOST})`);
    return transporter;
  }

  // Ethereal Dev Test SMTP Fallback
  try {
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
    console.log('✉️  Ethereal Test SMTP initialized (Development Mode)');
  } catch (err) {
    console.warn('⚠️ Could not initialize Ethereal SMTP:', err.message);
  }

  return transporter;
};

// Send 6-Digit OTP Email
const sendOTPEmail = async (toEmail, userName, otpCode) => {
  // Always log OTP prominently in backend console for immediate dev testing
  console.log('\n======================================================');
  console.log(`🔑 [VERIFICATION OTP CODE] FOR ${toEmail}: >>> ${otpCode} <<<`);
  console.log('======================================================\n');

  try {
    const transport = await getTransporter();
    if (!transport) return;

    const fromAddress = process.env.GMAIL_USER 
      ? `"Neon Snake 3D" <${process.env.GMAIL_USER}>` 
      : '"Neon Snake 3D" <noreply@neonsnake.com>';

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; background-color: #090A0F; padding: 30px; color: #FFFFFF; border-radius: 16px; max-width: 500px; margin: auto;">
        <h1 style="color: #00F0FF; text-align: center; text-transform: uppercase; letter-spacing: 3px;">NEON SNAKE 3D</h1>
        <h2 style="color: #FFFFFF; text-align: center;">Account Email Verification</h2>
        <p style="color: #94A3B8; font-size: 16px;">Hello <strong>${userName}</strong>,</p>
        <p style="color: #CBD5E1; font-size: 15px; line-height: 1.6;">
          Thank you for registering! Please use the 6-digit OTP code below to verify your email address and activate your account.
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <span style="font-size: 38px; font-weight: 900; letter-spacing: 8px; color: #00F0FF; background-color: rgba(0, 240, 255, 0.1); padding: 14px 28px; border: 2px solid #00F0FF; border-radius: 14px; display: inline-block;">
            ${otpCode}
          </span>
        </div>
        <p style="color: #64748B; font-size: 13px; text-align: center;">
          This code is valid for 10 minutes. If you did not request this, please ignore this email.
        </p>
      </div>
    `;

    const info = await transport.sendMail({
      from: fromAddress,
      to: toEmail,
      subject: `🔑 ${otpCode} is your Neon Snake 3D Verification OTP`,
      html: htmlContent,
    });

    console.log(`✉️ Verification OTP Email sent to ${toEmail}`);
    if (nodemailer.getTestMessageUrl(info)) {
      console.log(`🔗 Ethereal Email Preview: ${nodemailer.getTestMessageUrl(info)}`);
    }
  } catch (error) {
    console.warn('⚠️ Error sending OTP email:', error.message);
  }
};

// Send Credentials Confirmation Email
const sendCredentialsEmail = async (toEmail, userName) => {
  try {
    const transport = await getTransporter();
    if (!transport) return;

    const fromAddress = process.env.GMAIL_USER 
      ? `"Neon Snake 3D" <${process.env.GMAIL_USER}>` 
      : '"Neon Snake 3D" <noreply@neonsnake.com>';

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; background-color: #090A0F; padding: 30px; color: #FFFFFF; border-radius: 16px; max-width: 500px; margin: auto;">
        <h1 style="color: #00FF66; text-align: center; text-transform: uppercase; letter-spacing: 3px;">ACCOUNT ACTIVATED!</h1>
        <h2 style="color: #FFFFFF; text-align: center;">Welcome to Neon Snake 3D</h2>
        <p style="color: #94A3B8; font-size: 16px;">Hello <strong>${userName}</strong>,</p>
        <p style="color: #CBD5E1; font-size: 15px; line-height: 1.6;">
          Your email address (<strong style="color: #00F0FF;">${toEmail}</strong>) has been verified! Your account is active and ready for battle.
        </p>
        <div style="background-color: rgba(255, 255, 255, 0.05); padding: 16px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.15); margin: 20px 0;">
          <p style="color: #00FF66; margin: 0; font-weight: bold;">Confirmed Login Email:</p>
          <p style="color: #FFFFFF; margin: 6px 0 0 0; font-size: 16px;">${toEmail}</p>
        </div>
      </div>
    `;

    const info = await transport.sendMail({
      from: fromAddress,
      to: toEmail,
      subject: '🎉 Account Activated - Welcome to Neon Snake 3D!',
      html: htmlContent,
    });

    console.log(`✉️ Credentials Confirmation Email sent to ${toEmail}`);
    if (nodemailer.getTestMessageUrl(info)) {
      console.log(`🔗 Ethereal Email Preview: ${nodemailer.getTestMessageUrl(info)}`);
    }
  } catch (error) {
    console.warn('⚠️ Error sending credentials email:', error.message);
  }
};

module.exports = {
  sendOTPEmail,
  sendCredentialsEmail,
};

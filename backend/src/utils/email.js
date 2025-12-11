const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER;

  console.log('📧 SMTP Config:', {
    host,
    port,
    user: user ? user.substring(0, 3) + '***' : 'Not Set'
  });

  return nodemailer.createTransport({
    host: host,
    port: port,
    secure: port === 465, // True for 465 (SSL), false for other ports (STARTTLS)
    auth: {
      user: user,
      pass: process.env.SMTP_PASS
    }
  });
};

// Send email
const sendEmail = async ({ to, subject, html, text }) => {
  // Skip in development if no SMTP configured
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('Email would be sent:', { to, subject });
    return { messageId: 'dev-mode-skip' };
  }

  const transporter = createTransporter();

  const mailOptions = {
    from: process.env.EMAIL_FROM || 'noreply@equiprent.com',
    to,
    subject,
    html,
    text: text || html.replace(/<[^>]*>/g, '')
  };

  return transporter.sendMail(mailOptions);
};

// Email templates
const emailTemplates = {
  // OTP Templates
  otpVerification: (otp, firstName) => ({
    subject: 'Verify Your Email - EquipRent',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0ea5e9;">Email Verification</h2>
        <p>Hello ${firstName},</p>
        <p>Thank you for registering with EquipRent! Please use the following OTP to verify your email:</p>
        <div style="background: #f1f5f9; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
          <h1 style="color: #0ea5e9; letter-spacing: 8px; margin: 0;">${otp}</h1>
        </div>
        <p>This code will expire in <strong>10 minutes</strong>.</p>
        <p>If you didn't create an account, please ignore this email.</p>
      </div>
    `
  }),

  passwordResetOtp: (otp, firstName) => ({
    subject: 'Password Reset OTP - EquipRent',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0ea5e9;">Password Reset Request</h2>
        <p>Hello ${firstName},</p>
        <p>We received a request to reset your password. Use this OTP to proceed:</p>
        <div style="background: #f1f5f9; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
          <h1 style="color: #ef4444; letter-spacing: 8px; margin: 0;">${otp}</h1>
        </div>
        <p>This code will expire in <strong>10 minutes</strong>.</p>
        <p>If you didn't request this, please secure your account immediately.</p>
      </div>
    `
  }),

  registrationApproved: (firstName, role) => ({
    subject: 'Registration Approved - Welcome to EquipRent!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10b981;">🎉 Registration Approved!</h2>
        <p>Hello ${firstName},</p>
        <p>Great news! Your registration as a <strong>${role}</strong> has been approved.</p>
        <p>You can now log in and start using all features of EquipRent.</p>
        ${role === 'owner' ? '<p>Start listing your equipment and reach thousands of potential renters!</p>' : ''}
        <a href="${process.env.FRONTEND_URL}/login" style="display: inline-block; background: #0ea5e9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin-top: 16px;">Log In Now</a>
      </div>
    `
  }),

  registrationRejected: (firstName, reason) => ({
    subject: 'Registration Status Update - EquipRent',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ef4444;">Registration Not Approved</h2>
        <p>Hello ${firstName},</p>
        <p>We're sorry, but your registration could not be approved at this time.</p>
        ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
        <p>If you believe this is an error, please contact our support team.</p>
      </div>
    `
  }),

  // Booking Templates
  bookingRequest: (booking, equipment, renter) => ({
    subject: `New Booking Request - ${equipment.title}`,
    html: `
      <h2>New Booking Request</h2>
      <p>${renter.first_name} ${renter.last_name} has requested to book your equipment.</p>
      <h3>Equipment: ${equipment.title}</h3>
      <p><strong>Dates:</strong> ${booking.start_date} to ${booking.end_date}</p>
      <p><strong>Duration:</strong> ${booking.duration_type}</p>
      ${booking.renter_notes ? `<p><strong>Notes:</strong> ${booking.renter_notes}</p>` : ''}
      <p>Please log in to your dashboard to approve or reject this request.</p>
    `
  }),

  bookingApproved: (booking, equipment) => ({
    subject: `Booking Approved - ${equipment.title}`,
    html: `
      <h2>Your Booking Has Been Approved!</h2>
      <p>Great news! Your booking request has been approved.</p>
      <h3>Equipment: ${equipment.title}</h3>
      <p><strong>Booking #:</strong> ${booking.booking_number}</p>
      <p><strong>Dates:</strong> ${booking.start_date} to ${booking.end_date}</p>
      <p>Please log in to your dashboard for more details.</p>
    `
  }),

  bookingRejected: (booking, equipment, reason) => ({
    subject: `Booking Rejected - ${equipment.title}`,
    html: `
      <h2>Booking Request Rejected</h2>
      <p>Unfortunately, your booking request has been rejected.</p>
      <h3>Equipment: ${equipment.title}</h3>
      <p><strong>Dates:</strong> ${booking.start_date} to ${booking.end_date}</p>
      ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
      <p>Please try searching for other available equipment.</p>
    `
  }),

  bookingCancelled: (booking, equipment, cancelledBy) => ({
    subject: `Booking Cancelled - ${equipment.title}`,
    html: `
      <h2>Booking Cancelled</h2>
      <p>A booking has been cancelled.</p>
      <h3>Equipment: ${equipment.title}</h3>
      <p><strong>Booking #:</strong> ${booking.booking_number}</p>
      <p><strong>Cancelled by:</strong> ${cancelledBy}</p>
    `
  }),

  newReview: (review, equipment) => ({
    subject: `New Review for ${equipment.title}`,
    html: `
      <h2>New Review Received</h2>
      <p>Your equipment has received a new review.</p>
      <h3>Equipment: ${equipment.title}</h3>
      <p><strong>Rating:</strong> ${'⭐'.repeat(review.rating)}</p>
      ${review.comment ? `<p><strong>Comment:</strong> ${review.comment}</p>` : ''}
    `
  })
};

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

module.exports = { sendEmail, emailTemplates, generateOTP };

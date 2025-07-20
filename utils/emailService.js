const nodemailer = require("nodemailer")

// Create transporter
const createTransporter = () => {
  // For development, you can use a test account from Ethereal
  if (process.env.NODE_ENV !== "production" && (!process.env.EMAIL_USER || !process.env.EMAIL_PASS)) {
    console.log("Using ethereal email for development")
    return nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: "ethereal_user",
        pass: "ethereal_pass",
      },
    })
  }

  // For production or configured development, use the provided email service
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: process.env.EMAIL_SECURE === "true",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  })
}

// Send verification email
exports.sendVerificationEmail = async (email, token) => {
  const transporter = createTransporter()

  const verificationUrl = `${process.env.CLIENT_URL}/verify-email/${token}`

  const mailOptions = {
    from: `"Taskify" <${process.env.EMAIL_FROM || "noreply@taskify.com"}>`,
    to: email,
    subject: "Verify Your Email Address",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4a5568;">Welcome to Taskify!</h2>
        <p>Thank you for registering. Please verify your email address by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" style="background-color: #6c5ce7; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Verify Email</a>
        </div>
        <p>If the button doesn't work, you can also click on the link below:</p>
        <p><a href="${verificationUrl}">${verificationUrl}</a></p>
        <p>This link will expire in 24 hours.</p>
        <p>If you didn't create an account, you can safely ignore this email.</p>
        <p>Best regards,<br>The Taskify Team</p>
      </div>
    `,
    text: `
      Welcome to Taskify!
      
      Thank you for registering. Please verify your email address by clicking the link below:
      
      ${verificationUrl}
      
      This link will expire in 24 hours.
      
      If you didn't create an account, you can safely ignore this email.
      
      Best regards,
      The Taskify Team
    `,
  }

  try {
    const info = await transporter.sendMail(mailOptions)

    // For development, log the verification URL
    if (process.env.NODE_ENV !== "production") {
      console.log("Verification URL:", verificationUrl)
      console.log("Email preview URL:", nodemailer.getTestMessageUrl(info))
    }

    return info
  } catch (error) {
    console.error("Error sending verification email:", error)
    throw error
  }
}

// Send password reset email
exports.sendPasswordResetEmail = async (email, token) => {
  const transporter = createTransporter()

  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${token}`

  // Improved email template to reduce spam likelihood
  const mailOptions = {
    from: `"Taskify App" <${process.env.EMAIL_FROM || "noreply@taskify.com"}>`,
    to: email,
    subject: "Reset Your Taskify Password",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <h2 style="color: #6c5ce7; margin-bottom: 20px;">Reset Your Password</h2>
        <p>Hello,</p>
        <p>You recently requested to reset your password for your Taskify account. Click the button below to reset it:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #6c5ce7; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;">Reset Password</a>
        </div>
        <p>If you did not request a password reset, please ignore this email or contact support if you have questions.</p>
        <p>This link will expire in 30 minutes.</p>
        <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
        <p style="word-break: break-all;"><a href="${resetUrl}">${resetUrl}</a></p>
        <p>Best regards,<br>The Taskify Team</p>
        <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #666;">
          <p>This is an automated email. Please do not reply to this message.</p>
        </div>
      </div>
    `,
    text: `Reset Your Password
    
Hello,

You recently requested to reset your password for your Taskify account. Please go to this link to reset it:

${resetUrl}

If you did not request a password reset, please ignore this email or contact support if you have questions.

This link will expire in 30 minutes.

Best regards,
The Taskify Team`,
  }

  try {
    const info = await transporter.sendMail(mailOptions)

    // For development, log the reset URL
    if (process.env.NODE_ENV !== "production") {
      console.log("Password Reset URL:", resetUrl)
      console.log("Email preview URL:", nodemailer.getTestMessageUrl(info))
    }

    return info
  } catch (error) {
    console.error("Error sending password reset email:", error)
    throw error
  }
}

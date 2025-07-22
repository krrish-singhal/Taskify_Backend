const User = require("../models/User")
const jwt = require("jsonwebtoken")
const crypto = require("crypto")
const { sendVerificationEmail, sendPasswordResetEmail } = require("../utils/emailService")

// Register user
exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body

    // Check if user already exists
    const userExists = await User.findOne({ email })
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists",
      })
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(20).toString("hex")

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      verificationToken,
      isVerified: false, // Set to false initially
    })

    // Send verification email
    try {
      await sendVerificationEmail(email, verificationToken)
    } catch (error) {
      console.error("Error sending verification email:", error)
      // Continue with registration even if email fails
    }

    res.status(201).json({
      success: true,
      message: "Registration successful! Please check your email to verify your account.",
    
    })
  } catch (error) {
    next(error)
  }
}

// Verify email
exports.verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.params

    // Find user with this token
    const user = await User.findOne({ verificationToken: token })

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification token",
      })
    }

    // Update user
    user.isVerified = true
    user.verificationToken = undefined
    await user.save()

    // Redirect to login page with success message
    res.redirect(`${process.env.CLIENT_URL}/login?verified=true`)
  } catch (error) {
    next(error)
  }
}

// Login user
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body

    // Check if user exists
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      })
    }

    // Check if password is correct
    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      })
    }

  
    // Generate JWT
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "30d",
    })

    // Return token
    res.status(200).json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        profilePicture: user.profilePicture,
        role: user.role,
      },
    })
  } catch (error) {
    next(error)
  }
}

// Forgot password
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body

    // Find user
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User with this email does not exist",
      })
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString("hex")
    user.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex")
    user.resetPasswordExpires = Date.now() + 30 * 60 * 1000 // 30 minutes

    await user.save()

    // Send password reset email
    try {
      await sendPasswordResetEmail(email, resetToken)

      res.status(200).json({
        success: true,
        message: "Password reset email sent",
      })
    } catch (error) {
      console.error("Error sending password reset email:", error)

      user.resetPasswordToken = undefined
      user.resetPasswordExpires = undefined
      await user.save()

      return res.status(500).json({
        success: false,
        message: "Failed to send password reset email. Please try again later.",
      })
    }
  } catch (error) {
    next(error)
  }
}

// Reset password
exports.resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params
    const { password } = req.body

    // Hash token
    const resetPasswordToken = crypto.createHash("sha256").update(token).digest("hex")

    // Find user
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpires: { $gt: Date.now() },
    })

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token",
      })
    }

    // Update password
    user.password = password
    user.resetPasswordToken = undefined
    user.resetPasswordExpires = undefined
    await user.save()

    // Generate JWT
    const jwtToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "30d",
    })

    res.status(200).json({
      success: true,
      message: "Password reset successful",
      token: jwtToken,
    })
  } catch (error) {
    next(error)
  }
}

// Guest login
exports.guestLogin = async (req, res, next) => {
  try {
    // Create a random email and password
    const randomString = crypto.randomBytes(8).toString("hex")
    const email = `guest_${randomString}@taskify.com`
    const password = crypto.randomBytes(12).toString("hex")

    // Create guest user
    const user = await User.create({
      name: `Guest User`,
      email,
      password,
      isVerified: true,
      role: "guest",
    })

    // Generate JWT
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d", // Guest accounts expire sooner
    })

    // Return token
    res.status(200).json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    })
  } catch (error) {
    next(error)
  }
}

// Logout
exports.logout = async (req, res, next) => {
  try {
    // JWT is stateless, so we can't invalidate it on the server
    // The client should remove the token from storage
    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    })
  } catch (error) {
    next(error)
  }
}

// Change password (for authenticated users)
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body

    // Find user
    const user = await User.findById(req.user._id)

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    // Check if current password is correct
    const isMatch = await user.comparePassword(currentPassword)
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      })
    }

    // Update password
    user.password = newPassword
    await user.save()

    res.status(200).json({
      success: true,
      message: "Password updated successfully",
    })
  } catch (error) {
    next(error)
  }
}

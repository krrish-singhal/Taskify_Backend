const User = require("../models/User")

// Get current user
exports.getCurrentUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select("-password -resetPasswordToken -resetPasswordExpires")

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" })
    }

    res.status(200).json({
      success: true,
      user,
    })
  } catch (error) {
    next(error)
  }
}

// Update profile
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, email } = req.body

    // Find user
    const user = await User.findById(req.user._id)
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" })
    }

    // Check if email is already taken (if changing email)
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email })
      if (existingUser) {
        return res.status(400).json({ success: false, message: "Email is already in use" })
      }
      user.email = email
    }

    // Update fields
    if (name) user.name = name

    await user.save()

    // Return updated user without sensitive fields
    const updatedUser = await User.findById(user._id).select("-password -resetPasswordToken -resetPasswordExpires")

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser,
    })
  } catch (error) {
    next(error)
  }
}

// Change password
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body

    // Find user
    const user = await User.findById(req.user._id)
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" })
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword)
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Current password is incorrect" })
    }

    // Update password
    user.password = newPassword
    await user.save()

    res.status(200).json({
      success: true,
      message: "Password changed successfully",
    })
  } catch (error) {
    next(error)
  }
}

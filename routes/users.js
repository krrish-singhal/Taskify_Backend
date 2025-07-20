const express = require("express")
const { protect } = require("../middleware/authMiddleware")
const User = require("../models/User")

const router = express.Router()

// Get current user
router.get("/me", protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select(
      "-password -verificationToken -resetPasswordToken -resetPasswordExpires",
    )

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    res.status(200).json({
      success: true,
      user,
    })
  } catch (error) {
    next(error)
  }
})

// Update user profile
router.put("/profile", protect, async (req, res, next) => {
  try {
    const { name, email } = req.body

    // Find user
    const user = await User.findById(req.user._id)

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    // Check if email is being changed and if it's already in use
    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email })
      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: "Email already in use",
        })
      }
      user.email = email
    }

    // Update user fields
    if (name) user.name = name

    // Handle profile picture if provided
    if (req.body.profilePicture) {
      user.profilePicture = req.body.profilePicture
    }

    // Save user
    const updatedUser = await user.save()

    res.status(200).json({
      success: true,
      user: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        profilePicture: updatedUser.profilePicture,
        role: updatedUser.role,
      },
    })
  } catch (error) {
    next(error)
  }
})

// Change password
router.put("/change-password", protect, async (req, res, next) => {
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
})

// Get user by ID (for admin)
router.get("/:id", protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select(
      "-password -verificationToken -resetPasswordToken -resetPasswordExpires",
    )

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    res.status(200).json({
      success: true,
      user,
    })
  } catch (error) {
    next(error)
  }
})

// Search users (for admin)
router.get("/search/:query", protect, async (req, res, next) => {
  try {
    const { query } = req.params

    // Only allow admins to search users
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Not authorized to search users",
      })
    }

    const users = await User.find({
      $or: [{ name: { $regex: query, $options: "i" } }, { email: { $regex: query, $options: "i" } }],
    }).select("-password -verificationToken -resetPasswordToken -resetPasswordExpires")

    res.status(200).json({
      success: true,
      count: users.length,
      users,
    })
  } catch (error) {
    next(error)
  }
})

module.exports = router

const express = require("express")
const passport = require("passport")
const jwt = require("jsonwebtoken")
const {
  register,
  verifyEmail,
  login,
  forgotPassword,
  resetPassword,
  guestLogin,
  logout,
  changePassword, // Added this function import
} = require("../controller/authController")
const { protect } = require("../middleware/authMiddleware") // Import protect middleware

const router = express.Router()

// Auth routes
router.post("/register", register)
router.get("/verify/:token", verifyEmail)
router.post("/login", login)
router.post("/forgot-password", forgotPassword)
router.post("/reset-password/:token", resetPassword)
router.post("/guest", guestLogin)
router.post("/logout", logout)

// Added route for changing password (requires authentication)
router.post("/change-password", protect, changePassword)


module.exports = router

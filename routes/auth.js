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

// Google OAuth routes
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }))

router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/login", session: false }),
  (req, res) => {
    // Generate JWT
    const token = jwt.sign({ id: req.user._id }, process.env.JWT_SECRET, {
      expiresIn: "30d",
    })

    // Redirect to frontend with token as query param
    res.redirect(`${process.env.CLIENT_URL}/auth/success?token=${token}`)
  },
)

module.exports = router

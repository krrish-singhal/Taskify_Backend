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

router.get("/google/callback", 
  passport.authenticate("google", { session: false }), 
  async (req, res) => {
    try {
      // Generate JWT token
      const token = jwt.sign({ id: req.user._id }, process.env.JWT_SECRET, {
        expiresIn: "7d",
      });

      // Redirect to frontend with token
      const clientURL = process.env.CLIENT_URL || "https://taskify-142w85e2t-krrish-singhals-projects.vercel.app";
      res.redirect(`${clientURL}/auth/success?token=${token}`);
    } catch (error) {
      console.error("Google auth callback error:", error);
      const clientURL = process.env.CLIENT_URL || "https://taskify-142w85e2t-krrish-singhals-projects.vercel.app";
      res.redirect(`${clientURL}/login?error=auth_failed`);
    }
  }
)

module.exports = router

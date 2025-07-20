const jwt = require("jsonwebtoken")
const User = require("../models/User")

// Protect routes
exports.protect = async (req, res, next) => {
  try {
    let token

    // Check if token exists in headers
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1]
    }
    // Check if token exists in cookies
    else if (req.cookies && req.cookies.token) {
      token = req.cookies.token
    }

    // If no token, return error
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized to access this route",
      })
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET)

      // Get user from token
      req.user = await User.findById(decoded.id).select("-password")

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "User not found",
        })
      }

      next()
    } catch (error) {
      console.error("JWT verification error:", error)
      return res.status(401).json({
        success: false,
        message: "Not authorized to access this route",
      })
    }
  } catch (error) {
    console.error("Auth middleware error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    })
  }
}

// Admin only middleware
exports.admin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next()
  } else {
    res.status(403).json({
      success: false,
      message: "Not authorized as an admin",
    })
  }
}

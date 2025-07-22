const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

// Dynamically choose callback URL based on environment
const isProduction = process.env.NODE_ENV === 'production';
const CALLBACK_URL = isProduction
  ? 'https://taskify-backend-aqoy.onrender.com/api/auth/google/callback'
  : 'http://localhost:5000/api/auth/google/callback';

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: CALLBACK_URL,
      proxy: true,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user already exists with Google ID
        let user = await User.findOne({ googleId: profile.id });

        if (user) return done(null, user);

        // Check if email already registered
        user = await User.findOne({ email: profile.emails[0].value });

        if (user) {
          // Attach Google ID to existing user
          user.googleId = profile.id;
          if (!user.image && profile.photos?.length > 0) {
            user.image = profile.photos[0].value;
          }
          await user.save();
          return done(null, user);
        }

        // Create new user
        const newUser = await User.create({
          name: profile.displayName,
          email: profile.emails[0].value,
          googleId: profile.id,
          image: profile.photos?.[0]?.value || null,
          isVerified: true,
        });

        return done(null, newUser);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

// Serialize and deserialize user (optional if using sessions)
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

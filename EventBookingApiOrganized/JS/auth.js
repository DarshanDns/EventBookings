const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const CombinedModel = require('./models/CombinedModel'); // Adjust the path as needed

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/auth/google/callback"
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
        let user = await CombinedModel.findOne({ googleId: profile.id });
        if (!user) {
            user = new CombinedModel({
                username: profile.displayName,
                email: profile.emails[0].value,
                googleId: profile.id,
                profilePicture: {
                    data: profile.photos[0].value,
                    contentType: 'image/jpeg'
                }
            });
            await user.save();
        }
        return done(null, user);
    } catch (err) {
        return done(err, null);
    }
  }
));

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await CombinedModel.findById(id);
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});

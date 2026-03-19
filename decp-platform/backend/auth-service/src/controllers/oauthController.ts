import { Request, Response } from 'express';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { User } from '../models';
import { generateTokens } from '../utils/jwt';
import { config } from '../config';
import { logger } from '../utils/logger';

// Configure Google Strategy only if credentials are provided
if (config.google.clientId && 
    config.google.clientSecret && 
    config.google.clientId !== 'your-google-client-id' &&
    config.google.clientSecret !== 'your-google-client-secret') {
  
  passport.use(
    new GoogleStrategy(
      {
        clientID: config.google.clientId,
        clientSecret: config.google.clientSecret,
        callbackURL: config.google.callbackUrl
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0].value;
          if (!email) {
            return done(new Error('No email found in Google profile'), false);
          }

          let user = await User.findOne({ where: { email } });

          if (!user) {
            // Create new user
            user = await User.create({
              email,
              firstName: profile.name?.givenName || 'Unknown',
              lastName: profile.name?.familyName || 'User',
              googleId: profile.id,
              profilePicture: profile.photos?.[0].value,
              isEmailVerified: true,
              role: 'student'
            });
            logger.info(`New user created via Google OAuth: ${email}`);
          } else {
            // Update Google ID if not set
            if (!user.googleId) {
              await user.update({ googleId: profile.id });
            }
          }

          return done(null, user);
        } catch (error) {
          return done(error, false);
        }
      }
    )
  );
  
  logger.info('Google OAuth strategy initialized');
} else {
  logger.warn('Google OAuth not configured - set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET');
}

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await User.findByPk(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export const googleAuth = (req: Request, res: Response) => {
  if (!config.google.clientId || config.google.clientId === 'your-google-client-id') {
    return res.status(503).json({ 
      success: false, 
      message: 'Google OAuth is not configured on this server' 
    });
  }
  return passport.authenticate('google', { scope: ['profile', 'email'] })(req, res);
};

export const googleCallback = [
  (req: Request, res: Response, next: any) => {
    if (!config.google.clientId || config.google.clientId === 'your-google-client-id') {
      return res.status(503).json({ 
        success: false, 
        message: 'Google OAuth is not configured on this server' 
      });
    }
    return next();
  },
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user as User;

      if (!user) {
        res.redirect(`${config.frontendUrl}/login?error=oauth_failed`);
        return;
      }

      // Update last login
      await user.update({ lastLogin: new Date() });

      // Generate tokens
      const tokens = generateTokens({
        userId: user.id,
        email: user.email,
        role: user.role
      });

      logger.info(`User logged in via Google: ${user.email}`);

      // Redirect to frontend with tokens
      res.redirect(
        `${config.frontendUrl}/oauth/callback?` +
        `accessToken=${tokens.accessToken}&` +
        `refreshToken=${tokens.refreshToken}&` +
        `expiresIn=${tokens.expiresIn}`
      );
    } catch (error) {
      logger.error('Google OAuth callback error:', error);
      res.redirect(`${config.frontendUrl}/login?error=server_error`);
    }
  }
];

export const initPassport = (): typeof passport => passport;

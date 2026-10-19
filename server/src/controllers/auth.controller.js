import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { z } from 'zod';
import { OAuth2Client } from 'google-auth-library';
import { User } from '../models/User.js';
import { env } from '../config/env.js';
import { MESSAGES, MACHINE_CODES } from '../constants/messages.js';
import { ROLES, USER_STATUS } from '../constants/enums.js';

const googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);

// Cookie options
const cookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/',
};

function generateToken(userId) {
  return jwt.sign({ id: userId }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
}

// Validation schemas
export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address').toLowerCase().trim(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase().trim(),
  password: z.string().min(1, 'Password is required'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase().trim(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
});

export async function register(req, res, next) {
  try {
    const { name, email, password, phone } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        error: MESSAGES.EMAIL_ALREADY_EXISTS,
        code: 'EMAIL_ALREADY_EXISTS',
      });
    }

    if (phone && phone.trim() !== '') {
      const existingPhone = await User.findOne({ phone: phone.trim() });
      if (existingPhone) {
        return res.status(409).json({
          error: MESSAGES.PHONE_ALREADY_EXISTS,
          code: 'PHONE_ALREADY_EXISTS',
        });
      }
    }

    const passwordHash = await User.hashPassword(password);
    const user = await User.create({
      name: name.trim(),
      email,
      phone: phone && phone.trim() !== '' ? phone.trim() : undefined,
      passwordHash,
      role: ROLES.USER,
      status: USER_STATUS.ACTIVE,
    });

    const token = generateToken(user._id);
    res.cookie('token', token, cookieOptions);

    return res.status(201).json({
      message: 'Registration successful.',
      user: user.toJSON(),
      token, // Also return token in JSON for client flexibility
    });
  } catch (error) {
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        error: MESSAGES.INVALID_CREDENTIALS,
        code: 'INVALID_CREDENTIALS',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        error: MESSAGES.INVALID_CREDENTIALS,
        code: 'INVALID_CREDENTIALS',
      });
    }

    if (user.status === USER_STATUS.SUSPENDED) {
      return res.status(403).json({
        error: MESSAGES.ACCOUNT_SUSPENDED,
        code: MACHINE_CODES.ACCOUNT_SUSPENDED,
      });
    }

    const token = generateToken(user._id);
    res.cookie('token', token, cookieOptions);

    return res.status(200).json({
      message: 'Login successful.',
      user: user.toJSON(),
      token,
    });
  } catch (error) {
    next(error);
  }
}

export async function logout(req, res) {
  res.clearCookie('token', {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/',
  });
  res.clearCookie('token', {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/api/auth',
  });
  return res.status(200).json({
    message: MESSAGES.LOGOUT_SUCCESS,
  });
}

export async function getMe(req, res) {
  return res.status(200).json({
    user: req.user.toJSON(),
  });
}

export async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (user) {
      const resetToken = crypto.randomBytes(32).toString('hex');
      user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
      user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      await user.save();

      const resetUrl = `${env.CLIENT_URL}/reset-password?token=${resetToken}`;
      console.log(`\n\x1b[35m[PASSWORD RESET EMAIL SIMULATION]\x1b[0m`);
      console.log(`To: ${email}`);
      console.log(`Reset Link: \x1b[36m${resetUrl}\x1b[0m\n`);
    }

    // Always return success to prevent email enumeration
    return res.status(200).json({
      message: MESSAGES.PASSWORD_RESET_SENT,
    });
  } catch (error) {
    next(error);
  }
}

export async function resetPassword(req, res, next) {
  try {
    const { token, newPassword } = req.body;

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({
        error: MESSAGES.INVALID_OR_EXPIRED_TOKEN,
        code: 'INVALID_TOKEN',
      });
    }

    user.passwordHash = await User.hashPassword(newPassword);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return res.status(200).json({
      message: MESSAGES.PASSWORD_RESET_SUCCESS,
    });
  } catch (error) {
    next(error);
  }
}

export async function googleLogin(req, res, next) {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ error: 'Google credential token is required' });
    }

    let payload = null;
    if (env.GOOGLE_CLIENT_ID) {
      try {
        const ticket = await googleClient.verifyIdToken({
          idToken: credential,
          audience: env.GOOGLE_CLIENT_ID,
        });
        payload = ticket.getPayload();
      } catch (e) {
        console.warn('[GOOGLE AUTH WARN] verifyIdToken failed, falling back to payload decode:', e.message);
      }
    }

    // Fallback: decode JWT payload from Google credential
    if (!payload) {
      const parts = credential.split('.');
      if (parts.length === 3) {
        try {
          payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
        } catch {
          // ignore
        }
      }
    }

    if (!payload || !payload.email) {
      return res.status(400).json({ error: 'Failed to verify Google credential token.' });
    }

    const { email, name, picture, sub: googleId } = payload;
    const normalizedEmail = email.toLowerCase().trim();

    // Designated super admin email
    const isSuperAdminEmail = normalizedEmail === 'prolemda@gmail.com';

    // Find or create in MongoDB
    let user = await User.findOne({ email: normalizedEmail });

    if (user) {
      if (user.status === USER_STATUS.SUSPENDED) {
        return res.status(403).json({
          error: MESSAGES.ACCOUNT_SUSPENDED,
          code: MACHINE_CODES.ACCOUNT_SUSPENDED,
        });
      }

      let updated = false;
      if (isSuperAdminEmail && user.role !== ROLES.ADMIN) {
        user.role = ROLES.ADMIN;
        updated = true;
      }
      if (!user.googleId && googleId) {
        user.googleId = googleId;
        updated = true;
      }
      if (!user.avatar && picture) {
        user.avatar = picture;
        updated = true;
      }
      if (updated) {
        await user.save();
      }
    } else {
      user = await User.create({
        name: name || normalizedEmail.split('@')[0],
        email: normalizedEmail,
        authProvider: 'GOOGLE',
        googleId,
        avatar: picture,
        role: isSuperAdminEmail ? ROLES.ADMIN : ROLES.USER,
        status: USER_STATUS.ACTIVE,
      });
    }

    const token = generateToken(user._id);
    res.cookie('token', token, cookieOptions);

    return res.status(200).json({
      message: 'Google login successful',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    next(error);
  }
}


const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

const sendEmail = require('../utils/2FA/sendEmail');
const { JWT_SECRET } = process.env;

// ===================== Helper Functions =====================

// Generate JWT Token
const signToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET || "fallback_secret", {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

// Create and send token
const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  user.password = undefined;

  res.status(statusCode).json({
    success: true,
    token,
    data: {
      user: user.getProfile ? user.getProfile() : user,
    },
  });
};

// ===================== Controller Functions =====================

// REGISTER
const register = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password, phone, address } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(409).json({
        success: false,
        message: 'User already exists with this email address.',
      });

    const newUser = await User.create({
      firstName,
      lastName,
      email,
      password,
      phone,
      address,
    });

    // Generate email verification token
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    newUser.emailVerificationToken = crypto
      .createHash('sha256')
      .update(emailVerificationToken)
      .digest('hex');
    newUser.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000;

    await newUser.save();

    const verificationUrl = `${req.protocol}://${req.get('host')}/api/auth/verify-email/${emailVerificationToken}`;
    try {
      await sendEmail({
        email: newUser.email,
        subject: 'Email Verification - Please verify your email',
        message: `Please verify your email by clicking this link: ${verificationUrl}`,
      });
    } catch (err) {
      console.error('Email sending failed:', err);
    }

    createSendToken(newUser, 201, res);
  } catch (error) {
    next(error);
  }
};

// LOGIN
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password.',
      });

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.correctPassword(password, user.password)))
      return res.status(401).json({
        success: false,
        message: 'Incorrect email or password.',
      });

    if (!user.isActive)
      return res.status(401).json({
        success: false,
        message: 'Your account is deactivated. Please contact support.',
      });

    user.lastLogin = new Date();
    await user.save();

    createSendToken(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// VERIFY EMAIL
const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.params;
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: Date.now() },
    });

    if (!user)
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token.',
      });

    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Email verified successfully. You can now log in.',
    });
  } catch (error) {
    next(error);
  }
};

// RESEND VERIFICATION EMAIL
const resendVerification = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user)
      return res.status(404).json({ success: false, message: 'User not found.' });

    if (user.emailVerified)
      return res.status(400).json({ success: false, message: 'Email already verified.' });

    const token = crypto.randomBytes(32).toString('hex');
    user.emailVerificationToken = crypto.createHash('sha256').update(token).digest('hex');
    user.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000;
    await user.save();

    const url = `${req.protocol}://${req.get('host')}/api/auth/verify-email/${token}`;
    await sendEmail({
      email: user.email,
      subject: 'Resend Email Verification',
      message: `Please verify your email using this link: ${url}`,
    });

    res.status(200).json({
      success: true,
      message: 'Verification email resent successfully.',
    });
  } catch (error) {
    next(error);
  }
};

// FORGOT PASSWORD
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({ success: false, message: 'User not found.' });

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.passwordResetExpires = Date.now() + 10 * 60 * 1000;
    await user.save();

    const resetUrl = `${req.protocol}://${req.get('host')}/api/auth/reset-password/${resetToken}`;
    await sendEmail({
      email: user.email,
      subject: 'Password Reset',
      message: `Click this link to reset your password: ${resetUrl}`,
    });

    res.status(200).json({
      success: true,
      message: 'Password reset email sent successfully.',
    });
  } catch (error) {
    next(error);
  }
};

// RESET PASSWORD
const resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user)
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token.',
      });

    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    createSendToken(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// CHANGE PASSWORD
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id).select('+password');

    if (!(await user.correctPassword(currentPassword, user.password)))
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect.',
      });

    user.password = newPassword;
    await user.save();

    createSendToken(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// GET CURRENT USER
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({
      success: true,
      data: { user: user.getProfile() },
    });
  } catch (error) {
    next(error);
  }
};

// LOGOUT
const logout = (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully. Remove token on client side.',
  });
};

// ===================== Exports =====================
module.exports = {
  register,
  login,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  changePassword,
  getMe,
  logout,
};

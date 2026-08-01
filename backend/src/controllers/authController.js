const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const redisClient = require('../config/redisClient');

const ACCESS_TOKEN_TTL = '15min';
const REFRESH_TOKEN_TTL_SECONDS = 30 * 24 * 60 * 60;

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_TTL
  });
};

const generateRefreshToken = async (userId) => {
  const refreshToken = crypto.randomBytes(40).toString('hex'); // random, not a JWT
  await redisClient.set(`refresh:${refreshToken}`, userId.toString(), { EX: REFRESH_TOKEN_TTL_SECONDS });
  return refreshToken;
};

const register = async (req, res) => {
  try {
    const { name, email, password, role, location, phone } = req.body;


    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role,
      ...(phone && { phone }),
      ...(location?.coordinates?.length === 2 && { location }),
    });

    const accessToken = generateToken(user._id);
    const refreshToken = await generateRefreshToken(user._id);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: REFRESH_TOKEN_TTL_SECONDS * 1000,
    });

    res.status(201).json({
      success: true,
      token: accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        location: user.location
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const accessToken = generateToken(user._id);
    const refreshToken = await generateRefreshToken(user._id);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: REFRESH_TOKEN_TTL_SECONDS * 1000,
    });

    res.json({
      success: true,
      token: accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        location: user.location
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const refresh = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) return res.status(401).json({ success: false, message: 'No refresh token' });

    const userId = await redisClient.get(`refresh:${refreshToken}`);
    if (!userId) return res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });

    const newAccessToken = generateToken(userId);
    res.json({ success: true, token: newAccessToken });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const logout = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) {
      await redisClient.del(`refresh:${refreshToken}`);
    }
    res.clearCookie('refreshToken');
    res.json({ success: true, message: 'Logged out' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { register, login, refresh, logout };


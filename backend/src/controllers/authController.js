import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

export const register = async (req, res) => {
  try {
    console.log('\x1b[36m%s\x1b[0m', '[AUTH TRACE] Register request received');
    console.log('\x1b[36m%s\x1b[0m', `[AUTH TRACE] DB=${User.db?.name || 'unknown'} collection=${User.collection?.name || 'unknown'}`);
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('\x1b[31m%s\x1b[0m', '[AUTH ERROR] Email already exists:', email);
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    console.log('\x1b[36m%s\x1b[0m', '[AUTH TRACE] Creating user...');
    const user = await User.create({
      name,
      email,
      password
    });
    console.log('\x1b[36m%s\x1b[0m', `[AUTH TRACE] User created _id=${user._id}`);

    const token = generateToken(user._id);

    console.log('\x1b[32m%s\x1b[0m', '[AUTH SUCCESS] User Registered:');
    console.log('\x1b[32m%s\x1b[0m', `Email: ${email}`);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.log('\x1b[31m%s\x1b[0m', '[AUTH ERROR] Registration failed:', error.message);
    res.status(500).json({
      success: false,
      message: 'Registration failed'
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      console.log('\x1b[31m%s\x1b[0m', '[AUTH ERROR] Invalid email:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.log('\x1b[31m%s\x1b[0m', '[AUTH ERROR] Invalid password for:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const token = generateToken(user._id);

    console.log('\x1b[32m%s\x1b[0m', '[AUTH SUCCESS] User Logged In:');
    console.log('\x1b[32m%s\x1b[0m', `Email: ${email}`);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.log('\x1b[31m%s\x1b[0m', '[AUTH ERROR] Login failed:', error.message);
    res.status(500).json({
      success: false,
      message: 'Login failed'
    });
  }
};

export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.log('\x1b[31m%s\x1b[0m', '[AUTH ERROR] Profile fetch failed:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile'
    });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id).select('+password');

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      console.log('\x1b[31m%s\x1b[0m', '[AUTH ERROR] Current password incorrect for:', user.email);
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    user.password = newPassword;
    await user.save();

    console.log('\x1b[32m%s\x1b[0m', '[AUTH SUCCESS] Password changed for:', user.email);

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.log('\x1b[31m%s\x1b[0m', '[AUTH ERROR] Password change failed:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to change password'
    });
  }
};

export const deleteAccount = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.user.id);

    console.log('\x1b[32m%s\x1b[0m', '[AUTH SUCCESS] Account deleted for user ID:', req.user.id);

    res.status(200).json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    console.log('\x1b[31m%s\x1b[0m', '[AUTH ERROR] Account deletion failed:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to delete account'
    });
  }
};

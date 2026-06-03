import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      console.log('\x1b[31m%s\x1b[0m', '[AUTH ERROR] No token provided');
      return res.status(401).json({ 
        success: false, 
        message: 'Not authorized to access this route' 
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id);
      
      if (!req.user) {
        console.log('\x1b[31m%s\x1b[0m', '[AUTH ERROR] User not found');
        return res.status(401).json({ 
          success: false, 
          message: 'User not found' 
        });
      }

      next();
    } catch (error) {
      console.log('\x1b[31m%s\x1b[0m', '[AUTH ERROR] Invalid token:', error.message);
      return res.status(401).json({ 
        success: false, 
        message: 'Token is invalid' 
      });
    }
  } catch (error) {
    console.log('\x1b[31m%s\x1b[0m', '[AUTH ERROR] Authentication failed:', error.message);
    return res.status(500).json({ 
      success: false, 
      message: 'Authentication failed' 
    });
  }
};

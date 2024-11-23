import jwt from 'jsonwebtoken';
import * as db from '../db.js';

export const authenticateToken = async (req, res, next) => {
  const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const users = await db.query(
      'SELECT id, email, role, name, is_banned FROM users WHERE id = ?',
      [decoded.id]
    );
    
    if (!users.length) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }

    const user = users[0];
    
    if (user.is_banned) {
      return res.status(403).json({ error: 'Your account has been banned' });
    }
    
    // Update user IP history
    try {
      await db.query(
        `INSERT INTO user_ips (user_id, ip_address) 
         VALUES (?, ?) 
         ON DUPLICATE KEY UPDATE last_seen = CURRENT_TIMESTAMP`,
        [user.id, req.clientIp]
      );
    } catch (err) {
      console.error('Error updating IP history:', err);
    }
    
    req.user = user;
    next();
  } catch (err) {
    console.error('Auth error:', err);
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

export const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

export const checkIpBan = async (req, res, next) => {
  try {
    const clientIp = req.clientIp;
    const bans = await db.query(
      'SELECT * FROM ip_bans WHERE ip_address = ? AND (expires_at IS NULL OR expires_at > NOW())',
      [clientIp]
    );
    
    if (bans.length > 0) {
      return res.status(403).json({ error: 'Your IP address has been banned' });
    }
    next();
  } catch (err) {
    console.error('IP ban check error:', err);
    next();
  }
};
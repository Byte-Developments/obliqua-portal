import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import * as db from '../db.js';

export const register = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const [result] = await connection.execute(
      'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
      [name, email, hashedPassword]
    );

    // Create default user settings
    await connection.execute(
      'INSERT INTO user_settings (user_id, language, allow_messages, show_activity) VALUES (?, ?, ?, ?)',
      [result.insertId, 'en', false, true]
    );

    await connection.commit();

    const user = {
      id: result.insertId,
      name,
      email,
      role: 'user'
    };

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '24h' });
    res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });
    res.status(201).json(user);
  } catch (err) {
    if (connection) await connection.rollback();
    
    console.error('Registration error:', err);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: 'Server error during registration' });
  } finally {
    if (connection) connection.release();
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const users = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    
    if (!users.length) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = users[0];
    const validPassword = await bcrypt.compare(password, user.password);
    
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (user.is_banned) {
      return res.status(403).json({ error: 'Your account has been banned' });
    }

    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000
    });

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar_key: user.avatar_key
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login' });
  }
};

export const logout = (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
};

export const getCurrentUser = async (req, res) => {
  try {
    const users = await db.query(
      'SELECT id, name, email, role, avatar_key FROM users WHERE id = ?',
      [req.user.id]
    );
    
    if (!users.length) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(users[0]);
  } catch (err) {
    console.error('Auth/me error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};
import bcrypt from 'bcryptjs';
import * as db from '../db.js';
import { uploadToS3, getSignedDownloadUrl, deleteFromS3 } from '../s3.js';

export const getAllUsers = async (req, res) => {
  try {
    const users = await db.query(
      'SELECT id, name, email, role, created_at, is_banned, avatar_key FROM users'
    );
    res.json(users);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

export const createUser = async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const [result] = await connection.execute(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, role]
    );

    // Create default user settings
    await connection.execute(
      'INSERT INTO user_settings (user_id, language, allow_messages, show_activity) VALUES (?, ?, ?, ?)',
      [result.insertId, 'en', false, true]
    );

    await connection.commit();

    const [newUser] = await connection.execute(
      'SELECT id, name, email, role, created_at FROM users WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json(newUser[0]);
  } catch (err) {
    if (connection) await connection.rollback();
    
    console.error('User creation error:', err);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: 'Failed to create user' });
  } finally {
    if (connection) connection.release();
  }
};

export const updateUser = async (req, res) => {
  const { name, email, role, password } = req.body;
  const userId = req.params.id;

  if (!name || !email || !role) {
    return res.status(400).json({ error: 'Name, email, and role are required' });
  }

  try {
    let query = 'UPDATE users SET name = ?, email = ?, role = ?';
    let params = [name, email, role];

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      query += ', password = ?';
      params.push(hashedPassword);
    }

    query += ' WHERE id = ?';
    params.push(userId);

    await db.query(query, params);
    
    const users = await db.query(
      'SELECT id, name, email, role, created_at FROM users WHERE id = ?',
      [userId]
    );

    if (!users.length) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(users[0]);
  } catch (err) {
    console.error('User update error:', err);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: 'Failed to update user' });
  }
};

export const deleteUser = async (req, res) => {
  const userId = req.params.id;

  if (userId === req.user.id.toString()) {
    return res.status(400).json({ error: 'Cannot delete your own account' });
  }

  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    // Get user's avatar key and project files before deletion
    const [user] = await connection.query(
      'SELECT avatar_key FROM users WHERE id = ?',
      [userId]
    );

    const files = await connection.query(
      'SELECT `key` FROM project_files WHERE uploaded_by = ? AND `key` IS NOT NULL',
      [userId]
    );

    // Delete avatar from S3 if it exists
    if (user?.avatar_key) {
      await deleteFromS3(user.avatar_key);
    }

    // Delete project files from S3 if they exist
    for (const file of files) {
      if (file.key) {
        await deleteFromS3(file.key);
      }
    }

    // Delete related records
    await connection.query('DELETE FROM user_settings WHERE user_id = ?', [userId]);
    await connection.query('DELETE FROM project_files WHERE uploaded_by = ?', [userId]);
    await connection.query('DELETE FROM user_ips WHERE user_id = ?', [userId]);
    await connection.query('DELETE FROM users WHERE id = ?', [userId]);

    await connection.commit();
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    if (connection) await connection.rollback();
    console.error('User deletion error:', err);
    res.status(500).json({ error: 'Failed to delete user' });
  } finally {
    if (connection) connection.release();
  }
};

export const getUserSettings = async (req, res) => {
  try {
    const settings = await db.query(
      'SELECT * FROM user_settings WHERE user_id = ?',
      [req.user.id]
    );
    
    if (!settings.length) {
      return res.status(404).json({ error: 'Settings not found' });
    }
    
    res.json(settings[0]);
  } catch (err) {
    console.error('Error fetching user settings:', err);
    res.status(500).json({ error: 'Failed to fetch user settings' });
  }
};

export const updateUserSettings = async (req, res) => {
  const { language, allow_messages, show_activity } = req.body;

  try {
    await db.query(
      `UPDATE user_settings 
       SET language = ?, allow_messages = ?, show_activity = ?
       WHERE user_id = ?`,
      [language, allow_messages, show_activity, req.user.id]
    );
    
    res.json({ language, allow_messages, show_activity });
  } catch (err) {
    console.error('Error updating user settings:', err);
    res.status(500).json({ error: 'Failed to update settings' });
  }
};

export const uploadAvatar = async (req, res) => {
  if (!req.files?.avatar) {
    return res.status(400).json({ error: 'No avatar file provided' });
  }

  const file = req.files.avatar;
  if (!file.mimetype.startsWith('image/')) {
    return res.status(400).json({ error: 'File must be an image' });
  }

  try {
    const users = await db.query(
      'SELECT avatar_key FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users[0]?.avatar_key) {
      await deleteFromS3(users[0].avatar_key);
    }

    const key = await uploadToS3(file, 'avatars');
    
    await db.query(
      'UPDATE users SET avatar_key = ? WHERE id = ?',
      [key, req.user.id]
    );

    const url = await getSignedDownloadUrl(key);
    res.json({ key, url });
  } catch (err) {
    console.error('Avatar upload error:', err);
    res.status(500).json({ error: 'Failed to upload avatar' });
  }
};

export const getAvatarUrl = async (req, res) => {
  const { userId } = req.params;

  try {
    const users = await db.query(
      'SELECT avatar_key FROM users WHERE id = ?',
      [userId]
    );

    if (!users.length || !users[0].avatar_key) {
      return res.status(404).json({ error: 'Avatar not found' });
    }

    const url = await getSignedDownloadUrl(users[0].avatar_key);
    res.json({ url });
  } catch (err) {
    console.error('Error getting avatar URL:', err);
    res.status(500).json({ error: 'Failed to get avatar URL' });
  }
};
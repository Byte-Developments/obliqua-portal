import * as db from '../db.js';

export const banUser = async (req, res) => {
  const { userId } = req.params;
  const { reason } = req.body;

  if (!reason) {
    return res.status(400).json({ error: 'Ban reason is required' });
  }

  try {
    await db.query(
      `UPDATE users 
       SET is_banned = true, banned_at = CURRENT_TIMESTAMP, 
           banned_by = ?, ban_reason = ?
       WHERE id = ?`,
      [req.user.id, reason, userId]
    );

    res.json({ message: 'User banned successfully' });
  } catch (err) {
    console.error('Ban error:', err);
    res.status(500).json({ error: 'Failed to ban user' });
  }
};

export const banIp = async (req, res) => {
  const { ip_address, reason, duration } = req.body;

  if (!ip_address || !reason) {
    return res.status(400).json({ error: 'IP address and reason are required' });
  }

  try {
    const expiresAt = duration ? new Date(Date.now() + duration * 3600000) : null;
    
    await db.query(
      `INSERT INTO ip_bans (ip_address, banned_by, ban_reason, expires_at)
       VALUES (?, ?, ?, ?)`,
      [ip_address, req.user.id, reason, expiresAt]
    );

    res.json({ message: 'IP banned successfully' });
  } catch (err) {
    console.error('IP ban error:', err);
    res.status(500).json({ error: 'Failed to ban IP' });
  }
};

export const getUserBans = async (req, res) => {
  try {
    const bans = await db.query(
      `SELECT u.id, u.name, u.email, u.banned_at, u.ban_reason,
              admin.name as banned_by
       FROM users u
       LEFT JOIN users admin ON u.banned_by = admin.id
       WHERE u.is_banned = true
       ORDER BY u.banned_at DESC`
    );
    res.json(bans);
  } catch (err) {
    console.error('Error fetching user bans:', err);
    res.status(500).json({ error: 'Failed to fetch user bans' });
  }
};

export const getIpBans = async (req, res) => {
  try {
    const bans = await db.query(
      `SELECT b.*, u.name as banned_by
       FROM ip_bans b
       LEFT JOIN users u ON b.banned_by = u.id
       ORDER BY b.banned_at DESC`
    );
    res.json(bans);
  } catch (err) {
    console.error('Error fetching IP bans:', err);
    res.status(500).json({ error: 'Failed to fetch IP bans' });
  }
};

export const unbanUser = async (req, res) => {
  const { userId } = req.params;
  try {
    await db.query(
      'UPDATE users SET is_banned = false, banned_at = NULL, banned_by = NULL, ban_reason = NULL WHERE id = ?',
      [userId]
    );
    res.json({ message: 'User unbanned successfully' });
  } catch (err) {
    console.error('Unban error:', err);
    res.status(500).json({ error: 'Failed to unban user' });
  }
};

export const unbanIp = async (req, res) => {
  const { banId } = req.params;
  try {
    await db.query('DELETE FROM ip_bans WHERE id = ?', [banId]);
    res.json({ message: 'IP unbanned successfully' });
  } catch (err) {
    console.error('IP unban error:', err);
    res.status(500).json({ error: 'Failed to unban IP' });
  }
};
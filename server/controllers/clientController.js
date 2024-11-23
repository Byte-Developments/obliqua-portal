import * as db from '../db.js';

export const getAllClients = async (req, res) => {
  try {
    // For admin, get all users
    // For regular users, only get themselves
    const query = req.user.role === 'admin'
      ? 'SELECT id, name, email FROM users'
      : 'SELECT id, name, email FROM users WHERE id = ?';
    
    const params = req.user.role === 'admin' ? [] : [req.user.id];
    const clients = await db.query(query, params);
    
    res.json(clients);
  } catch (err) {
    console.error('Error fetching clients:', err);
    res.status(500).json({ error: 'Failed to fetch clients' });
  }
};

export const getClient = async (req, res) => {
  try {
    // Only admins can view other clients' details
    if (req.user.role !== 'admin' && req.user.id !== parseInt(req.params.id)) {
      return res.status(403).json({ error: 'Unauthorized to view this client' });
    }

    const clients = await db.query(
      'SELECT id, name, email, created_at FROM users WHERE id = ?',
      [req.params.id]
    );

    if (!clients.length) {
      return res.status(404).json({ error: 'Client not found' });
    }

    res.json(clients[0]);
  } catch (err) {
    console.error('Error fetching client:', err);
    res.status(500).json({ error: 'Failed to fetch client' });
  }
};
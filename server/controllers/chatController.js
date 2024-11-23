import * as db from '../db.js';

export const getMessages = async (req, res) => {
  const { projectId } = req.params;
  const { page = 1, limit = 50 } = req.query;
  const offset = (page - 1) * limit;

  try {
    // Check project access
    const project = await db.query(
      `SELECT * FROM projects WHERE id = ? AND 
       (client_id = ? OR ? = 'admin')`,
      [projectId, req.user.id, req.user.role]
    );

    if (!project.length) {
      return res.status(403).json({ error: 'Unauthorized access to project chat' });
    }

    // Fetch messages with user info
    const messages = await db.query(
      `SELECT m.*, u.name, u.role, u.avatar_key
       FROM project_messages m
       JOIN users u ON m.user_id = u.id
       WHERE m.project_id = ?
       ORDER BY m.created_at DESC
       LIMIT ? OFFSET ?`,
      [projectId, parseInt(limit), offset]
    );

    // Decrypt messages
    const decryptedMessages = messages.map(msg => ({
      ...msg,
      content: db.decryptMessage(msg.content, msg.iv)
    }));

    res.json(decryptedMessages);
  } catch (err) {
    console.error('Error fetching messages:', err);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
};

export const sendMessage = async (req, res) => {
  const { projectId } = req.params;
  const { content } = req.body;

  if (!content?.trim()) {
    return res.status(400).json({ error: 'Message content is required' });
  }

  try {
    // Check project access
    const project = await db.query(
      `SELECT * FROM projects WHERE id = ? AND 
       (client_id = ? OR ? = 'admin')`,
      [projectId, req.user.id, req.user.role]
    );

    if (!project.length) {
      return res.status(403).json({ error: 'Unauthorized access to project chat' });
    }

    // Encrypt message
    const encrypted = db.encryptMessage(content);

    // Save message
    const result = await db.query(
      `INSERT INTO project_messages (project_id, user_id, content, iv)
       VALUES (?, ?, ?, ?)`,
      [projectId, req.user.id, encrypted.content, encrypted.iv]
    );

    // Fetch the saved message with user info
    const [message] = await db.query(
      `SELECT m.*, u.name, u.role, u.avatar_key
       FROM project_messages m
       JOIN users u ON m.user_id = u.id
       WHERE m.id = ?`,
      [result.insertId]
    );

    message.content = content; // Send back decrypted content

    res.status(201).json(message);
  } catch (err) {
    console.error('Error sending message:', err);
    res.status(500).json({ error: 'Failed to send message' });
  }
};

export const deleteMessage = async (req, res) => {
  const { projectId, messageId } = req.params;

  try {
    // Check message ownership
    const [message] = await db.query(
      `SELECT * FROM project_messages WHERE id = ? AND project_id = ? AND user_id = ?`,
      [messageId, projectId, req.user.id]
    );

    if (!message) {
      return res.status(403).json({ error: 'Unauthorized to delete this message' });
    }

    await db.query('DELETE FROM project_messages WHERE id = ?', [messageId]);
    res.json({ message: 'Message deleted successfully' });
  } catch (err) {
    console.error('Error deleting message:', err);
    res.status(500).json({ error: 'Failed to delete message' });
  }
};
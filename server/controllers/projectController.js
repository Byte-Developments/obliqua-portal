import * as db from '../db.js';
import { uploadToS3, getSignedDownloadUrl, deleteFromS3 } from '../s3.js';

export const getAllProjects = async (req, res) => {
  try {
    const query = req.user.role === 'admin'
      ? 'SELECT p.*, u.name as client_name FROM projects p JOIN users u ON p.client_id = u.id'
      : 'SELECT p.*, u.name as client_name FROM projects p JOIN users u ON p.client_id = u.id WHERE p.client_id = ?';
    
    const params = req.user.role === 'admin' ? [] : [req.user.id];
    const projects = await db.query(query, params);
    res.json(projects);
  } catch (err) {
    console.error('Error fetching projects:', err);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
};

export const createProject = async (req, res) => {
  const { name, description, status, client_id } = req.body;

  if (!name || !description || !status || !client_id) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const result = await db.query(
      'INSERT INTO projects (name, description, status, client_id) VALUES (?, ?, ?, ?)',
      [name, description, status, client_id]
    );

    const [project] = await db.query(
      'SELECT p.*, u.name as client_name FROM projects p JOIN users u ON p.client_id = u.id WHERE p.id = ?',
      [result.insertId]
    );

    res.status(201).json(project);
  } catch (err) {
    console.error('Project creation error:', err);
    res.status(500).json({ error: 'Failed to create project' });
  }
};

export const getProject = async (req, res) => {
  const { id } = req.params;

  try {
    const query = req.user.role === 'admin'
      ? 'SELECT p.*, u.name as client_name FROM projects p JOIN users u ON p.client_id = u.id WHERE p.id = ?'
      : 'SELECT p.*, u.name as client_name FROM projects p JOIN users u ON p.client_id = u.id WHERE p.id = ? AND p.client_id = ?';
    
    const params = req.user.role === 'admin' ? [id] : [id, req.user.id];
    const projects = await db.query(query, params);

    if (!projects.length) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json(projects[0]);
  } catch (err) {
    console.error('Error fetching project:', err);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
};

export const updateProject = async (req, res) => {
  const { id } = req.params;
  const { name, description, status, client_id } = req.body;

  if (!name || !description || !status || !client_id) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    // Check authorization
    const project = await db.query(
      'SELECT * FROM projects WHERE id = ? AND (client_id = ? OR ? = "admin")',
      [id, req.user.id, req.user.role]
    );

    if (!project.length) {
      return res.status(403).json({ error: 'Unauthorized to update this project' });
    }

    await db.query(
      'UPDATE projects SET name = ?, description = ?, status = ?, client_id = ? WHERE id = ?',
      [name, description, status, client_id, id]
    );

    const [updatedProject] = await db.query(
      'SELECT p.*, u.name as client_name FROM projects p JOIN users u ON p.client_id = u.id WHERE p.id = ?',
      [id]
    );

    res.json(updatedProject);
  } catch (err) {
    console.error('Project update error:', err);
    res.status(500).json({ error: 'Failed to update project' });
  }
};

export const deleteProject = async (req, res) => {
  const { id } = req.params;

  try {
    // Check authorization
    const project = await db.query(
      'SELECT * FROM projects WHERE id = ? AND (client_id = ? OR ? = "admin")',
      [id, req.user.id, req.user.role]
    );

    if (!project.length) {
      return res.status(403).json({ error: 'Unauthorized to delete this project' });
    }

    // Delete associated files from S3
    const files = await db.query(
      'SELECT file_key FROM project_files WHERE project_id = ? AND file_key IS NOT NULL',
      [id]
    );

    for (const file of files) {
      await deleteFromS3(file.file_key);
    }

    // Delete project and related records
    await db.query('DELETE FROM project_files WHERE project_id = ?', [id]);
    await db.query('DELETE FROM project_messages WHERE project_id = ?', [id]);
    await db.query('DELETE FROM projects WHERE id = ?', [id]);

    res.json({ message: 'Project deleted successfully' });
  } catch (err) {
    console.error('Project deletion error:', err);
    res.status(500).json({ error: 'Failed to delete project' });
  }
};

export const uploadFile = async (req, res) => {
  const { projectId } = req.params;

  if (!req.files?.file) {
    return res.status(400).json({ error: 'No file provided' });
  }

  try {
    // Check project access
    const project = await db.query(
      'SELECT * FROM projects WHERE id = ? AND (client_id = ? OR ? = "admin")',
      [projectId, req.user.id, req.user.role]
    );

    if (!project.length) {
      return res.status(403).json({ error: 'Unauthorized to upload to this project' });
    }

    const file = req.files.file;
    const fileKey = await uploadToS3(file, `projects/${projectId}`);
    
    const result = await db.query(
      `INSERT INTO project_files (project_id, name, size, mime_type, file_key, uploaded_by)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [projectId, file.name, file.size, file.mimetype, fileKey, req.user.id]
    );

    const [uploadedFile] = await db.query(
      `SELECT f.*, u.name as uploader_name 
       FROM project_files f 
       JOIN users u ON f.uploaded_by = u.id 
       WHERE f.id = ?`,
      [result.insertId]
    );

    uploadedFile.url = await getSignedDownloadUrl(fileKey);
    res.status(201).json(uploadedFile);
  } catch (err) {
    console.error('File upload error:', err);
    res.status(500).json({ error: 'Failed to upload file' });
  }
};

export const getFiles = async (req, res) => {
  const { projectId } = req.params;
  const { page = 1, limit = 10 } = req.query;
  const offset = (page - 1) * limit;

  try {
    // Check project access
    const project = await db.query(
      'SELECT * FROM projects WHERE id = ? AND (client_id = ? OR ? = "admin")',
      [projectId, req.user.id, req.user.role]
    );

    if (!project.length) {
      return res.status(403).json({ error: 'Unauthorized to view project files' });
    }

    // Get total count
    const [{ total }] = await db.query(
      'SELECT COUNT(*) as total FROM project_files WHERE project_id = ?',
      [projectId]
    );

    // Get paginated files
    const files = await db.query(
      `SELECT f.*, u.name as uploader_name 
       FROM project_files f 
       JOIN users u ON f.uploaded_by = u.id 
       WHERE f.project_id = ?
       ORDER BY f.uploaded_at DESC 
       LIMIT ? OFFSET ?`,
      [projectId, parseInt(limit), offset]
    );

    const filesWithUrls = await Promise.all(
      files.map(async (file) => ({
        ...file,
        url: await getSignedDownloadUrl(file.file_key)
      }))
    );

    res.json({
      files: filesWithUrls,
      pagination: {
        total,
        page: parseInt(page),
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error('Error fetching files:', err);
    res.status(500).json({ error: 'Failed to fetch files' });
  }
};

export const deleteFile = async (req, res) => {
  const { projectId, fileId } = req.params;

  try {
    // Check project access
    const project = await db.query(
      'SELECT * FROM projects WHERE id = ? AND (client_id = ? OR ? = "admin")',
      [projectId, req.user.id, req.user.role]
    );

    if (!project.length) {
      return res.status(403).json({ error: 'Unauthorized to delete project files' });
    }

    const [file] = await db.query(
      'SELECT * FROM project_files WHERE id = ? AND project_id = ?',
      [fileId, projectId]
    );

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    await deleteFromS3(file.file_key);
    await db.query('DELETE FROM project_files WHERE id = ?', [fileId]);

    res.json({ message: 'File deleted successfully' });
  } catch (err) {
    console.error('File deletion error:', err);
    res.status(500).json({ error: 'Failed to delete file' });
  }
};
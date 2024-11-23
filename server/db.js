import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import CryptoJS from 'crypto-js';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// Test database connection
const testConnection = async () => {
  let connection;
  try {
    connection = await pool.getConnection();
    console.log('Successfully connected to MySQL database');
  } catch (err) {
    console.error('Error connecting to MySQL database:', err);
    throw err;
  } finally {
    if (connection) connection.release();
  }
};

// Initialize database tables
const initDb = async () => {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Create project_files table with file_key instead of key
    await connection.query(`
      CREATE TABLE IF NOT EXISTS project_files (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        project_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        size BIGINT NOT NULL,
        mime_type VARCHAR(255) NOT NULL,
        file_key VARCHAR(255) NOT NULL,
        uploaded_by INT NOT NULL,
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
        FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_project_time (project_id, uploaded_at)
      )
    `);

    await connection.commit();
    console.log('Database tables initialized successfully');
  } catch (err) {
    if (connection) await connection.rollback();
    console.error('Error initializing database tables:', err);
    throw err;
  } finally {
    if (connection) connection.release();
  }
};

// Initialize database
testConnection()
  .then(() => initDb())
  .catch(console.error);

export const getConnection = async () => {
  return await pool.getConnection();
};

export const query = async (sql, params = []) => {
  let connection;
  try {
    connection = await pool.getConnection();
    const [rows] = await connection.execute(sql, params);
    return rows;
  } finally {
    if (connection) connection.release();
  }
};

export const transaction = async (callback) => {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (err) {
    if (connection) await connection.rollback();
    throw err;
  } finally {
    if (connection) connection.release();
  }
};

// Message encryption/decryption utilities
const ENCRYPTION_KEY = process.env.JWT_SECRET.slice(0, 32);

export const encryptMessage = (text) => {
  const iv = CryptoJS.lib.WordArray.random(16);
  const encrypted = CryptoJS.AES.encrypt(text, ENCRYPTION_KEY, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  });
  
  return {
    content: encrypted.toString(),
    iv: iv.toString(CryptoJS.enc.Hex)
  };
};

export const decryptMessage = (encrypted, iv) => {
  try {
    const decrypted = CryptoJS.AES.decrypt(encrypted, ENCRYPTION_KEY, {
      iv: CryptoJS.enc.Hex.parse(iv),
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });
    
    return decrypted.toString(CryptoJS.enc.Utf8);
  } catch (err) {
    console.error('Decryption error:', err);
    return '[Encrypted message]';
  }
};
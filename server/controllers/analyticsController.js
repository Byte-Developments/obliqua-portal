import * as db from '../db.js';

export const getAnalytics = async (req, res) => {
  try {
    const analytics = {};

    // Get total users
    const userCount = await db.query('SELECT COUNT(*) as count FROM users');
    analytics.totalUsers = userCount[0].count;

    // Get total projects
    const projectCount = await db.query('SELECT COUNT(*) as count FROM projects');
    analytics.totalProjects = projectCount[0].count;

    // Get projects by status
    const projectsByStatus = await db.query(
      'SELECT status, COUNT(*) as count FROM projects GROUP BY status'
    );
    analytics.projectsByStatus = projectsByStatus.map(r => ({
      name: r.status,
      value: r.count
    }));

    // Get user growth over time
    const userGrowth = await db.query(
      `SELECT DATE(created_at) as date, COUNT(*) as users
       FROM users
       GROUP BY DATE(created_at)
       ORDER BY date DESC
       LIMIT 30`
    );
    analytics.userGrowth = userGrowth;

    // Get project growth over time
    const projectGrowth = await db.query(
      `SELECT DATE(created_at) as date, COUNT(*) as projects
       FROM projects
       GROUP BY DATE(created_at)
       ORDER BY date DESC
       LIMIT 30`
    );
    analytics.projectGrowth = projectGrowth;

    res.json(analytics);
  } catch (err) {
    console.error('Error fetching analytics:', err);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
};
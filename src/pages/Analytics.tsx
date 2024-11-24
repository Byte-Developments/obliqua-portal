import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import { FiUsers, FiFolder, FiActivity } from 'react-icons/fi';

interface Stats {
  totalUsers: number;
  totalProjects: number;
  projectsByStatus: { name: string; value: number; }[];
  userGrowth: { date: string; users: number; }[];
  projectGrowth: { date: string; projects: number; }[];
}

const COLORS = ['#8B5CF6', '#EC4899', '#10B981', '#F59E0B'];

function Analytics() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://199.85.208.153:3000/api/analytics');
      setStats(response.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch analytics data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-portal-purple"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl lg:text-3xl font-semibold text-gray-800 mb-6">Analytics</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-6 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-portal-purple">
              <FiUsers size={24} />
            </div>
            <span className="text-sm font-medium text-green-500">+12%</span>
          </div>
          <h3 className="text-gray-600 text-sm">Total Users</h3>
          <p className="text-2xl font-semibold text-gray-800">{stats?.totalUsers}</p>
        </div>

        <div className="glass-card p-6 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center text-pink-500">
              <FiFolder size={24} />
            </div>
            <span className="text-sm font-medium text-green-500">+8%</span>
          </div>
          <h3 className="text-gray-600 text-sm">Total Projects</h3>
          <p className="text-2xl font-semibold text-gray-800">{stats?.totalProjects}</p>
        </div>

        <div className="glass-card p-6 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-500">
              <FiActivity size={24} />
            </div>
            <span className="text-sm font-medium text-green-500">+15%</span>
          </div>
          <h3 className="text-gray-600 text-sm">Active Projects</h3>
          <p className="text-2xl font-semibold text-gray-800">
            {stats?.projectsByStatus.find(s => s.name === 'active')?.value || 0}
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Growth Chart */}
        <div className="glass-card p-6 rounded-xl">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Growth Overview</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats?.userGrowth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="users" stroke="#8B5CF6" name="Users" />
                <Line type="monotone" dataKey="projects" stroke="#EC4899" name="Projects" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Project Status Distribution */}
        <div className="glass-card p-6 rounded-xl">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Project Status Distribution</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats?.projectsByStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {stats?.projectsByStatus.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Activity */}
        <div className="glass-card p-6 rounded-xl lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Monthly Activity</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.userGrowth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="users" fill="#8B5CF6" name="New Users" />
                <Bar dataKey="projects" fill="#EC4899" name="New Projects" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Analytics;
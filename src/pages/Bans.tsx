import { useState, useEffect } from 'react';
import { FiUserX, FiGlobe, FiClock, FiTrash2, FiShield } from 'react-icons/fi';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import UserPicker from '../components/UserPicker';

interface Ban {
  id: number;
  ip_address?: string;
  user_id?: number;
  user_name?: string;
  user_email?: string;
  banned_at: string;
  banned_by: string;
  ban_reason: string;
  expires_at: string | null;
}

function Bans() {
  const [userBans, setUserBans] = useState<Ban[]>([]);
  const [ipBans, setIpBans] = useState<Ban[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showBanForm, setShowBanForm] = useState(false);
  const [banType, setBanType] = useState<'user' | 'ip'>('user');
  const [banForm, setBanForm] = useState({
    target: '',
    reason: '',
    duration: '0', // 0 means permanent
  });
  const [userError, setUserError] = useState<string | null>(null);

  const { isAdmin } = useAuth();

  useEffect(() => {
    if (isAdmin()) {
      fetchBans();
    }
  }, []);

  const fetchBans = async () => {
    try {
      setLoading(true);
      const [userResponse, ipResponse] = await Promise.all([
        axios.get('/api/bans/users'),
        axios.get('/api/bans/ips')
      ]);
      setUserBans(userResponse.data);
      setIpBans(ipResponse.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch bans');
    } finally {
      setLoading(false);
    }
  };

  const handleBan = async (e: React.FormEvent) => {
    e.preventDefault();

    if (banType === 'user' && !banForm.target) {
      setUserError('Please select a user to ban');
      return;
    }

    try {
      const endpoint = banType === 'user' ? '/api/bans/users' : '/api/bans/ips';
      await axios.post(endpoint, {
        target: banType === 'user' ? parseInt(banForm.target) : banForm.target,
        reason: banForm.reason,
        duration: parseInt(banForm.duration)
      });
      await fetchBans();
      setShowBanForm(false);
      setBanForm({ target: '', reason: '', duration: '0' });
      setError(null);
      setUserError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || `Failed to ban ${banType}`);
    }
  };

  const handleUnban = async (id: number, type: 'user' | 'ip') => {
    if (!window.confirm(`Are you sure you want to unban this ${type}?`)) return;

    try {
      const endpoint = type === 'user' ? `/api/bans/users/${id}` : `/api/bans/ips/${id}`;
      await axios.delete(endpoint);
      await fetchBans();
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || `Failed to unban ${type}`);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-portal-purple"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl lg:text-3xl font-semibold text-gray-800">Ban Management</h1>
        <button
          onClick={() => setShowBanForm(true)}
          className="bg-portal-purple text-white px-4 py-2 rounded-lg hover:bg-portal-purple-light transition-colors flex items-center"
        >
          <FiShield className="mr-2" />
          New Ban
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {showBanForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Add New Ban</h2>
            <form onSubmit={handleBan} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ban Type</label>
                <select
                  value={banType}
                  onChange={(e) => setBanType(e.target.value as 'user' | 'ip')}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-portal-purple focus:ring focus:ring-portal-purple focus:ring-opacity-50"
                >
                  <option value="user">User Ban</option>
                  <option value="ip">IP Ban</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {banType === 'user' ? 'Select User' : 'IP Address'}
                </label>
                {banType === 'user' ? (
                  <UserPicker
                    value={banForm.target}
                    onChange={(value) => {
                      setBanForm({ ...banForm, target: value });
                      setUserError(null);
                    }}
                    required
                    error={userError}
                    excludeBanned={true}
                  />
                ) : (
                  <input
                    type="text"
                    value={banForm.target}
                    onChange={(e) => setBanForm({ ...banForm, target: e.target.value })}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-portal-purple focus:ring focus:ring-portal-purple focus:ring-opacity-50"
                    placeholder="Enter IP address"
                    required
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Reason</label>
                <textarea
                  value={banForm.reason}
                  onChange={(e) => setBanForm({ ...banForm, reason: e.target.value })}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-portal-purple focus:ring focus:ring-portal-purple focus:ring-opacity-50"
                  rows={3}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Duration (hours)</label>
                <input
                  type="number"
                  value={banForm.duration}
                  onChange={(e) => setBanForm({ ...banForm, duration: e.target.value })}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-portal-purple focus:ring focus:ring-portal-purple focus:ring-opacity-50"
                  min="0"
                  placeholder="0 for permanent ban"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowBanForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-portal-purple text-white rounded-md hover:bg-portal-purple-light transition-colors"
                >
                  Ban
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* User Bans */}
      <div className="glass-card rounded-xl p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <FiUserX className="mr-2" />
          User Bans
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Banned By</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {userBans.map((ban) => (
                <tr key={ban.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{ban.user_name}</div>
                    <div className="text-sm text-gray-500">{ban.user_email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-900">{ban.ban_reason}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {ban.banned_by}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(ban.banned_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleUnban(ban.id, 'user')}
                      className="text-red-600 hover:text-red-900"
                    >
                      <FiTrash2 />
                    </button>
                  </td>
                </tr>
              ))}
              {userBans.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                    No user bans found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* IP Bans */}
      <div className="glass-card rounded-xl p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <FiGlobe className="mr-2" />
          IP Bans
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP Address</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Banned By</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expires</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {ipBans.map((ban) => (
                <tr key={ban.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {ban.ip_address}
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-900">{ban.ban_reason}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {ban.banned_by}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {ban.expires_at ? new Date(ban.expires_at).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleUnban(ban.id, 'ip')}
                      className="text-red-600 hover:text-red-900"
                    >
                      <FiTrash2 />
                    </button>
                  </td>
                </tr>
              ))}
              {ipBans.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                    No IP bans found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Bans;
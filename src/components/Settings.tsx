import { useState, useRef, useEffect } from 'react';
import { FiUser, FiGlobe, FiUpload } from 'react-icons/fi';
import Toggle from './Toggle';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { DEFAULT_AVATAR } from '../config/constants';

interface UserSettings {
  language: string;
  allow_messages: boolean;
  show_activity: boolean;
}

function Settings() {
  const { user, refreshUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [settings, setSettings] = useState<UserSettings>({
    language: 'en',
    allow_messages: false,
    show_activity: true
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
    if (user?.avatar_key) {
      fetchAvatarUrl();
    }
  }, [user]);

  const fetchSettings = async () => {
    try {
      const response = await axios.get('/api/users/settings');
      setSettings(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch settings');
    }
  };

  const fetchAvatarUrl = async () => {
    try {
      const response = await axios.get(`/api/users/${user?.id}/avatar`);
      setAvatarUrl(response.data.url);
    } catch (err) {
      console.error('Failed to fetch avatar URL');
      setAvatarUrl(DEFAULT_AVATAR);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File size must be less than 5MB');
      return;
    }

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      setUploadError(null);
      const response = await axios.post('/api/users/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setAvatarUrl(response.data.url);
      await refreshUser();
    } catch (err: any) {
      setUploadError(err.response?.data?.error || 'Failed to upload avatar');
    }
  };

  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    setIsSaving(true);
    try {
      const updatedSettings = { ...settings, ...newSettings };
      const response = await axios.put('/api/users/settings', updatedSettings);
      setSettings(response.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl lg:text-3xl font-semibold text-gray-800 mb-6">Settings</h1>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Profile Section */}
      <section className="glass-card rounded-xl p-6 mb-6">
        <div className="flex items-center mb-6">
          <FiUser className="text-portal-purple text-xl mr-2" />
          <h2 className="text-lg font-semibold text-gray-800">Profile</h2>
        </div>

        {/* Avatar Upload */}
        <div className="mb-6">
          <div className="flex items-center space-x-4">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="User avatar"
                className="w-20 h-20 rounded-full object-cover border-2 border-portal-purple"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-portal-purple/10 flex items-center justify-center text-portal-purple">
                <FiUser size={32} />
              </div>
            )}
            <div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleAvatarUpload}
                accept="image/*"
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center px-4 py-2 bg-portal-purple text-white rounded-lg hover:bg-portal-purple-light transition-colors"
              >
                <FiUpload className="mr-2" />
                Upload Avatar
              </button>
              {uploadError && (
                <p className="text-red-500 text-sm mt-2">{uploadError}</p>
              )}
            </div>
          </div>
        </div>

        {/* User Info */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={user?.name}
              readOnly
              className="block w-full rounded-md border-gray-300 bg-gray-50 cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={user?.email}
              readOnly
              className="block w-full rounded-md border-gray-300 bg-gray-50 cursor-not-allowed"
            />
          </div>
        </div>
      </section>

      {/* Preferences Section */}
      <section className="glass-card rounded-xl p-6">
        <div className="flex items-center mb-6">
          <FiGlobe className="text-portal-purple text-xl mr-2" />
          <h2 className="text-lg font-semibold text-gray-800">Preferences</h2>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
            <select
              value={settings.language}
              onChange={(e) => updateSettings({ language: e.target.value })}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-portal-purple focus:ring focus:ring-portal-purple focus:ring-opacity-50"
              disabled={isSaving}
            >
              <option value="en">English</option>
              <option value="es">Español</option>
              <option value="fr">Français</option>
              <option value="de">Deutsch</option>
            </select>
          </div>

          <Toggle
            label="Allow Messages"
            description="Let other users send you direct messages"
            enabled={settings.allow_messages}
            onChange={(enabled) => updateSettings({ allow_messages: enabled })}
          />

          <Toggle
            label="Show Activity Status"
            description="Display your online status to other users"
            enabled={settings.show_activity}
            onChange={(enabled) => updateSettings({ show_activity: enabled })}
          />
        </div>
      </section>
    </div>
  );
}

export default Settings;
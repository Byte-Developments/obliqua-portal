import { useState, useEffect, useRef } from 'react';
import { FiSearch, FiUser, FiX } from 'react-icons/fi';
import axios from 'axios';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  avatar_key?: string;
}

interface UserPickerProps {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  error?: string;
  excludeBanned?: boolean;
}

const DEFAULT_AVATAR = "https://app.obliqua.design/default-avatar.jpg";

function UserPicker({ value, onChange, required = false, error, excludeBanned = true }: UserPickerProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [avatarUrls, setAvatarUrls] = useState<Record<number, string>>({});
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchUsers();
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    fetchAvatarUrls();
  }, [users]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/users');
      setUsers(response.data.filter((user: User) => 
        excludeBanned ? !user.is_banned : true
      ));
      setLoadError(null);
    } catch (err: any) {
      setLoadError(err.response?.data?.error || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvatarUrls = async () => {
    const urls: Record<number, string> = {};
    for (const user of users) {
      if (user.avatar_key) {
        try {
          const response = await axios.get(`/api/users/${user.id}/avatar`);
          urls[user.id] = response.data.url;
        } catch (err) {
          urls[user.id] = DEFAULT_AVATAR;
        }
      } else {
        urls[user.id] = DEFAULT_AVATAR;
      }
    }
    setAvatarUrls(urls);
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
      setIsOpen(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(search.toLowerCase()) ||
    user.email.toLowerCase().includes(search.toLowerCase())
  );

  const selectedUser = users.find(u => u.id.toString() === value);

  const handleSelect = (userId: string) => {
    onChange(userId);
    setIsOpen(false);
    setSearch('');
  };

  const handleClear = () => {
    onChange('');
    setSearch('');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="relative">
        {selectedUser ? (
          <div className="flex items-center justify-between p-2 border rounded-md bg-white">
            <div className="flex items-center">
              <img
                src={avatarUrls[selectedUser.id] || DEFAULT_AVATAR}
                alt={`${selectedUser.name}'s avatar`}
                className="w-8 h-8 rounded-full object-cover"
              />
              <div className="ml-2">
                <div className="font-medium">{selectedUser.name}</div>
                <div className="text-sm text-gray-500">
                  {selectedUser.email} • {selectedUser.role}
                </div>
              </div>
            </div>
            <button
              onClick={handleClear}
              className="p-1 hover:bg-gray-100 rounded-full"
              type="button"
            >
              <FiX className="text-gray-500" />
            </button>
          </div>
        ) : (
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              placeholder="Search users..."
              className={`w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-portal-purple focus:border-transparent ${
                error ? 'border-red-300' : 'border-gray-300'
              }`}
              required={required}
            />
          </div>
        )}
      </div>

      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}

      {isOpen && !selectedUser && (
        <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
          {loading ? (
            <div className="p-4 text-center text-gray-500">Loading...</div>
          ) : loadError ? (
            <div className="p-4 text-center text-red-500">{loadError}</div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-4 text-center text-gray-500">No users found</div>
          ) : (
            filteredUsers.map(user => (
              <button
                key={user.id}
                type="button"
                onClick={() => handleSelect(user.id.toString())}
                className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center space-x-3"
              >
                <img
                  src={avatarUrls[user.id] || DEFAULT_AVATAR}
                  alt={`${user.name}'s avatar`}
                  className="w-8 h-8 rounded-full object-cover"
                />
                <div>
                  <div className="font-medium">{user.name}</div>
                  <div className="text-sm text-gray-500">
                    {user.email} • {user.role}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default UserPicker;
import { useState, useEffect, useRef } from 'react';
import { FiSearch, FiUser, FiX } from 'react-icons/fi';
import axios from 'axios';

interface Client {
  id: number;
  name: string;
  email: string;
  avatar_key?: string;
}

interface ClientPickerProps {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  error?: string;
}

const DEFAULT_AVATAR = "https://app.obliqua.design/default-avatar.jpg";

function ClientPicker({ value, onChange, required = false, error }: ClientPickerProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [avatarUrls, setAvatarUrls] = useState<Record<number, string>>({});
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchClients();
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    fetchAvatarUrls();
  }, [clients]);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/clients');
      setClients(response.data);
      setLoadError(null);
    } catch (err: any) {
      setLoadError(err.response?.data?.error || 'Failed to fetch clients');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvatarUrls = async () => {
    const urls: Record<number, string> = {};
    for (const client of clients) {
      if (client.avatar_key) {
        try {
          const response = await axios.get(`/api/users/${client.id}/avatar`);
          urls[client.id] = response.data.url;
        } catch (err) {
          urls[client.id] = DEFAULT_AVATAR;
        }
      } else {
        urls[client.id] = DEFAULT_AVATAR;
      }
    }
    setAvatarUrls(urls);
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
      setIsOpen(false);
    }
  };

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(search.toLowerCase()) ||
    client.email.toLowerCase().includes(search.toLowerCase())
  );

  const selectedClient = clients.find(c => c.id.toString() === value);

  const handleSelect = (clientId: string) => {
    onChange(clientId);
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
        {selectedClient ? (
          <div className="flex items-center justify-between p-2 border rounded-md bg-white">
            <div className="flex items-center">
              <img
                src={avatarUrls[selectedClient.id] || DEFAULT_AVATAR}
                alt={`${selectedClient.name}'s avatar`}
                className="w-8 h-8 rounded-full object-cover"
              />
              <div className="ml-2">
                <div className="font-medium">{selectedClient.name}</div>
                <div className="text-sm text-gray-500">{selectedClient.email}</div>
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
              placeholder="Search clients..."
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

      {isOpen && !selectedClient && (
        <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
          {loading ? (
            <div className="p-4 text-center text-gray-500">Loading...</div>
          ) : loadError ? (
            <div className="p-4 text-center text-red-500">{loadError}</div>
          ) : filteredClients.length === 0 ? (
            <div className="p-4 text-center text-gray-500">No clients found</div>
          ) : (
            filteredClients.map(client => (
              <button
                key={client.id}
                type="button"
                onClick={() => handleSelect(client.id.toString())}
                className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center space-x-3"
              >
                <img
                  src={avatarUrls[client.id] || DEFAULT_AVATAR}
                  alt={`${client.name}'s avatar`}
                  className="w-8 h-8 rounded-full object-cover"
                />
                <div>
                  <div className="font-medium">{client.name}</div>
                  <div className="text-sm text-gray-500">{client.email}</div>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default ClientPicker;
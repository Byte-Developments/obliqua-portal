import { useState, useEffect } from 'react';
import axios, { AxiosError } from 'axios';
import UserForm from '../components/UserForm';
import UserList from '../components/UserList';
import { User } from '../types';
import ConfirmDialog from '../components/ConfirmDialog';
import { useToast } from '../contexts/ToastContext';

function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get('https://199.85.208.153:3000/api/users');
      setUsers(response.data);
      setError(null);
    } catch (err) {
      const error = err as AxiosError;
      const errorMessage = error.response?.data?.error || 'Failed to fetch users';
      setError(errorMessage);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (id: number | undefined, userData: any) => {
    try {
      if (id) {
        await axios.put(`https://199.85.208.153:3000/api/users/${id}`, userData);
        showToast('success', 'User updated successfully');
      } else {
        await axios.post('https://199.85.208.153:3000/api/users', userData);
        showToast('success', 'User added successfully');
      }
      await fetchUsers();
      setIsFormOpen(false);
      setEditingUser(null);
      setError(null);
    } catch (err) {
      const error = err as AxiosError;
      const errorMessage = error.response?.data?.error || `Failed to ${id ? 'update' : 'add'} user`;
      showToast('error', errorMessage);
      throw error;
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    
    try {
      setLoading(true);
      await axios.delete(`https://199.85.208.153:3000/api/users/${userToDelete.id}`);
      await fetchUsers();
      showToast('success', 'User deleted successfully');
      setError(null);
    } catch (err) {
      const error = err as AxiosError;
      const errorMessage = error.response?.data?.error || 'Failed to delete user';
      showToast('error', errorMessage);
    } finally {
      setLoading(false);
      setUserToDelete(null);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl lg:text-3xl font-semibold text-gray-800 mb-6 lg:mb-8">Users</h1>
        <button
          onClick={() => setIsFormOpen(true)}
          className="bg-portal-purple text-white px-4 py-2 rounded-lg hover:bg-portal-purple-light transition-colors"
        >
          Add User
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-portal-purple"></div>
        </div>
      ) : (
        <UserList
          users={users}
          onEdit={setEditingUser}
          onDelete={setUserToDelete}
        />
      )}

      {(isFormOpen || editingUser) && (
        <UserForm
          user={editingUser}
          onSubmit={handleSubmit}
          onClose={() => {
            setIsFormOpen(false);
            setEditingUser(null);
          }}
        />
      )}

      <ConfirmDialog
        isOpen={!!userToDelete}
        onClose={() => setUserToDelete(null)}
        onConfirm={handleDeleteUser}
        title="Delete User"
        message={`Are you sure you want to delete ${userToDelete?.name}? This action cannot be undone.`}
        confirmText="Delete"
        type="danger"
      />
    </div>
  );
}

export default Users;
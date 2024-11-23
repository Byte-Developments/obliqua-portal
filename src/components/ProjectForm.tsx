import { useState, useEffect } from 'react';
import ClientPicker from './ClientPicker';

interface Project {
  id: number;
  name: string;
  description: string;
  status: string;
  client_id: number;
}

interface ProjectFormProps {
  project?: Project | null;
  onSubmit: (data: any) => Promise<void>;
  onClose: () => void;
}

function ProjectForm({ project, onSubmit, onClose }: ProjectFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'active',
    client_id: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [clientError, setClientError] = useState<string | null>(null);

  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name,
        description: project.description,
        status: project.status,
        client_id: project.client_id.toString()
      });
    }
  }, [project]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.client_id) {
      setClientError('Please select a client');
      return;
    }

    try {
      await onSubmit({
        ...formData,
        client_id: parseInt(formData.client_id)
      });
      onClose();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">
          {project ? 'Edit Project' : 'New Project'}
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-portal-purple focus:ring focus:ring-portal-purple focus:ring-opacity-50"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-portal-purple focus:ring focus:ring-portal-purple focus:ring-opacity-50"
              rows={3}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-portal-purple focus:ring focus:ring-portal-purple focus:ring-opacity-50"
            >
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="on hold">On Hold</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
            <ClientPicker
              value={formData.client_id}
              onChange={(value) => {
                setFormData({ ...formData, client_id: value });
                setClientError(null);
              }}
              required
              error={clientError}
            />
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-portal-purple text-white rounded-md hover:bg-portal-purple-light transition-colors"
            >
              {project ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProjectForm;
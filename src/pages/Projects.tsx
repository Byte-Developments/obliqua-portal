import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import ProjectForm from '../components/ProjectForm';
import { FiEdit2, FiTrash2, FiPlus } from 'react-icons/fi';

interface Project {
  id: number;
  name: string;
  description: string;
  status: string;
  client_id: number;
  client_name: string;
  created_at: string;
  updated_at: string;
}

function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await axios.get('https://199.85.208.153:3000/api/projects');
      setProjects(response.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this project?')) return;
    
    try {
      await axios.delete(`https://199.85.208.153:3000/api/projects/${id}`);
      await fetchProjects();
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete project');
    }
  };

  const handleSubmit = async (projectData: any) => {
    try {
      if (editingProject) {
        await axios.put(`https://199.85.208.153:3000/api/projects/${editingProject.id}`, projectData);
      } else {
        await axios.post('https://199.85.208.153:3000/api/projects', projectData);
      }
      await fetchProjects();
      setIsFormOpen(false);
      setEditingProject(null);
      setError(null);
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || `Failed to ${editingProject ? 'update' : 'create'} project`;
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'on hold': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
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
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl lg:text-3xl font-semibold text-gray-800 mb-6 lg:mb-8">Projects</h1>
        <button
          onClick={() => setIsFormOpen(true)}
          className="bg-portal-purple text-white px-4 py-2 rounded-lg hover:bg-portal-purple-light transition-colors flex items-center"
        >
          <FiPlus className="mr-2" />
          New Project
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((project) => (
          <div key={project.id} className="glass-card p-4 rounded-xl">
            <div className="flex justify-between items-start mb-3">
              <Link 
                to={`/projects/${project.id}`}
                className="text-lg font-semibold text-gray-800 hover:text-portal-purple transition-colors"
              >
                {project.name}
              </Link>
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    setEditingProject(project);
                    setIsFormOpen(true);
                  }}
                  className="text-portal-purple hover:text-portal-purple-light"
                >
                  <FiEdit2 />
                </button>
                <button
                  onClick={() => handleDelete(project.id)}
                  className="text-red-600 hover:text-red-900"
                >
                  <FiTrash2 />
                </button>
              </div>
            </div>
            <p className="text-gray-600 text-sm mb-3 line-clamp-2">{project.description}</p>
            <div className="flex justify-between items-center">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                {project.status}
              </span>
              <span className="text-sm text-gray-500">{project.client_name}</span>
            </div>
          </div>
        ))}
      </div>

      {(isFormOpen || editingProject) && (
        <ProjectForm
          project={editingProject}
          onSubmit={handleSubmit}
          onClose={() => {
            setIsFormOpen(false);
            setEditingProject(null);
          }}
        />
      )}
    </div>
  );
}

export default Projects;
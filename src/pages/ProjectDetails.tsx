import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiEdit2, FiTrash2, FiMessageSquare, FiFile } from 'react-icons/fi';
import axios from 'axios';
import ProjectForm from '../components/ProjectForm';
import FileUpload from '../components/FileUpload';
import ProjectChat from '../components/ProjectChat';
import ProjectChatWidget from '../components/ProjectChatWidget';
import ConfirmDialog from '../components/ConfirmDialog';
import { useToast } from '../contexts/ToastContext';

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

function ProjectDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [isChatMaximized, setIsChatMaximized] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    fetchProject();
  }, [id]);

  const fetchProject = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/projects/${id}`);
      setProject(response.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch project');
      showToast('error', 'Failed to load project');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (data: any) => {
    try {
      const response = await axios.put(`/api/projects/${id}`, data);
      setProject(response.data);
      setIsEditing(false);
      showToast('success', 'Project updated successfully');
    } catch (err: any) {
      showToast('error', err.response?.data?.error || 'Failed to update project');
      throw err;
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`/api/projects/${id}`);
      showToast('success', 'Project deleted successfully');
      navigate('/projects');
    } catch (err: any) {
      showToast('error', err.response?.data?.error || 'Failed to delete project');
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

  if (error || !project) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600">{error || 'Project not found'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl lg:text-3xl font-semibold text-gray-800 mb-2">{project.name}</h1>
          <div className="flex items-center space-x-4">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(project.status)}`}>
              {project.status}
            </span>
            <span className="text-sm text-gray-500">Client: {project.client_name}</span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowChat(true)}
            className="p-2 text-portal-purple hover:bg-portal-purple/10 rounded-lg transition-colors"
            title="Project Chat"
          >
            <FiMessageSquare size={20} />
          </button>
          <button
            onClick={() => setIsEditing(true)}
            className="p-2 text-portal-purple hover:bg-portal-purple/10 rounded-lg transition-colors"
            title="Edit Project"
          >
            <FiEdit2 size={20} />
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete Project"
          >
            <FiTrash2 size={20} />
          </button>
        </div>
      </div>

      {/* Description */}
      <div className="glass-card rounded-xl p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Description</h2>
        <p className="text-gray-600 whitespace-pre-wrap">{project.description}</p>
      </div>

      {/* Files */}
      <div className="glass-card rounded-xl p-6">
        <div className="flex items-center mb-6">
          <FiFile className="text-portal-purple text-xl mr-2" />
          <h2 className="text-lg font-semibold text-gray-800">Files</h2>
        </div>
        <FileUpload
          projectId={project.id}
          onUploadComplete={fetchProject}
        />
      </div>

      {/* Chat Widget */}
      {showChat && !isChatMaximized && (
        <ProjectChatWidget
          projectId={project.id}
          onMaximize={() => setIsChatMaximized(true)}
        />
      )}

      {/* Maximized Chat */}
      {showChat && isChatMaximized && (
        <ProjectChat
          projectId={project.id}
          onClose={() => {
            setIsChatMaximized(false);
            setShowChat(false);
          }}
        />
      )}

      {/* Edit Form */}
      {isEditing && (
        <ProjectForm
          project={project}
          onSubmit={handleUpdate}
          onClose={() => setIsEditing(false)}
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Project"
        message="Are you sure you want to delete this project? This action cannot be undone."
        confirmText="Delete"
        type="danger"
      />
    </div>
  );
}

export default ProjectDetails;
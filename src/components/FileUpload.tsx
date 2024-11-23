import { useState, useEffect } from 'react';
import { FiUpload, FiFile, FiTrash2, FiDownload, FiChevronLeft, FiChevronRight, FiImage, FiVideo, FiMusic, FiBarChart2, FiFileText } from 'react-icons/fi';
import axios from 'axios';

interface FileUploadProps {
  projectId: number;
  onUploadComplete: () => void;
}

interface ProjectFile {
  id: number;
  name: string;
  size: number;
  mime_type: string;
  url: string;
  uploaded_at: string;
  uploader_name: string;
}

interface PaginationData {
  total: number;
  page: number;
  totalPages: number;
}

function FileUpload({ projectId, onUploadComplete }: FileUploadProps) {
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({
    total: 0,
    page: 1,
    totalPages: 1
  });
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFiles = async (page = 1) => {
    try {
      const response = await axios.get(`/api/projects/${projectId}/files`, {
        params: { page, limit: 10 }
      });
      setFiles(response.data.files);
      setPagination(response.data.pagination);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch files');
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [projectId]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploading(true);
      setError(null);
      await axios.post(`/api/projects/${projectId}/files`, formData);
      await fetchFiles(1); // Reset to first page after upload
      onUploadComplete();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (fileId: number) => {
    if (!window.confirm('Are you sure you want to delete this file?')) return;

    try {
      await axios.delete(`/api/projects/${projectId}/files/${fileId}`);
      await fetchFiles(
        files.length === 1 && pagination.page > 1 
          ? pagination.page - 1 
          : pagination.page
      );
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete file');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getMimeTypeIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <FiImage className="mr-2 text-portal-purple-light" />;
    if (mimeType.startsWith('video/')) return <FiVideo className="mr-2 text-portal-purple-light" />;
    if (mimeType.startsWith('audio/')) return <FiMusic className="mr-2 text-portal-purple-light" />;
    if (mimeType.includes('pdf')) return <FiFile className="mr-2 text-portal-purple-light" />;
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return <FiBarChart2 className="mr-2 text-portal-purple-light" />;
    if (mimeType.includes('document') || mimeType.includes('word')) return <FiFileText className="mr-2 text-portal-purple-light" />;
    return '📁';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-800">Project Files</h3>
        <div>
          <input
            type="file"
            id="file-upload"
            className="hidden"
            onChange={handleFileUpload}
          />
          <label
            htmlFor="file-upload"
            className="flex items-center px-4 py-2 bg-portal-purple text-white rounded-lg hover:bg-portal-purple-light transition-colors cursor-pointer"
          >
            <FiUpload className="mr-2" />
            Upload File
          </label>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {uploading && (
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-portal-purple"></div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">File</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Uploaded By</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {files.map((file) => (
              <tr key={file.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {getMimeTypeIcon(file.mime_type)}
                    <span className="text-sm text-gray-900">{file.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatFileSize(file.size)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {file.uploader_name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(file.uploaded_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end space-x-3">
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-portal-purple hover:text-portal-purple-light"
                      title="Download"
                    >
                      <FiDownload />
                    </a>
                    <button
                      onClick={() => handleDelete(file.id)}
                      className="text-red-600 hover:text-red-900"
                      title="Delete"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {files.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">
                  No files uploaded yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
          <div className="flex flex-1 justify-between sm:hidden">
            <button
              onClick={() => fetchFiles(pagination.page - 1)}
              disabled={pagination.page === 1}
              className={`relative inline-flex items-center rounded-md px-4 py-2 text-sm font-medium ${
                pagination.page === 1
                  ? 'bg-gray-100 text-gray-400'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Previous
            </button>
            <button
              onClick={() => fetchFiles(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
              className={`relative ml-3 inline-flex items-center rounded-md px-4 py-2 text-sm font-medium ${
                pagination.page === pagination.totalPages
                  ? 'bg-gray-100 text-gray-400'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing{' '}
                <span className="font-medium">
                  {((pagination.page - 1) * 10) + 1}
                </span>{' '}
                to{' '}
                <span className="font-medium">
                  {Math.min(pagination.page * 10, pagination.total)}
                </span>{' '}
                of{' '}
                <span className="font-medium">{pagination.total}</span>{' '}
                results
              </p>
            </div>
            <div>
              <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                <button
                  onClick={() => fetchFiles(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className={`relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${
                    pagination.page === 1 ? 'cursor-not-allowed' : ''
                  }`}
                >
                  <span className="sr-only">Previous</span>
                  <FiChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={() => fetchFiles(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                  className={`relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${
                    pagination.page === pagination.totalPages ? 'cursor-not-allowed' : ''
                  }`}
                >
                  <span className="sr-only">Next</span>
                  <FiChevronRight className="h-5 w-5" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FileUpload;
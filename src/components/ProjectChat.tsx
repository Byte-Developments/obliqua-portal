import { useState, useEffect, useRef } from 'react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import { FiSend, FiTrash2, FiX, FiArrowLeft } from 'react-icons/fi';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { motion, AnimatePresence } from 'framer-motion';
import ConfirmDialog from './ConfirmDialog';

// Initialize dayjs plugins
dayjs.extend(relativeTime);
dayjs.extend(timezone);
dayjs.extend(utc);

interface Message {
  id: number;
  content: string;
  user_id: number;
  name: string;
  role: string;
  avatar_key: string;
  created_at: string;
}

interface ProjectChatProps {
  projectId: number;
  onClose: () => void;
}

function ProjectChat({ projectId, onClose }: ProjectChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredMessageId, setHoveredMessageId] = useState<number | null>(null);
  const [messageToDelete, setMessageToDelete] = useState<Message | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { showToast } = useToast();

  const fetchMessages = async () => {
    try {
      const response = await axios.get(`/api/projects/${projectId}/messages`);
      setMessages(response.data.reverse());
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch messages');
      showToast('error', 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 10000);
    return () => clearInterval(interval);
  }, [projectId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const response = await axios.post(`/api/projects/${projectId}/messages`, {
        content: newMessage
      });
      setMessages([...messages, response.data]);
      setNewMessage('');
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send message');
      showToast('error', 'Failed to send message');
    }
  };

  const handleDelete = async () => {
    if (!messageToDelete) return;

    try {
      await axios.delete(`/api/projects/${projectId}/messages/${messageToDelete.id}`);
      setMessages(messages.filter(m => m.id !== messageToDelete.id));
      showToast('success', 'Message deleted');
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete message');
      showToast('error', 'Failed to delete message');
    } finally {
      setMessageToDelete(null);
    }
  };

  const formatMessageTime = (date: string) => {
    const messageDate = dayjs(date).tz(dayjs.tz.guess());
    return messageDate.format('MMM D, YYYY h:mm A');
  };

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      case 'client':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-portal-purple"></div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 p-4 flex items-center justify-between bg-white">
        <button
          onClick={onClose}
          className="text-portal-purple hover:text-portal-purple-light flex items-center"
        >
          <FiArrowLeft className="mr-2" />
          Back to Project
        </button>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <FiX size={20} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence initial={false}>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className={`flex ${message.user_id === user?.id ? 'justify-end' : 'justify-start'}`}
              onMouseEnter={() => setHoveredMessageId(message.id)}
              onMouseLeave={() => setHoveredMessageId(null)}
            >
              <div 
                className={`max-w-2xl relative group ${
                  message.user_id === user?.id 
                    ? 'bg-portal-purple/10 border border-portal-purple/20' 
                    : 'bg-white border border-gray-200'
                } rounded-lg p-3 shadow-sm transition-all duration-200 hover:shadow-md`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getRoleBadgeStyle(message.role)}`}>
                    {message.role}
                  </span>
                  <span className="text-sm font-medium text-gray-900">
                    {message.name}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatMessageTime(message.created_at)}
                  </span>
                </div>
                <p className={`text-sm whitespace-pre-wrap ${
                  message.user_id === user?.id ? 'text-gray-900' : 'text-gray-800'
                }`}>
                  {message.content}
                </p>

                {message.user_id === user?.id && hoveredMessageId === message.id && (
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setMessageToDelete(message)}
                    className="absolute -right-2 -top-2 p-1 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-colors"
                  >
                    <FiTrash2 size={14} />
                  </motion.button>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Error message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="mx-4 mb-4 p-2 bg-red-50 border border-red-200 rounded-lg"
        >
          <p className="text-red-600 text-sm">{error}</p>
        </motion.div>
      )}

      {/* Input form */}
      <form onSubmit={handleSend} className="p-4 border-t border-gray-200 bg-white">
        <div className="max-w-4xl mx-auto flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 rounded-lg border-gray-300 focus:border-portal-purple focus:ring focus:ring-portal-purple focus:ring-opacity-50"
          />
          <motion.button
            type="submit"
            disabled={!newMessage.trim()}
            whileTap={{ scale: 0.95 }}
            className="bg-portal-purple text-white px-4 py-2 rounded-lg hover:bg-portal-purple-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiSend />
          </motion.button>
        </div>
      </form>

      <ConfirmDialog
        isOpen={!!messageToDelete}
        onClose={() => setMessageToDelete(null)}
        onConfirm={handleDelete}
        title="Delete Message"
        message="Are you sure you want to delete this message?"
        confirmText="Delete"
        type="danger"
      />
    </div>
  );
}

export default ProjectChat;
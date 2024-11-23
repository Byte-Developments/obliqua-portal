import { useState, useEffect, useRef } from 'react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import { FiSend, FiMaximize2, FiX } from 'react-icons/fi';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { motion, AnimatePresence } from 'framer-motion';

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

interface ProjectChatWidgetProps {
  projectId: number;
  onMaximize: () => void;
}

function ProjectChatWidget({ projectId, onMaximize }: ProjectChatWidgetProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(true);
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
    if (isOpen) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 10000);
      return () => clearInterval(interval);
    }
  }, [projectId, isOpen]);

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

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-portal-purple text-white p-4 rounded-full shadow-lg hover:bg-portal-purple-light transition-colors"
      >
        Chat
      </button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed bottom-4 right-4 w-96 bg-white rounded-lg shadow-xl flex flex-col border border-gray-200 overflow-hidden"
      style={{ height: '500px' }}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-white">
        <h3 className="font-semibold text-gray-800">Project Chat</h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={onMaximize}
            className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
          >
            <FiMaximize2 size={16} />
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
          >
            <FiX size={16} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-portal-purple"></div>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className={`flex ${message.user_id === user?.id ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[80%] ${
                    message.user_id === user?.id 
                      ? 'bg-portal-purple/10 border border-portal-purple/20' 
                      : 'bg-white border border-gray-200'
                  } rounded-lg p-2 shadow-sm`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getRoleBadgeStyle(message.role)}`}>
                      {message.role}
                    </span>
                    <span className="text-xs font-medium text-gray-900">
                      {message.name}
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap text-gray-800">
                    {message.content}
                  </p>
                  <span className="text-xs text-gray-500 mt-1 block">
                    {formatMessageTime(message.created_at)}
                  </span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Error message */}
      {error && (
        <div className="px-4 py-2 bg-red-50 border-t border-red-200">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* Input form */}
      <form onSubmit={handleSend} className="p-4 border-t border-gray-200 bg-white">
        <div className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 rounded-lg border-gray-300 focus:border-portal-purple focus:ring focus:ring-portal-purple focus:ring-opacity-50 text-sm"
          />
          <motion.button
            type="submit"
            disabled={!newMessage.trim()}
            whileTap={{ scale: 0.95 }}
            className="bg-portal-purple text-white p-2 rounded-lg hover:bg-portal-purple-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiSend size={16} />
          </motion.button>
        </div>
      </form>
    </motion.div>
  );
}

export default ProjectChatWidget;
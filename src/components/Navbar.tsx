import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FiHome, FiUsers, FiSettings, FiPieChart, FiFolder, FiLogOut, FiMenu, FiX, FiUser, FiShield } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { DEFAULT_AVATAR } from '../config/constants';

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAdmin } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const navItems = [
    { path: '/', icon: <FiHome />, label: 'Dashboard' },
    { path: '/projects', icon: <FiFolder />, label: 'Projects' },
    ...(isAdmin() ? [
      { path: '/users', icon: <FiUsers />, label: 'Users' },
      { path: '/analytics', icon: <FiPieChart />, label: 'Analytics' },
      { path: '/bans', icon: <FiShield />, label: 'Bans' },
    ] : []),
    { path: '/settings', icon: <FiSettings />, label: 'Settings' },
  ];

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <nav className={`glass-nav fixed left-0 top-0 h-screen flex flex-col transition-all duration-300 z-50
        ${isOpen ? 'w-64' : 'w-20'} lg:w-64`}>
        <div className="p-4 lg:p-6 flex items-center">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-portal-purple hover:bg-portal-purple/10 p-2 rounded-lg transition-colors lg:hidden"
            aria-label="Toggle menu"
          >
            {isOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
          <h1 className={`text-xl font-bold text-portal-purple ml-2 ${isOpen ? 'block' : 'hidden'} lg:block`}>
            Portal
          </h1>
        </div>

        <div className="flex-1 px-2 lg:px-4 py-4">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsOpen(false)}
              className={`w-full flex items-center p-3 mb-2 rounded-xl transition-all group
                ${location.pathname === item.path
                  ? 'bg-portal-purple text-white'
                  : 'text-gray-600 hover:bg-portal-purple/10 hover:text-portal-purple'
                }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className={`ml-3 text-sm font-medium ${isOpen ? 'block' : 'hidden'} lg:block`}>
                {item.label}
              </span>
              {!isOpen && !window.matchMedia('(min-width: 1024px)').matches && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-sm rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap">
                  {item.label}
                </div>
              )}
            </Link>
          ))}
        </div>

        <div className="p-4 mt-auto">
          <div className="flex items-center justify-center mb-4">
            {user?.avatar_url ? (
              <img
                src={user.avatar_url || DEFAULT_AVATAR}
                alt="User avatar"
                className="w-12 h-12 rounded-full border-2 border-portal-purple object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-portal-purple/10 flex items-center justify-center text-portal-purple">
                <FiUser size={24} />
              </div>
            )}
          </div>
          <div className="border-t border-gray-100 pt-4">
            <button 
              onClick={handleLogout}
              className="w-full flex items-center p-3 text-gray-600 hover:bg-red-50 hover:text-red-500 rounded-xl transition-colors group"
            >
              <span className="text-xl"><FiLogOut /></span>
              <span className={`ml-3 text-sm font-medium ${isOpen ? 'block' : 'hidden'} lg:block`}>
                Logout
              </span>
              {!isOpen && !window.matchMedia('(min-width: 1024px)').matches && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-sm rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap">
                  Logout
                </div>
              )}
            </button>
          </div>
        </div>
      </nav>
    </>
  );
}

export default Navbar;
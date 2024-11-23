import { FiHome, FiUsers, FiSettings, FiPieChart, FiFolder } from 'react-icons/fi';
import Card from '../components/Card';

function Dashboard() {
  const cards = [
    { title: 'Total Users', value: '1,234', icon: <FiUsers />, trend: '+12%' },
    { title: 'Revenue', value: '$45,678', icon: <FiPieChart />, trend: '+8%' },
    { title: 'Projects', value: '48', icon: <FiFolder />, trend: '+5%' },
    { title: 'Active Tasks', value: '156', icon: <FiSettings />, trend: '+15%' },
  ];

  return (
    <div>
      <h1 className="text-2xl lg:text-3xl font-semibold text-gray-800 mb-6 lg:mb-8">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {cards.map((card, index) => (
          <Card key={index} {...card} />
        ))}
      </div>
      
      <div className="mt-6 lg:mt-8 glass-card rounded-xl p-4 lg:p-6">
        <h2 className="text-lg lg:text-xl font-semibold text-gray-800 mb-4">Recent Activity</h2>
        <div className="space-y-3 lg:space-y-4">
          {[1, 2, 3].map((item) => (
            <div key={item} className="flex items-center p-3 lg:p-4 rounded-lg hover:bg-white transition-colors">
              <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-portal-purple/10 flex items-center justify-center text-portal-purple">
                <FiUsers className="text-sm lg:text-base" />
              </div>
              <div className="ml-3 lg:ml-4">
                <h3 className="text-xs lg:text-sm font-medium text-gray-800">New client onboarded</h3>
                <p className="text-xs lg:text-sm text-gray-500">2 hours ago</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
// src/components/Navbar.js
import { Link, useLocation } from 'react-router-dom';
import { Users, Clock } from 'lucide-react';

const Navbar = () => {
  const location = useLocation();

  return (
    <nav className="bg-white shadow-md">
      <div className="px-4 mx-auto max-w-7xl">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <span className="text-xl font-bold text-gray-800">IPDS Sanggau</span>
          </div>
          
          <div className="flex space-x-4">
            <Link
              to="/strategis"
              className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                location.pathname === '/strategis'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-700 hover:bg-blue-50'
              }`}
            >
              <Users className="w-4 h-4 mr-2" />
              Populasi
            </Link>
            
            <Link
              to="/"
              className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                location.pathname === '/'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-700 hover:bg-blue-50'
              }`}
            >
              <Clock className="w-4 h-4 mr-2" />
              Kehadiran
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
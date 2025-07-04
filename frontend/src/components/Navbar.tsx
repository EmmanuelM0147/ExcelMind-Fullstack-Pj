import React from 'react';
import { Link } from 'react-router-dom';
import { Home, LogIn, LayoutDashboard } from 'lucide-react';

export function Navbar() {
  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/" className="text-xl font-bold text-gray-900">
              Modern App
            </Link>
          </div>
          <div className="flex space-x-8">
            <Link
              to="/"
              className="flex items-center space-x-1 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <Home size={20} />
              <span>Home</span>
            </Link>
            <Link
              to="/login"
              className="flex items-center space-x-1 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <LogIn size={20} />
              <span>Login</span>
            </Link>
            <Link
              to="/dashboard"
              className="flex items-center space-x-1 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <LayoutDashboard size={20} />
              <span>Dashboard</span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
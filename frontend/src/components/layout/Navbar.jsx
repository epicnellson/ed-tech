import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getInitials } from '../../lib/utils';
import { Menu, X, ChevronDown, Radio } from 'lucide-react';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-50">
      <div className="flex items-center justify-between h-full px-4 md:px-6">
        <div className="flex items-center gap-4 md:gap-8">
          <Link to="/dashboard" className="text-xl font-bold text-primary-600">
            Ed-Tech
          </Link>

          {isAuthenticated && (
            <div className="hidden md:flex items-center gap-6">
              <Link to="/courses" className="text-gray-600 hover:text-gray-900 transition-colors">
                Browse
              </Link>
              <Link to="/courses/my" className="text-gray-600 hover:text-gray-900 transition-colors">
                My Courses
              </Link>
              {(user?.role === 'teacher' || user?.role === 'admin') && (
                <>
                  <Link to="/teacher/courses" className="text-gray-600 hover:text-gray-900 transition-colors">
                    Teaching
                  </Link>
                  <Link to="/teacher/live" className="text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-1">
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                    Live
                  </Link>
                </>
              )}
              {user?.role === 'admin' && (
                <Link to="/admin" className="text-gray-600 hover:text-gray-900 transition-colors">
                  Admin
                </Link>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          {isAuthenticated ? (
            <>
              <Link 
                to="/courses/public" 
                className="hidden lg:block text-sm text-gray-600 hover:text-gray-900"
              >
                Catalog
              </Link>

              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 p-1 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                    <span className="text-sm font-medium text-primary-700">
                      {getInitials(user?.name)}
                    </span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-500 hidden md:block" />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1">
                    <div className="px-4 py-2 border-b border-gray-100 md:hidden">
                      <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                      <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                    </div>
                    <Link
                      to="/dashboard"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      Dashboard
                    </Link>
                    <Link
                      to="/courses/my"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      My Courses
                    </Link>
                    {(user?.role === 'teacher' || user?.role === 'admin') && (
                      <>
                        <Link
                          to="/teacher/courses"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          My Teaching
                        </Link>
                        <Link
                          to="/teacher/live"
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <Radio className="w-3 h-3 text-red-500" />
                          Quick Live
                        </Link>
                      </>
                    )}
                    {user?.role === 'admin' && (
                      <Link
                        to="/admin"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        Admin Panel
                      </Link>
                    )}
                    <hr className="my-1" />
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 hover:bg-gray-100 rounded-lg"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2 md:gap-4">
              <Link to="/login" className="text-sm text-gray-600 hover:text-gray-900">
                Login
              </Link>
              <Link to="/register" className="btn-primary text-sm">
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>

      {mobileMenuOpen && isAuthenticated && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <div className="px-4 py-3 space-y-2">
            <Link
              to="/courses"
              className="block py-2 text-gray-700 hover:text-primary-600"
              onClick={() => setMobileMenuOpen(false)}
            >
              Browse Courses
            </Link>
            <Link
              to="/courses/my"
              className="block py-2 text-gray-700 hover:text-primary-600"
              onClick={() => setMobileMenuOpen(false)}
            >
              My Courses
            </Link>
            {(user?.role === 'teacher' || user?.role === 'admin') && (
              <>
                <Link
                  to="/teacher/courses"
                  className="block py-2 text-gray-700 hover:text-primary-600"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  My Teaching
                </Link>
                <Link
                  to="/teacher/live"
                  className="flex items-center gap-2 py-2 text-red-600 font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Radio className="w-4 h-4" />
                  Quick Live
                </Link>
              </>
            )}
            {user?.role === 'admin' && (
              <Link
                to="/admin"
                className="block py-2 text-gray-700 hover:text-primary-600"
                onClick={() => setMobileMenuOpen(false)}
              >
                Admin
              </Link>
            )}
            <hr className="my-2" />
            <Link
              to="/courses/public"
              className="block py-2 text-gray-700 hover:text-primary-600"
              onClick={() => setMobileMenuOpen(false)}
            >
              Public Catalog
            </Link>
            <button
              onClick={() => {
                handleLogout();
                setMobileMenuOpen(false);
              }}
              className="block w-full text-left py-2 text-red-600"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}

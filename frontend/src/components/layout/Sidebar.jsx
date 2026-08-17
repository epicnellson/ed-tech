import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';

const navigation = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    roles: ['student', 'teacher', 'admin'],
  },
  {
    name: 'Browse Courses',
    href: '/courses',
    roles: ['student', 'teacher', 'admin'],
  },
  {
    name: 'My Courses',
    href: '/courses/my',
    roles: ['student', 'teacher', 'admin'],
  },
  {
    name: 'My Teaching',
    href: '/teacher/courses',
    roles: ['teacher', 'admin'],
  },
  {
    name: 'Host Live Class',
    href: '/teacher/live',
    roles: ['teacher', 'admin'],
  },
  {
    name: 'Admin Panel',
    href: '/admin',
    roles: ['admin'],
  },
  {
    name: 'Manage Users',
    href: '/admin/users',
    roles: ['admin'],
  },
  {
    name: 'Manage Courses',
    href: '/admin/courses',
    roles: ['admin'],
  },
];

export default function Sidebar() {
  const location = useLocation();
  const { user } = useAuth();

  const filteredNavigation = navigation.filter(
    (item) => item.roles.includes(user?.role)
  );

  return (
    <aside className="hidden lg:block w-64 fixed left-0 top-16 bottom-0 bg-white border-r border-gray-200 p-4">
      <nav className="space-y-1">
        {filteredNavigation.map((item) => {
          const isActive = location.pathname === item.href || 
            (item.href !== '/dashboard' && location.pathname.startsWith(item.href));
          
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                'flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-colors',
                isActive
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-700 hover:bg-gray-100'
              )}
            >
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="absolute bottom-4 left-4 right-4">
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500 mb-2">Logged in as</p>
          <p className="text-sm font-medium text-gray-900">{user?.name}</p>
          <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
        </div>
      </div>
    </aside>
  );
}

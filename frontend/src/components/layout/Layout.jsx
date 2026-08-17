import { Outlet, useParams } from 'react-router-dom';
import { useEffect } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { useAuth } from '../../context/AuthContext';
import { useAssistantContext } from '../../context/AssistantContext';
import AssistantFab from '../assistant/AssistantFab';
import { cn } from '../../lib/utils';

export default function Layout() {
  const { user } = useAuth();
  const { id: courseId } = useParams();
  const { setAssistantContext } = useAssistantContext();

  useEffect(() => {
    if (courseId) {
      setAssistantContext({ courseId });
    }
  }, [courseId, setAssistantContext]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className={cn(
          "flex-1 p-6 mt-16",
          "transition-all duration-300"
        )}>
          <Outlet />
        </main>
      </div>
      <AssistantFab />
    </div>
  );
}

import { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { cn } from '../../lib/utils'
import { searchApi } from '../../api/resourceApi'
import { 
  Menu, X, BookOpen, LayoutDashboard, GraduationCap, 
  FolderOpen, Settings, Bell, Search, LogOut, User,
  ChevronDown, MessageSquare, Plus, Loader2, Radio, FileText
} from 'lucide-react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Badge } from '../ui/Badge'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'My Courses', href: '/courses/my', icon: BookOpen },
  { name: 'Browse', href: '/courses', icon: FolderOpen },
  { name: 'Assignments', href: '/tasks', icon: FileText },
]

const teacherNav = [
  { name: 'Teaching', href: '/teacher/courses', icon: GraduationCap },
  { name: 'Quick Live', href: '/teacher/live', icon: Radio, highlight: true },
]

const adminNav = [
  { name: 'Admin', href: '/admin', icon: Settings },
]

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  const searchInputRef = useRef(null)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout, isTeacher, isAdmin } = useAuth()

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(true)
        setTimeout(() => searchInputRef.current?.focus(), 100)
      }
      if (e.key === 'Escape') {
        setSearchOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (searchQuery.trim().length >= 2) {
        setSearching(true)
        try {
          const response = await searchApi.searchCourses(searchQuery)
          setSearchResults(response.data || [])
        } catch (error) {
          setSearchResults([])
        } finally {
          setSearching(false)
        }
      } else {
        setSearchResults([])
      }
    }, 300)
    return () => clearTimeout(delayDebounce)
  }, [searchQuery])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleResultClick = (courseId) => {
    setSearchOpen(false)
    setSearchQuery('')
    navigate(`/courses/${courseId}`)
  }

  const allNav = [...navigation, ...(isTeacher ? teacherNav : []), ...(isAdmin ? adminNav : [])]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900">Ed-Tech</span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="p-4 space-y-1">
          {allNav.map((item) => {
            const isActive = location.pathname === item.href || 
              (item.href !== '/dashboard' && location.pathname.startsWith(item.href))
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive 
                    ? "bg-primary-50 text-primary-700" 
                    : item.highlight 
                      ? "text-red-600 hover:bg-red-50" 
                      : "text-gray-700 hover:bg-gray-100"
                )}
              >
                {item.highlight && <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>}
                <item.icon className="w-5 h-5" />
                {item.name}
              </Link>
            )
          })}
        </nav>

        {/* Quick Join */}
        <div className="absolute bottom-20 left-0 right-0 px-4">
          <Link
            to="/join"
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Join with Code
          </Link>
        </div>

        {/* User info */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-primary-700">
                {user?.name?.charAt(0)?.toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Header */}
        <header className="sticky top-0 z-30 h-16 bg-white/80 backdrop-blur-sm border-b border-gray-200">
          <div className="flex items-center justify-between h-full px-4 lg:px-8">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
              >
                <Menu className="w-5 h-5" />
              </button>

              {/* Search */}
              <div className="hidden md:block relative">
                <button 
                  onClick={() => setSearchOpen(true)}
                  className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg w-80 hover:bg-gray-200 transition-colors"
                >
                  <Search className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-500">Search courses... (Ctrl+K)</span>
                </button>
              </div>

              {/* Search Modal */}
              {searchOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-50 bg-black/50"
                    onClick={() => setSearchOpen(false)}
                  />
                  <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-full max-w-xl px-4">
                    <div className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
                      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200">
                        <Search className="w-5 h-5 text-gray-400" />
                        <input
                          ref={searchInputRef}
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search courses..."
                          className="flex-1 bg-transparent text-sm focus:outline-none"
                          autoFocus
                        />
                        {searching && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
                        <button onClick={() => setSearchOpen(false)}>
                          <X className="w-4 h-4 text-gray-400" />
                        </button>
                      </div>
                      <div className="max-h-96 overflow-y-auto">
                        {searchQuery.trim().length < 2 ? (
                          <div className="p-4 text-center text-sm text-gray-500">
                            Type at least 2 characters to search
                          </div>
                        ) : searchResults.length === 0 && !searching ? (
                          <div className="p-4 text-center text-sm text-gray-500">
                            No courses found
                          </div>
                        ) : (
                          <div className="py-2">
                            {searchResults.map((course) => (
                              <button
                                key={course._id}
                                onClick={() => handleResultClick(course._id)}
                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left"
                              >
                                <div className="w-10 h-10 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                                  {course.thumbnail ? (
                                    <img src={course.thumbnail} alt="" className="w-full h-full object-cover" />
                                  ) : (
                                    <BookOpen className="w-5 h-5 text-gray-400 m-2" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-gray-900 truncate">{course.title}</p>
                                  <p className="text-sm text-gray-500">{course.courseCode}</p>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center gap-3">
              {/* Notifications */}
              <button className="relative p-2 hover:bg-gray-100 rounded-lg">
                <Bell className="w-5 h-5 text-gray-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              </button>

              {/* User menu */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 p-1.5 hover:bg-gray-100 rounded-lg"
                >
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-primary-700">
                      {user?.name?.charAt(0)?.toUpperCase()}
                    </span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </button>

                {userMenuOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setUserMenuOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-medium">{user?.name}</p>
                        <p className="text-xs text-gray-500">{user?.email}</p>
                      </div>
                      <Link
                        to="/profile"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <User className="w-4 h-4" />
                        Profile
                      </Link>
                      <Link
                        to="/settings"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <Settings className="w-4 h-4" />
                        Settings
                      </Link>
                      <hr className="my-1" />
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full"
                      >
                        <LogOut className="w-4 h-4" />
                        Logout
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-8 pt-20">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

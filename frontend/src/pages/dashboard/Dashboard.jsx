import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 
  BookOpen, Clock, Trophy, ArrowRight, 
  GraduationCap, PlayCircle, FileText, Plus, Calendar
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { enrollmentApi } from '../../api/enrollmentApi'
import { courseApi } from '../../api/courseApi'
import { analyticsApi } from '../../api/userApi'
import { assignmentApi } from '../../api/assignmentApi'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Progress } from '../../components/ui/Progress'
import { Badge } from '../../components/ui/Badge'
import { CourseCardSkeleton, DashboardSkeleton } from '../../components/ui/Skeleton'
import { EmptyState } from '../../components/ui/EmptyState'
import { useToast } from '../../components/ui/Toast'
import { useInstitutionSocket } from '../../lib/socket'

export default function Dashboard() {
  const navigate = useNavigate()
  const { user, isStudent, isTeacher } = useAuth()
  const { addToast } = useToast()
  const [liveCourses, setLiveCourses] = useState([])

  const { isConnected: socketConnected } = useInstitutionSocket(user?.institution)

  useEffect(() => {
    const handleLiveStarted = (event) => {
      const data = event.detail
      setLiveCourses(prev => {
        if (prev.find(c => c.courseId === data.courseId)) return prev
        return [...prev, data]
      })
      addToast({
        title: 'Live Session Started',
        description: `${data.title} is now live - click to join`,
        type: 'info',
        action: {
          label: 'Join',
          onClick: () => navigate(`/courses/${data.courseId}/live`)
        }
      })
    }

    const handleLiveEnded = (event) => {
      const data = event.detail
      setLiveCourses(prev => prev.filter(c => c.courseId !== data.courseId))
    }

    window.addEventListener('live-started', handleLiveStarted)
    window.addEventListener('live-ended', handleLiveEnded)

    return () => {
      window.removeEventListener('live-started', handleLiveStarted)
      window.removeEventListener('live-ended', handleLiveEnded)
    }
  }, [addToast, navigate])

  const { data: enrollmentsData, isLoading: enrollmentsLoading } = useQuery({
    queryKey: ['enrollments'],
    queryFn: async () => {
      const response = await enrollmentApi.getMyEnrollments()
      return response.data || []
    },
    enabled: isStudent,
    refetchInterval: 30000,
  })

  const { data: myCoursesData, isLoading: coursesLoading } = useQuery({
    queryKey: ['my-courses'],
    queryFn: async () => {
      const response = await courseApi.getMyCourses()
      return response.data || []
    },
    enabled: isTeacher,
  })

  const { data: teacherStats } = useQuery({
    queryKey: ['teacher-dashboard-stats'],
    queryFn: async () => {
      const response = await analyticsApi.getTeacherDashboardStats()
      return response.data
    },
    enabled: isTeacher,
  })

  const { data: upcomingData } = useQuery({
    queryKey: ['upcoming-assignments'],
    queryFn: async () => {
      const response = await assignmentApi.getUpcomingAssignments()
      return response.data || []
    },
  })

  const enrollments = enrollmentsData || []
  const myCourses = myCoursesData || []
  const isLoading = enrollmentsLoading || coursesLoading

  const completedCount = enrollments.filter(e => e.completed).length
  const inProgressCount = enrollments.filter(e => !e.completed && e.progress > 0).length

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Welcome back, {user?.name?.split(' ')[0]}!
          </h1>
          <p className="text-gray-600 mt-1">
            {isStudent 
              ? `You're making great progress! Keep learning.` 
              : `Manage your courses and students.`}
          </p>
        </div>
        {isTeacher && (
          <Button onClick={() => navigate('/teacher/courses/new')} className="w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            Create Course
          </Button>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {isStudent ? (
          <>
            <StatCard 
              icon={BookOpen} 
              label="Enrolled Courses" 
              value={enrollments.length}
              color="primary"
            />
            <StatCard 
              icon={Trophy} 
              label="Completed" 
              value={completedCount}
              color="green"
            />
            <StatCard 
              icon={Clock} 
              label="In Progress" 
              value={inProgressCount}
              color="yellow"
            />
            <StatCard 
              icon={Clock} 
              label="Active Courses" 
              value={inProgressCount}
              color="purple"
            />
          </>
        ) : (
          <>
            <StatCard 
              icon={GraduationCap} 
              label="My Courses" 
              value={myCourses.length}
              color="primary"
            />
            <StatCard 
              icon={BookOpen} 
              label="Total Students" 
              value={teacherStats?.totalStudents || myCourses.reduce((acc, c) => acc + (c.enrollmentCount || 0), 0)}
              color="green"
            />
            <StatCard 
              icon={PlayCircle} 
              label="Live Sessions" 
              value={teacherStats?.liveSessions || myCourses.filter(c => c.isLive).length}
              color="yellow"
            />
            <StatCard 
              icon={FileText} 
              label="Assignments" 
              value={teacherStats?.assignmentsCount || 0}
              color="purple"
            />
          </>
        )}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Courses */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>
                  {isStudent ? 'My Courses' : 'Teaching Courses'}
                </CardTitle>
                <CardDescription>
                  {isStudent 
                    ? 'Courses you are currently enrolled in' 
                    : 'Courses you are teaching'}
                </CardDescription>
              </div>
              <Link to={isStudent ? '/courses/my' : '/teacher/courses'}>
                <Button variant="ghost" size="sm">
                  View all <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <CourseCardSkeleton />
                  <CourseCardSkeleton />
                </div>
              ) : (isStudent ? enrollments : myCourses).length === 0 ? (
                <EmptyState
                  icon={BookOpen}
                  title={isStudent ? "No courses yet" : "No courses created"}
                  description={isStudent 
                    ? "Join a course with a code or browse to get started."
                    : "Create your first course to start teaching."}
                  actionLabel={isStudent ? "Browse Courses" : "Create Course"}
                  onAction={() => navigate(isStudent ? '/courses' : '/teacher/courses/new')}
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {(isStudent ? enrollments : myCourses).slice(0, 4).map((item) => {
                    const course = item.course || item
                    const progress = item.progress || 0
                    return (
                      <Link
                        key={item._id || course._id}
                        to={`/courses/${course._id}`}
                        className="group p-3 sm:p-4 border rounded-lg hover:border-primary-300 hover:shadow-sm transition-all"
                      >
                        <div className="aspect-video bg-gray-100 rounded-lg mb-3 overflow-hidden relative">
                          {course.thumbnail ? (
                            <img 
                              src={course.thumbnail} 
                              alt={course.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <BookOpen className="w-8 h-8 text-gray-300" />
                            </div>
                          )}
                          {(course.isLive || liveCourses.some(lc => lc.courseId === course._id)) && (
                            <Link
                              to={`/courses/${course._id}/live`}
                              className="absolute top-2 right-2 px-2 py-1 bg-red-500 text-white text-xs font-medium rounded-full animate-pulse"
                              onClick={(e) => e.stopPropagation()}
                            >
                              LIVE
                            </Link>
                          )}
                        </div>
                        <h3 className="font-medium text-gray-900 truncate group-hover:text-primary-600">
                          {course.title}
                        </h3>
                        <p className="text-sm text-gray-500 mb-2">{course.courseCode}</p>
                        {isStudent && (
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-500">Progress</span>
                              <span className="font-medium">{progress}%</span>
                            </div>
                            <Progress value={progress} />
                          </div>
                        )}
                      </Link>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link to="/join" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <Plus className="w-4 h-4 mr-2" />
                  Join with Code
                </Button>
              </Link>
              <Link to="/courses" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <BookOpen className="w-4 h-4 mr-2" />
                  Browse Courses
                </Button>
              </Link>
              {isStudent && (
                <Link to="/tasks" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="w-4 h-4 mr-2" />
                    View Assignments
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>

          {/* Upcoming */}
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Assignments</CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingData && upcomingData.length > 0 ? (
                <div className="space-y-3">
                  {upcomingData.slice(0, 5).map((assignment) => (
                    <div key={assignment._id} className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded-lg">
                      <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5 text-yellow-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm truncate">
                          {assignment.title}
                        </p>
                        <p className="text-xs text-gray-500">
                          {assignment.course?.title || 'Unknown Course'}
                        </p>
                        <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                          <Calendar className="w-3 h-3" />
                          Due: {new Date(assignment.dueDate).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500 text-sm">
                  No upcoming assignments
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color }) {
  const colors = {
    primary: "bg-primary-100 text-primary-600",
    green: "bg-green-100 text-green-600",
    yellow: "bg-yellow-100 text-yellow-600",
    purple: "bg-purple-100 text-purple-600",
  }

  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-4">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colors[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-sm text-gray-500">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}

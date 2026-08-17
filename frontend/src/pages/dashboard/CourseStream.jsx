import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { 
  FileText, Video, MessageSquare, Clock, 
  ChevronRight, Download, Play, Bell, BookOpen
} from 'lucide-react'
import { Card, CardContent } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Skeleton } from '../../components/ui/Skeleton'
import { EmptyState } from '../../components/ui/EmptyState'
import { announcementApi } from '../../api/notificationApi'
import { enrollmentApi } from '../../api/enrollmentApi'
import { assignmentApi } from '../../api/assignmentApi'
import { useAuth } from '../../context/AuthContext'

export default function CourseStream() {
  const [filter, setFilter] = useState('all')
  const { isStudent } = useAuth()

  const { data: enrollmentsData } = useQuery({
    queryKey: ['enrollments'],
    queryFn: async () => {
      const response = await enrollmentApi.getMyEnrollments()
      return response.data || []
    },
    enabled: isStudent,
  })

  const { data: announcementsData, isLoading: announcementsLoading } = useQuery({
    queryKey: ['announcements-feed'],
    queryFn: async () => {
      const response = await announcementApi.getAnnouncementFeed()
      return response.data || []
    },
  })

  const { data: upcomingData } = useQuery({
    queryKey: ['upcoming-assignments'],
    queryFn: async () => {
      const response = await assignmentApi.getUpcomingAssignments()
      return response.data || []
    },
    enabled: isStudent,
  })

  const enrollments = enrollmentsData || []
  const announcements = announcementsData || []
  const upcomingAssignments = upcomingData || []

  const buildStreamItems = () => {
    const items = []

    announcements.forEach(announcement => {
      items.push({
        id: `ann-${announcement._id}`,
        type: 'announcement',
        title: announcement.title,
        description: announcement.content?.substring(0, 100) || 'New announcement',
        time: announcement.createdAt,
        courseId: announcement.course?._id || announcement.course,
        course: announcement.course?.title || announcement.course?.courseCode || 'Course',
        data: announcement,
      })
    })

    if (isStudent) {
      upcomingAssignments.forEach(assignment => {
        items.push({
          id: `assign-${assignment._id}`,
          type: 'assignment',
          title: assignment.title,
          description: `Due: ${new Date(assignment.dueDate).toLocaleDateString()}`,
          time: assignment.dueDate,
          courseId: assignment.course?._id,
          course: assignment.course?.title || 'Course',
          data: assignment,
        })
      })

      enrollments.forEach(enrollment => {
        const course = enrollment.course
        if (course?.isLive) {
          items.push({
            id: `live-${course._id}`,
            type: 'video',
            title: 'Live Session Now',
            description: `${course.teacher?.name || 'Teacher'} is live`,
            time: new Date().toISOString(),
            courseId: course._id,
            course: course.title,
            data: course,
          })
        }
      })
    }

    items.sort((a, b) => new Date(b.time) - new Date(a.time))
    return items
  }

  const streamItems = buildStreamItems()

  const filteredItems = filter === 'all' 
    ? streamItems 
    : streamItems.filter(item => item.type === filter)

  const typeConfig = {
    announcement: { icon: MessageSquare, color: 'bg-blue-100 text-blue-600', badge: 'Announcement', link: (item) => `/courses/${item.courseId}` },
    assignment: { icon: FileText, color: 'bg-yellow-100 text-yellow-600', badge: 'Assignment', link: (item) => `/assignments/${item.data._id}` },
    video: { icon: Video, color: 'bg-red-100 text-red-600', badge: 'LIVE', link: (item) => `/courses/${item.courseId}/live` },
    note: { icon: Download, color: 'bg-green-100 text-green-600', badge: 'Material', link: (item) => `/courses/${item.courseId}` },
  }

  const formatTime = (timeString) => {
    const date = new Date(timeString)
    const now = new Date()
    const diffMs = now - date
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffHours < 1) return 'Just now'
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Course Stream</h1>
          <p className="text-gray-500">Stay updated with your courses</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {['all', 'announcement', 'assignment', 'video'].map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              filter === type
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {type === 'all' ? 'All' : type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>

      {/* Stream Timeline */}
      <div className="space-y-4">
        {announcementsLoading ? (
          <>
            <StreamItemSkeleton />
            <StreamItemSkeleton />
            <StreamItemSkeleton />
          </>
        ) : filteredItems.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="No activity yet"
            description="When there's activity in your courses, it'll show up here."
            actionLabel={isStudent ? "Browse Courses" : "Go to Dashboard"}
            actionLink={isStudent ? "/courses" : "/dashboard"}
          />
        ) : (
          filteredItems.map((item) => {
            const config = typeConfig[item.type]
            const link = config.link(item)
            return (
              <Card key={item.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <Link to={link} className="block">
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${config.color}`}>
                        <config.icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="secondary">{config.badge}</Badge>
                          <span className="text-xs text-gray-500">{item.course}</span>
                        </div>
                        <h3 className="font-medium text-gray-900">{item.title}</h3>
                        <p className="text-sm text-gray-500 mt">{item.description}</p>
                        <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
                          <Clock className="w-3 h-3" />
                          {formatTime(item.time)}
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </Link>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}

function StreamItemSkeleton() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <Skeleton className="w-10 h-10 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

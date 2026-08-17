import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { assignmentApi } from '../../api/assignmentApi';
import { useAuth } from '../../context/AuthContext';
import { FileText, Clock, CheckCircle, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { Skeleton } from '../../components/ui/Skeleton';

export default function Tasks() {
  const { isStudent, isTeacher } = useAuth();

  const { data: assignmentsData, isLoading } = useQuery({
    queryKey: ['student-assignments'],
    queryFn: () => assignmentApi.getStudentAssignments(),
    enabled: isStudent,
  });

  const assignments = assignmentsData?.data || [];

  const pendingAssignments = assignments.filter(a => !a.submitted);
  const completedAssignments = assignments.filter(a => a.submitted);

  if (isTeacher) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
          <p className="text-gray-500">Manage your teaching tasks</p>
        </div>
        
        <div className="card">
          <p className="text-gray-500">
            As a teacher, you can manage assignments from your course pages.
          </p>
          <Link to="/teacher/courses" className="text-primary-600 hover:underline mt-2 inline-block">
            Go to My Courses →
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-32" />
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
        <p className="text-gray-500">Your assignments and quizzes</p>
      </div>

      {assignments.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No tasks yet"
          description="When you have assignments or quizzes, they'll show up here."
        />
      ) : (
        <>
          {pendingAssignments.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Pending</h2>
              <div className="space-y-4">
                {pendingAssignments.map(assignment => (
                  <Card key={assignment._id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <Link to={`/assignments/${assignment._id}`} className="block">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <Clock className="w-5 h-5 text-yellow-500" />
                            <div>
                              <h3 className="font-medium text-gray-900">{assignment.title}</h3>
                              <p className="text-sm text-gray-500">{assignment.course?.title || 'Unknown Course'}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge variant="warning">
                              Due: {new Date(assignment.dueDate).toLocaleDateString()}
                            </Badge>
                          </div>
                        </div>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {completedAssignments.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Completed</h2>
              <div className="space-y-4">
                {completedAssignments.map(assignment => (
                  <Card key={assignment._id} className="hover:shadow-md transition-shadow opacity-75">
                    <CardContent className="p-4">
                      <Link to={`/assignments/${assignment._id}`} className="block">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            <div>
                              <h3 className="font-medium text-gray-900">{assignment.title}</h3>
                              <p className="text-sm text-gray-500">{assignment.course?.title || 'Unknown Course'}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge variant="success">
                              {assignment.graded ? `Graded: ${assignment.score}/${assignment.maxScore}` : 'Submitted'}
                            </Badge>
                          </div>
                        </div>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

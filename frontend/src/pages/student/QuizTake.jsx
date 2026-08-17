import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { quizApi } from '../../api/quizApi';
import { courseApi } from '../../api/courseApi';
import { useToast } from '../../components/ui/Toast';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft, Loader2, CheckCircle, XCircle, Clock, Trophy, RotateCcw } from 'lucide-react';
import { Skeleton } from '../../components/ui/Skeleton';

export default function QuizTake() {
  const { courseId, quizId } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { isStudent } = useAuth();
  
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);

  const { data: quizData, isLoading: quizLoading } = useQuery({
    queryKey: ['quiz', quizId],
    queryFn: () => quizApi.getQuizById(quizId),
    enabled: !!quizId,
  });

  const { data: attemptsData, isLoading: attemptsLoading } = useQuery({
    queryKey: ['quiz-attempts', quizId],
    queryFn: () => quizApi.getMyAttempts(quizId),
    enabled: !!quizId,
  });

  const { data: courseData } = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => courseApi.getCourseById(courseId),
    enabled: !!courseId,
  });

  const quiz = quizData?.data;
  const attempts = attemptsData?.data || [];
  const lastAttempt = attempts[0];
  const hasAttempted = attempts.length > 0;

  const submitMutation = useMutation({
    mutationFn: () => quizApi.submitQuiz(quizId, Object.entries(answers).map(([index, answer]) => ({
      questionIndex: parseInt(index),
      selectedAnswer: answer,
    }))),
    onSuccess: (response) => {
      if (response.success) {
        setResult(response.data);
        setSubmitted(true);
        addToast({
          title: response.data.passed ? 'Congratulations!' : 'Quiz Completed',
          description: `You scored ${response.data.percentage}%`,
          type: response.data.passed ? 'success' : 'info',
        });
      }
    },
    onError: (error) => {
      addToast({
        title: 'Error',
        description: error.message || 'Failed to submit quiz',
        type: 'error',
      });
    },
  });

  const handleAnswerSelect = (questionIndex, answer) => {
    setAnswers(prev => ({ ...prev, [questionIndex]: answer }));
  };

  const handleSubmit = () => {
    if (Object.keys(answers).length !== quiz?.questions?.length) {
      addToast({
        title: 'Incomplete',
        description: 'Please answer all questions before submitting',
        type: 'warning',
      });
      return;
    }
    submitMutation.mutate();
  };

  const canRetake = hasAttempted && lastAttempt && lastAttempt.percentage < 50;

  if (!isStudent) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <h2 className="text-xl font-semibold text-gray-900">Access Denied</h2>
        <p className="text-gray-600 mt-2">Only students can take quizzes.</p>
        <button onClick={() => navigate('/dashboard')} className="mt-4 text-primary-600 hover:underline">
          Go to Dashboard
        </button>
      </div>
    );
  }

  if (quizLoading || attemptsLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Quiz not found</p>
        <Link to={`/courses/${courseId}`} className="text-primary-600 hover:underline mt-2 inline-block">
          Back to Course
        </Link>
      </div>
    );
  }

  if (submitted && result) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Link to={`/courses/${courseId}`} className="text-sm text-gray-500 hover:text-gray-700">
            ← Back to Course
          </Link>
        </div>

        <div className="card text-center py-8">
          {result.passed ? (
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          ) : (
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          )}
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {result.passed ? 'Congratulations!' : 'Quiz Completed'}
          </h1>
          
          <div className="flex items-center justify-center gap-8 my-6">
            <div className="text-center">
              <p className="text-4xl font-bold text-primary-600">{result.percentage}%</p>
              <p className="text-sm text-gray-500">Your Score</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-gray-900">{result.score}/{result.totalPoints}</p>
              <p className="text-sm text-gray-500">Points</p>
            </div>
          </div>

          <p className="text-gray-600 mb-6">
            {result.passed 
              ? 'Great job! You passed the quiz.' 
              : `You need ${quiz.passingScore || 50}% to pass. Keep practicing!`}
          </p>

          {canRetake && (
            <button
              onClick={() => {
                setSubmitted(false);
                setResult(null);
                setAnswers({});
              }}
              className="btn-primary flex items-center gap-2 mx-auto"
            >
              <RotateCcw className="w-4 h-4" />
              Try Again
            </button>
          )}

          <Link to={`/courses/${courseId}`} className="btn-secondary mt-4 ml-2">
            Back to Course
          </Link>
        </div>

        <div className="mt-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Review Answers</h2>
          {quiz.questions?.map((question, qIndex) => {
            const userAnswer = lastAttempt?.answers?.find(a => a.questionIndex === qIndex);
            const isCorrect = userAnswer?.isCorrect;
            
            return (
              <div key={qIndex} className="card">
                <div className="flex items-start gap-3">
                  {isCorrect ? (
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">Question {qIndex + 1}: {question.text}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Your answer: {userAnswer?.selectedAnswer || 'Not answered'}
                    </p>
                    {!isCorrect && (
                      <p className="text-sm text-green-600 mt-1">
                        Correct answer: {question.correctAnswer}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">{question.points} points</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link to={`/courses/${courseId}`} className="text-sm text-gray-500 hover:text-gray-700">
            ← Back to Course
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">{quiz.title}</h1>
          <p className="text-sm text-gray-500">{courseData?.data?.title}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">{quiz.questions?.length} questions</p>
          <p className="text-sm text-gray-500">{quiz.totalPoints} points</p>
          <p className="text-sm text-gray-500">Pass: {quiz.passingScore || 50}%</p>
        </div>
      </div>

      {hasAttempted && !canRetake && (
        <div className="card bg-yellow-50 border-yellow-200 mb-6">
          <div className="flex items-center gap-3">
            <Trophy className="w-5 h-5 text-yellow-600" />
            <div>
              <p className="font-medium text-yellow-800">You've already taken this quiz</p>
              <p className="text-sm text-yellow-700">
                Score: {lastAttempt.percentage}% - {lastAttempt.passed ? 'Passed' : 'Not passed'}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {quiz.questions?.map((question, qIndex) => (
          <div key={qIndex} className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Question {qIndex + 1}</h3>
              <span className="text-sm text-gray-500">{question.points} points</span>
            </div>
            
            <p className="text-gray-700 mb-4">{question.text}</p>

            <div className="space-y-2">
              {question.options?.map((option, oIndex) => (
                <label
                  key={oIndex}
                  className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                    answers[qIndex] === option
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name={`question-${qIndex}`}
                    value={option}
                    checked={answers[qIndex] === option}
                    onChange={() => handleAnswerSelect(qIndex, option)}
                    disabled={hasAttempted && !canRetake}
                    className="w-4 h-4 text-primary-600"
                  />
                  <span className="text-gray-700">{option}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex justify-end gap-4">
        <button
          onClick={() => navigate(`/courses/${courseId}`)}
          className="btn-secondary"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={submitMutation.isPending || (hasAttempted && !canRetake)}
          className="btn-primary flex items-center gap-2"
        >
          {submitMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Submitting...
            </>
          ) : (
            'Submit Quiz'
          )}
        </button>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import api, { unwrapSuccess } from '../api/client';

async function joinByCodeRequest(code) {
  const response = await api.post('/enrollments/join-by-code', { code });
  return unwrapSuccess(response);
}

export default function JoinByCodePage() {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: joinByCodeRequest,
    onSuccess: (result) => {
      if (result.success && result.data?.course) {
        navigate(`/courses/${result.data.course._id}`);
      } else if (result.success) {
        navigate('/courses/my');
      }
    },
    onError: (err) => {
      setError(err.message || 'Failed to join course');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!code.trim()) {
      setError('Please enter a course code');
      return;
    }
    setError('');
    mutation.mutate(code.trim().toUpperCase());
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm py-4 px-4">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <Link to="/" className="text-xl font-bold text-primary-600">
            Ed-Tech
          </Link>
          <Link to="/login" className="text-sm text-primary-600 hover:text-primary-700">
            Login
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-gray-900">Join a Course</h1>
              <p className="text-sm text-gray-500 mt-1">
                Enter the course code shared by your instructor
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
                  Course Code
                </label>
                <input
                  type="text"
                  id="code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. ABC123"
                  maxLength={20}
                  className="input text-center text-lg tracking-widest font-mono uppercase"
                  disabled={mutation.isPending}
                />
              </div>

              <button
                type="submit"
                disabled={mutation.isPending || !code.trim()}
                className="btn-primary w-full py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {mutation.isPending ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Joining...
                  </span>
                ) : (
                  'Join Course'
                )}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-100 text-center">
              <p className="text-sm text-gray-500">
                Don't have a code?{' '}
                <Link to="/courses/public" className="text-primary-600 hover:text-primary-700 font-medium">
                  Browse Courses
                </Link>
              </p>
            </div>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            Having trouble? Contact your instructor for the correct course code.
          </p>
        </div>
      </main>
    </div>
  );
}

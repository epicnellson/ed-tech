import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import api, { unwrapSuccess } from '../../api/client';
import { useToast } from '../../components/ui/Toast';

async function joinByCodeRequest(code) {
  const response = await api.post('/enrollments/join-by-code', { code });
  return unwrapSuccess(response);
}

export default function JoinByCodeForm({ onSuccess, compact = false }) {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: joinByCodeRequest,
    onSuccess: (result) => {
      if (result.success && result.data?.course) {
        addToast({ title: 'Success', description: `Joined ${result.data.course.title}`, type: 'success' });
        if (onSuccess) {
          onSuccess(result.data);
        } else {
          navigate(`/courses/${result.data.course._id}`);
        }
      } else if (result.success) {
        addToast({ title: 'Success', description: 'Successfully joined course', type: 'success' });
        navigate('/courses/my');
      }
    },
    onError: (err) => {
      const message = err.message || 'Invalid course code. Please check and try again.';
      setError(message);
      addToast({ title: 'Error', description: message, type: 'error' });
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

  if (compact) {
    return (
      <form onSubmit={handleSubmit} className="space-y-3">
        {error && (
          <div className="p-2 bg-red-50 border border-red-200 rounded text-red-600 text-xs">
            {error}
          </div>
        )}
        <div className="flex gap-2">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="Code"
            maxLength={20}
            className="input flex-1 text-sm"
            disabled={mutation.isPending}
          />
          <button
            type="submit"
            disabled={mutation.isPending || !code.trim()}
            className="btn-primary text-sm px-4 disabled:opacity-50"
          >
            {mutation.isPending ? '...' : 'Join'}
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="p-4 bg-gray-50 rounded-lg">
      <h3 className="text-sm font-medium text-gray-700 mb-3">Join with Code</h3>
      {error && (
        <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="Enter course code"
          maxLength={20}
          className="input"
          disabled={mutation.isPending}
        />
        <button
          type="submit"
          disabled={mutation.isPending || !code.trim()}
          className="btn-primary w-full disabled:opacity-50"
        >
          {mutation.isPending ? 'Joining...' : 'Join Course'}
        </button>
      </form>
    </div>
  );
}

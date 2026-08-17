import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { courseApi } from '../../api/courseApi';
import SelectWithOther from '../../components/ui/SelectWithOther';

const initialFormData = {
  title: '',
  description: '',
  price: 0,
  category: '',
  level: '',
  privacy: 'institution',
  courseCode: '',
  faculty: '',
  program: '',
  semester: 1,
  thumbnail: '',
};

const categories = [
  'Computer Science',
  'Business',
  'Engineering',
  'Mathematics',
  'Science',
  'Arts',
  'Humanities',
  'Medicine',
  'Law',
  'Other',
];

const levels = [
  'Beginner',
  'Intermediate',
  'Advanced',
  'All Levels',
];

const faculties = [
  { code: 'FICT', name: 'Faculty of Information and Communication Technology' },
  { code: 'FBMG', name: 'Faculty of Business and Management Studies' },
  { code: 'FCMB', name: 'Faculty of Communication and Media Studies' },
  { code: 'FABE_FDI', name: 'Faculty of Accounting and Finance' },
];

export default function CreateCourse() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});

  const createCourseMutation = useMutation({
    mutationFn: (data) => courseApi.createCourse(data),
    onSuccess: (response) => {
      if (response.success) {
        navigate(`/courses/${response.data._id}`);
      }
    },
    onError: (error) => {
      setErrors({ submit: error.message || 'Failed to create course' });
    },
  });

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) || 0 : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};
    
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (formData.title.length < 3) newErrors.title = 'Title must be at least 3 characters';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (formData.description.length < 10) newErrors.description = 'Description must be at least 10 characters';
    if (!formData.category) newErrors.category = 'Category is required';
    if (!formData.level) newErrors.level = 'Level is required';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    createCourseMutation.mutate(formData);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Create New Course</h1>
        <p className="text-gray-600">Fill in the details to create a new course</p>
      </div>

      {errors.submit && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {errors.submit}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Course Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className={`input ${errors.title ? 'border-red-500' : ''}`}
                placeholder="e.g. Introduction to Programming"
              />
              {errors.title && <p className="mt-1 text-sm text-red-500">{errors.title}</p>}
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className={`input ${errors.description ? 'border-red-500' : ''}`}
                placeholder="Describe what students will learn..."
              />
              {errors.description && <p className="mt-1 text-sm text-red-500">{errors.description}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="courseCode" className="block text-sm font-medium text-gray-700 mb-1">
                  Course Code
                </label>
                <input
                  type="text"
                  id="courseCode"
                  name="courseCode"
                  value={formData.courseCode}
                  onChange={handleChange}
                  className="input"
                  placeholder="e.g. CS101"
                />
              </div>

              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                  Price (0 for free)
                </label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  min="0"
                  className="input"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Categorization */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Categorization</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SelectWithOther
              label="Category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
              options={categories.filter(c => c !== 'Other').map(cat => ({ value: cat, label: cat }))}
              placeholder="Select Category"
              otherLabel="Other..."
              className={errors.category ? 'border-red-500' : ''}
            />
            {errors.category && <p className="mt-1 text-sm text-red-500">{errors.category}</p>}

            <div>
              <label htmlFor="level" className="block text-sm font-medium text-gray-700 mb-1">
                Level *
              </label>
              <select
                id="level"
                name="level"
                value={formData.level}
                onChange={handleChange}
                className={`input ${errors.level ? 'border-red-500' : ''}`}
              >
                <option value="">Select Level</option>
                {levels.map((lvl) => (
                  <option key={lvl} value={lvl}>{lvl}</option>
                ))}
              </select>
              {errors.level && <p className="mt-1 text-sm text-red-500">{errors.level}</p>}
            </div>

            <div>
              <label htmlFor="faculty" className="block text-sm font-medium text-gray-700 mb-1">
                Faculty
              </label>
              <select
                id="faculty"
                name="faculty"
                value={formData.faculty}
                onChange={handleChange}
                className="input"
              >
                <option value="">Select Faculty</option>
                {faculties.map((fac) => (
                  <option key={fac.code} value={fac.code}>{fac.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="semester" className="block text-sm font-medium text-gray-700 mb-1">
                Semester
              </label>
              <select
                id="semester"
                name="semester"
                value={formData.semester}
                onChange={handleChange}
                className="input"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                  <option key={s} value={s}>Semester {s}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4">
            <label htmlFor="program" className="block text-sm font-medium text-gray-700 mb-1">
              Program
            </label>
            <input
              type="text"
              id="program"
              name="program"
              value={formData.program}
              onChange={handleChange}
              className="input"
              placeholder="e.g. BSc Computer Science"
            />
          </div>
        </div>

        {/* Visibility */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Visibility</h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Who can access this course?
            </label>
            <div className="space-y-2">
              {[
                { value: 'private', label: 'Private', desc: 'Only enrolled students' },
                { value: 'institution', label: 'Institution', desc: 'Anyone in your institution' },
                { value: 'public', label: 'Public', desc: 'Anyone can see and enroll' },
              ].map((option) => (
                <label key={option.value} className="flex items-center">
                  <input
                    type="radio"
                    name="privacy"
                    value={option.value}
                    checked={formData.privacy === option.value}
                    onChange={handleChange}
                    className="h-4 w-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                  />
                  <div className="ml-3">
                    <span className="block text-sm font-medium text-gray-900">{option.label}</span>
                    <span className="block text-sm text-gray-500">{option.desc}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Thumbnail URL */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Course Image</h2>
          
          <div>
            <label htmlFor="thumbnail" className="block text-sm font-medium text-gray-700 mb-1">
              Thumbnail URL
            </label>
            <input
              type="url"
              id="thumbnail"
              name="thumbnail"
              value={formData.thumbnail}
              onChange={handleChange}
              className="input"
              placeholder="https://example.com/image.jpg"
            />
            {formData.thumbnail && (
              <div className="mt-2">
                <img 
                  src={formData.thumbnail} 
                  alt="Preview" 
                  className="h-32 w-auto rounded-lg object-cover"
                  onError={(e) => e.target.style.display = 'none'}
                />
              </div>
            )}
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={createCourseMutation.isPending}
            className="btn-primary"
          >
            {createCourseMutation.isPending ? 'Creating...' : 'Create Course'}
          </button>
        </div>
      </form>
    </div>
  );
}

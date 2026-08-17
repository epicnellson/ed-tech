const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true
  },
  options: [{
    type: String,
    required: true
  }],
  correctAnswer: {
    type: Number,
    required: true,
    min: 0,
    validate: {
      validator: function(v) {
        return v < this.options.length;
      },
      message: 'Correct answer index must be valid'
    }
  },
  points: {
    type: Number,
    default: 1,
    min: 1
  }
});

const QuizSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  questions: [QuestionSchema],
  totalPoints: {
    type: Number,
    default: 0
  },
  passingScore: {
    type: Number,
    default: 50,
    min: 0,
    max: 100
  },
  timeLimit: {
    type: Number,
    default: null,
    min: 1
  },
  isPublished: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

QuizSchema.pre('save', function(next) {
  this.totalPoints = this.questions.reduce((sum, q) => sum + (q.points || 0), 0);
  next();
});

module.exports = mongoose.model('Quiz', QuizSchema);

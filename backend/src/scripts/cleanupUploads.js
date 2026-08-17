require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const { validateEnv } = require('./config/validateEnv');

validateEnv();

const Course = require('./models/Course');
const Lesson = require('./models/Lesson');
const Assignment = require('./models/Assignment');
const AssignmentSubmission = require('./models/AssignmentSubmission');
const CourseResource = require('./models/CourseResource');

const UPLOADS_DIR = path.join(__dirname, '../../../uploads');

async function cleanupOrphanedFiles() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const usedFilePaths = new Set();

    console.log('Collecting file references from database...');

    const courses = await Course.find({ thumbnail: { $ne: null, $ne: '' } });
    courses.forEach(course => {
      if (course.thumbnail && course.thumbnail.includes('/uploads/')) {
        const fileName = course.thumbnail.split('/').pop();
        if (fileName) usedFilePaths.add(fileName);
      }
    });

    const lessons = await Lesson.find();
    lessons.forEach(lesson => {
      if (lesson.videoUrl && lesson.videoUrl.includes('/uploads/')) {
        const fileName = lesson.videoUrl.split('/').pop();
        if (fileName) usedFilePaths.add(fileName);
      }
      if (lesson.attachments && Array.isArray(lesson.attachments)) {
        lesson.attachments.forEach(att => {
          if (att.url && att.url.includes('/uploads/')) {
            const fileName = att.url.split('/').pop();
            if (fileName) usedFilePaths.add(fileName);
          }
        });
      }
    });

    const assignments = await Assignment.find();
    assignments.forEach(assignment => {
      if (assignment.attachment?.url && assignment.attachment.url.includes('/uploads/')) {
        const fileName = assignment.attachment.url.split('/').pop();
        if (fileName) usedFilePaths.add(fileName);
      }
    });

    const submissions = await AssignmentSubmission.find();
    submissions.forEach(submission => {
      if (submission.fileUrl && submission.fileUrl.includes('/uploads/')) {
        const fileName = submission.fileUrl.split('/').pop();
        if (fileName) usedFilePaths.add(fileName);
      }
      if (submission.file?.url && submission.file.url.includes('/uploads/')) {
        const fileName = submission.file.url.split('/').pop();
        if (fileName) usedFilePaths.add(fileName);
      }
    });

    const resources = await CourseResource.find({ fileUrl: { $ne: null, $ne: '' } });
    resources.forEach(resource => {
      if (resource.fileUrl && resource.fileUrl.includes('/uploads/')) {
        const fileName = resource.fileUrl.split('/').pop();
        if (fileName) usedFilePaths.add(fileName);
      }
    });

    console.log(`Found ${usedFilePaths.size} files referenced in database`);

    if (!fs.existsSync(UPLOADS_DIR)) {
      console.log('Uploads directory does not exist');
      return;
    }

    const filesInUploads = fs.readdirSync(UPLOADS_DIR);
    console.log(`Found ${filesInUploads.length} files in uploads directory`);

    const orphanedFiles = filesInUploads.filter(file => !usedFilePaths.has(file));

    console.log(`Found ${orphanedFiles.length} orphaned files`);

    if (orphanedFiles.length === 0) {
      console.log('No orphaned files to clean up');
      return;
    }

    console.log('Orphaned files:');
    orphanedFiles.forEach(file => console.log(`  - ${file}`));

    const { confirm } = require('inquirer').default || { confirm: () => Promise.resolve(true) };
    
    try {
      const inquirer = require('inquirer');
      const { confirm } = inquirer;
      const answers = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'delete',
          message: `Do you want to delete ${orphanedFiles.length} orphaned files?`,
          default: false
        }
      ]);
      
      if (answers.delete) {
        let deletedCount = 0;
        for (const file of orphanedFiles) {
          const filePath = path.join(UPLOADS_DIR, file);
          fs.unlinkSync(filePath);
          deletedCount++;
        }
        console.log(`Successfully deleted ${deletedCount} orphaned files`);
      } else {
        console.log('Cleanup cancelled');
      }
    } catch (e) {
      console.log('\nInquirer not available, running in non-interactive mode');
      console.log('Files that would be deleted:');
      orphanedFiles.forEach(file => console.log(`  - ${file}`));
      console.log('\nRun with --delete flag to actually delete files');
    }

  } catch (error) {
    console.error('Error during cleanup:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

const args = process.argv.slice(2);
if (args.includes('--delete')) {
  process.env.CONFIRM_DELETE = 'true';
}

cleanupOrphanedFiles();

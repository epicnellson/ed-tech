const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const STORAGE_PROVIDER = process.env.STORAGE_PROVIDER || 'local';

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'application/zip',
  'application/x-zip-compressed',
  'application/octet-stream'
];

const FILE_TYPE_MAP = {
  'application/pdf': 'pdf',
  'application/vnd.ms-powerpoint': 'ppt',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/vnd.ms-excel': 'xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'image/jpeg': 'image',
  'image/png': 'image',
  'image/gif': 'image',
  'image/webp': 'image',
  'video/mp4': 'video',
  'video/webm': 'video',
  'video/quicktime': 'video',
  'application/zip': 'zip',
  'application/x-zip-compressed': 'zip',
  'application/octet-stream': 'other'
};

const MAX_FILE_SIZE = 50 * 1024 * 1024;

const getLocalStoragePath = () => {
  const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  return uploadDir;
};

const generateUniqueFilename = (originalName) => {
  const ext = path.extname(originalName);
  const timestamp = Date.now();
  const random = crypto.randomBytes(8).toString('hex');
  return `${timestamp}-${random}${ext}`;
};

const storageAdapter = {
  async upload(file) {
    if (STORAGE_PROVIDER === 's3') {
      return this.uploadToS3(file);
    }
    return this.uploadToLocal(file);
  },

  async uploadToLocal(file) {
    const uploadDir = getLocalStoragePath();
    const uniqueFilename = generateUniqueFilename(file.originalname);
    const filePath = path.join(uploadDir, uniqueFilename);

    return new Promise((resolve, reject) => {
      const writeStream = fs.createWriteStream(filePath);
      writeStream.on('error', reject);
      writeStream.on('finish', () => {
        resolve({
          url: `/uploads/${uniqueFilename}`,
          path: filePath,
          filename: uniqueFilename
        });
      });
      writeStream.end(file.buffer);
    });
  },

  async uploadToS3(file) {
    const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
    const s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      }
    });

    const bucket = process.env.S3_BUCKET;
    const uniqueFilename = generateUniqueFilename(file.originalname);
    const key = `resources/${uniqueFilename}`;

    await s3Client.send(new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype
    }));

    const url = `https://${bucket}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`;

    return {
      url,
      key,
      filename: uniqueFilename
    };
  },

  async delete(fileUrl) {
    if (STORAGE_PROVIDER === 's3') {
      return this.deleteFromS3(fileUrl);
    }
    return this.deleteFromLocal(fileUrl);
  },

  async deleteFromLocal(fileUrl) {
    const filename = fileUrl.split('/').pop();
    const filePath = path.join(getLocalStoragePath(), filename);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    return true;
  },

  async deleteFromS3(fileUrl) {
    const { S3Client, DeleteObjectCommand } = require('@aws-sdk/client-s3');
    const s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      }
    });

    const bucket = process.env.S3_BUCKET;
    const key = fileUrl.split('.amazonaws.com/')[1];

    await s3Client.send(new DeleteObjectCommand({
      Bucket: bucket,
      Key: key
    }));

    return true;
  },

  getFileUrl(filename) {
    if (STORAGE_PROVIDER === 's3') {
      return filename;
    }
    return `${process.env.API_URL || 'http://localhost:5000'}${filename}`;
  },

  validateFile(file) {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new Error('File type not allowed');
    }
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`File size exceeds maximum of ${MAX_FILE_SIZE / 1024 / 1024}MB`);
    }
    return true;
  },

  getFileType(mimeType) {
    return FILE_TYPE_MAP[mimeType] || 'other';
  }
};

module.exports = {
  storageAdapter,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE,
  FILE_TYPE_MAP
};

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import { Readable } from 'stream';

dotenv.config();

const BUCKET_NAME = process.env.AWS_BUCKET_NAME;
if (!BUCKET_NAME) {
  throw new Error('AWS_BUCKET_NAME is required');
}

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

export async function uploadToS3(file, folder = '') {
  if (!file || !file.name) {
    throw new Error('Invalid file provided');
  }

  const fileExtension = file.name.split('.').pop();
  const key = folder ? `${folder}/${uuidv4()}.${fileExtension}` : `${uuidv4()}.${fileExtension}`;

  try {
    // Convert buffer to stream if needed
    const fileBuffer = Buffer.from(file.data);
    
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: fileBuffer,
      ContentType: file.mimetype
    });

    await s3Client.send(command);
    return key;
  } catch (error) {
    console.error('S3 upload error:', error);
    throw new Error('Failed to upload file to S3');
  }
}

export async function getSignedDownloadUrl(key, expiresIn = 3600) {
  if (!key) {
    throw new Error('File key is required');
  }

  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key
    });

    return await getSignedUrl(s3Client, command, { expiresIn });
  } catch (error) {
    console.error('S3 signed URL error:', error);
    throw new Error('Failed to generate download URL');
  }
}

export async function deleteFromS3(key) {
  if (!key) {
    throw new Error('File key is required');
  }

  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key
    });

    await s3Client.send(command);
  } catch (error) {
    console.error('S3 delete error:', error);
    throw new Error('Failed to delete file from S3');
  }
}
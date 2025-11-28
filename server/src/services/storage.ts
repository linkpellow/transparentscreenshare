/**
 * Cloud storage service (AWS S3)
 */

import AWS from 'aws-sdk';
import dotenv from 'dotenv';

dotenv.config();

const s3 = new AWS.S3({
  region: process.env.AWS_REGION || 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'usha-recordings';

export async function uploadToS3(
  filePath: string,
  key: string,
  contentType: string = 'video/webm'
): Promise<string> {
  const fileContent = require('fs').readFileSync(filePath);

  const params: AWS.S3.PutObjectRequest = {
    Bucket: BUCKET_NAME,
    Key: key,
    Body: fileContent,
    ContentType: contentType,
    ACL: 'private', // Use signed URLs for access
  };

  const result = await s3.upload(params).promise();
  return result.Location;
}

export async function generateSignedUrl(
  key: string,
  expiresIn: number = 3600
): Promise<string> {
  const params = {
    Bucket: BUCKET_NAME,
    Key: key,
    Expires: expiresIn,
  };

  return s3.getSignedUrl('getObject', params);
}

export async function deleteFromS3(key: string): Promise<void> {
  const params = {
    Bucket: BUCKET_NAME,
    Key: key,
  };

  await s3.deleteObject(params).promise();
}


import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createErrorResponse, createSuccessResponse } from '../../utils/response';

const s3 = new S3Client({});
const BUCKET_NAME = process.env.IMAGE_BUCKET || '';
const CDN_URL = process.env.CDN_URL || '';

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
};

export const getUploadUrl = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    if (!event.body) {
      return createErrorResponse(400, 'Request body is required');
    }

    const { contentType, extension } = JSON.parse(event.body);

    if (!contentType || !contentType.startsWith('image/')) {
      return createErrorResponse(400, 'Valid image contentType is required');
    }

    const ext = extension || contentType.split('/')[1] || 'jpg';
    const key = `products/${Date.now()}-${Math.random().toString(36).substring(2, 10)}.${ext}`;

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 });
    const imageUrl = `${CDN_URL}/${key}`;

    return createSuccessResponse({
      uploadUrl,
      imageUrl,
      key,
    });
  } catch (error: any) {
    console.error('Error generating presigned URL:', error);
    return createErrorResponse(500, error.message || 'Failed to generate upload URL');
  }
};

const AWS = require('aws-sdk');

const s3 = new AWS.S3({
  signatureVersion: 'v4',
  region: process.env.REGION || 'eu-west-1'
});

const BUCKET_NAME = process.env.IMAGES_BUCKET || 'atushome-product-images-766443151221';

// CORS Headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
};

// Generate presigned URL for upload
exports.getUploadUrl = async (event) => {
  console.log('Generate upload URL');
  
  try {
    const { filename, contentType } = JSON.parse(event.body);
    
    if (!filename || !contentType) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Filename ve contentType gerekli' })
      };
    }

    // Generate unique key
    const key = `products/${Date.now()}-${filename}`;
    
    const params = {
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: contentType,
      Expires: 300 // 5 minutes
    };
    
    const uploadUrl = await s3.getSignedUrlPromise('putObject', params);
    const imageUrl = `https://${BUCKET_NAME}.s3.${process.env.REGION || 'eu-west-1'}.amazonaws.com/${key}`;
    
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ 
        uploadUrl,
        imageUrl,
        key
      })
    };
  } catch (error) {
    console.error('Error generating upload URL:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Upload URL oluşturulamadı' })
    };
  }
};

// Delete image from S3
exports.deleteImage = async (event) => {
  console.log('Delete image:', event.pathParameters);
  
  try {
    const { key } = event.pathParameters;
    
    const params = {
      Bucket: BUCKET_NAME,
      Key: decodeURIComponent(key)
    };
    
    await s3.deleteObject(params).promise();
    
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ message: 'Görsel silindi' })
    };
  } catch (error) {
    console.error('Error deleting image:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Görsel silinemedi' })
    };
  }
};

// List images in a folder
exports.listImages = async (event) => {
  console.log('List images');
  
  try {
    const { prefix = 'products/' } = event.queryStringParameters || {};
    
    const params = {
      Bucket: BUCKET_NAME,
      Prefix: prefix,
      MaxKeys: 100
    };
    
    const result = await s3.listObjectsV2(params).promise();
    
    const images = result.Contents?.map(obj => ({
      key: obj.Key,
      url: `https://${BUCKET_NAME}.s3.${process.env.REGION || 'eu-west-1'}.amazonaws.com/${obj.Key}`,
      size: obj.Size,
      lastModified: obj.LastModified
    })) || [];
    
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ images })
    };
  } catch (error) {
    console.error('Error listing images:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Görsel listesi alınamadı' })
    };
  }
};

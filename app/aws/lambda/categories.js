const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();
const CATEGORIES_TABLE = process.env.CATEGORIES_TABLE || 'AtusHome-Categories';
const PRODUCTS_TABLE = process.env.TABLE_NAME || 'AtusHome-Products';

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key'
};

// Get all categories
exports.getCategories = async (event) => {
  try {
    const params = {
      TableName: CATEGORIES_TABLE
    };
    
    const result = await dynamodb.scan(params).promise();
    
    // Sort by name
    const categories = (result.Items || []).sort((a, b) => a.name.localeCompare(b.name));
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(categories)
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};

// Get category by slug
exports.getCategoryBySlug = async (event) => {
  try {
    const { slug } = event.pathParameters;
    
    const params = {
      TableName: CATEGORIES_TABLE,
      IndexName: 'SlugIndex',
      KeyConditionExpression: 'slug = :slug',
      ExpressionAttributeValues: {
        ':slug': slug
      }
    };
    
    const result = await dynamodb.query(params).promise();
    
    if (!result.Items || result.Items.length === 0) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Category not found' })
      };
    }
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result.Items[0])
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};

// Create category
exports.createCategory = async (event) => {
  try {
    const categoryData = JSON.parse(event.body);
    const timestamp = new Date().toISOString();
    
    // Check if slug already exists
    const existingParams = {
      TableName: CATEGORIES_TABLE,
      IndexName: 'SlugIndex',
      KeyConditionExpression: 'slug = :slug',
      ExpressionAttributeValues: {
        ':slug': categoryData.slug
      }
    };
    
    const existing = await dynamodb.query(existingParams).promise();
    if (existing.Items && existing.Items.length > 0) {
      return {
        statusCode: 409,
        headers,
        body: JSON.stringify({ error: 'Category slug already exists' })
      };
    }
    
    const category = {
      id: `cat_${Date.now()}`,
      ...categoryData,
      productCount: 0,
      createdAt: timestamp,
      updatedAt: timestamp
    };
    
    await dynamodb.put({
      TableName: CATEGORIES_TABLE,
      Item: category
    }).promise();
    
    return {
      statusCode: 201,
      headers,
      body: JSON.stringify(category)
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};

// Update category
exports.updateCategory = async (event) => {
  try {
    const { id } = event.pathParameters;
    const updates = JSON.parse(event.body);
    
    // Build update expression dynamically
    const updateExpressions = [];
    const expressionAttributeNames = {};
    const expressionAttributeValues = {};
    
    const allowedFields = ['name', 'description', 'image', 'icon', 'subcategories'];
    
    allowedFields.forEach(field => {
      if (updates[field] !== undefined) {
        updateExpressions.push(`#${field} = :${field}`);
        expressionAttributeNames[`#${field}`] = field;
        expressionAttributeValues[`:${field}`] = updates[field];
      }
    });
    
    if (updateExpressions.length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'No valid fields to update' })
      };
    }
    
    updateExpressions.push('updatedAt = :updatedAt');
    expressionAttributeValues[':updatedAt'] = new Date().toISOString();
    
    const params = {
      TableName: CATEGORIES_TABLE,
      Key: { id },
      UpdateExpression: `set ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames,
      ExpressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    };
    
    const result = await dynamodb.update(params).promise();
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result.Attributes)
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};

// Delete category
exports.deleteCategory = async (event) => {
  try {
    const { id } = event.pathParameters;
    
    // Check if category has products
    const categoryResult = await dynamodb.get({
      TableName: CATEGORIES_TABLE,
      Key: { id }
    }).promise();
    
    if (!categoryResult.Item) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Category not found' })
      };
    }
    
    if (categoryResult.Item.productCount > 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Cannot delete category with products' })
      };
    }
    
    await dynamodb.delete({
      TableName: CATEGORIES_TABLE,
      Key: { id }
    }).promise();
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'Category deleted successfully' })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};

// Update category product count (called when products are added/removed)
exports.updateProductCount = async (categoryId) => {
  try {
    // Count products in category
    const productsResult = await dynamodb.query({
      TableName: PRODUCTS_TABLE,
      IndexName: 'CategoryIndex',
      KeyConditionExpression: 'category = :category',
      ExpressionAttributeValues: {
        ':category': categoryId
      },
      Select: 'COUNT'
    }).promise();
    
    const count = productsResult.Count || 0;
    
    // Update category
    await dynamodb.update({
      TableName: CATEGORIES_TABLE,
      Key: { id: categoryId },
      UpdateExpression: 'set productCount = :count, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':count': count,
        ':updatedAt': new Date().toISOString()
      }
    }).promise();
    
    return count;
  } catch (error) {
    console.error('Error updating product count:', error);
    throw error;
  }
};

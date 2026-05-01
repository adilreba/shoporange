import { CognitoIdentityProviderClient, AdminAddUserToGroupCommand, AdminUpdateUserAttributesCommand } from '@aws-sdk/client-cognito-identity-provider';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';

const cognitoClient = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION || 'eu-west-1' });
const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'eu-west-1' });
const dynamodb = DynamoDBDocumentClient.from(dynamoClient);

const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID || '';
const USERS_TABLE = process.env.USERS_TABLE || '';

interface PostConfirmationEvent {
  version: string;
  triggerSource: string;
  region: string;
  userPoolId: string;
  userName: string;
  callerContext: {
    awsSdkVersion: string;
    clientId: string;
  };
  request: {
    userAttributes: Record<string, string>;
  };
  response?: Record<string, any>;
}

export const handler = async (event: PostConfirmationEvent): Promise<PostConfirmationEvent> => {
  try {
    const userAttributes = event.request.userAttributes;
    const userSub = userAttributes.sub;
    const email = userAttributes.email;
    const name = userAttributes.name || email.split('@')[0];
    const role = userAttributes['custom:role'] || 'user';
    const marketingConsent = userAttributes['custom:marketingConsent'] === 'true';

    console.log('[PostConfirmation] Processing user:', email, 'sub:', userSub);

    // 1. Ensure custom:role is set to user if not already set
    if (!userAttributes['custom:role']) {
      await cognitoClient.send(new AdminUpdateUserAttributesCommand({
        UserPoolId: USER_POOL_ID,
        Username: event.userName,
        UserAttributes: [
          { Name: 'custom:role', Value: 'user' },
        ],
      }));
      console.log('[PostConfirmation] Set custom:role to user');
    }

    // 2. Add user to the default 'user' Cognito group
    await cognitoClient.send(new AdminAddUserToGroupCommand({
      UserPoolId: USER_POOL_ID,
      Username: event.userName,
      GroupName: 'user',
    }));
    console.log('[PostConfirmation] Added user to group: user');

    // 3. Create user profile in DynamoDB
    if (USERS_TABLE && userSub) {
      const userProfile = {
        id: userSub,
        email,
        name,
        role,
        phone: userAttributes.phone_number || '',
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
        address: [],
        marketingConsent,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await dynamodb.send(new PutCommand({
        TableName: USERS_TABLE,
        Item: userProfile,
      }));
      console.log('[PostConfirmation] Created user profile in DynamoDB');
    }

    return event;
  } catch (error) {
    console.error('[PostConfirmation] Error:', error);
    // Cognito triggers should still return the event even on error
    // to avoid blocking user confirmation. Log the error for monitoring.
    return event;
  }
};

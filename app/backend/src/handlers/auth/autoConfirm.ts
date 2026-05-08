/**
 * Cognito Pre Sign-up Lambda Trigger
 * Automatically confirms users without email verification
 */
export const handler = async (event: any): Promise<any> => {
  // Automatically confirm the user
  event.response.autoConfirmUser = true;
  
  // Automatically verify the email
  if (event.request.userAttributes.email) {
    event.response.autoVerifyEmail = true;
  }
  
  return event;
};

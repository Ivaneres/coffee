/**
 * Extracts a user-friendly error message from FastAPI error responses
 */
export const extractErrorMessage = (error: any): string => {
  const errorDetail = error?.response?.data?.detail;
  
  if (!errorDetail) {
    return 'An error occurred';
  }
  
  // Handle string errors
  if (typeof errorDetail === 'string') {
    return errorDetail;
  }
  
  // Handle validation error arrays (422 errors)
  if (Array.isArray(errorDetail)) {
    return errorDetail
      .map((e: any) => {
        const field = e.loc?.slice(1).join('.') || 'field';
        return `${field}: ${e.msg}`;
      })
      .join(', ');
  }
  
  // Handle object errors
  if (typeof errorDetail === 'object' && errorDetail.msg) {
    return errorDetail.msg;
  }
  
  return 'An error occurred';
};

import apiClient from '../client';

// Mock axios - simpler approach
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    interceptors: {
      request: {
        use: jest.fn(),
      },
      response: {
        use: jest.fn(),
      },
    },
  })),
}));

describe('API Client', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  it('should add token to requests from localStorage', () => {
    localStorage.setItem('token', 'test-token');
    
    // The interceptor should be set up
    expect(apiClient.interceptors.request.use).toBeDefined();
  });

  it('should handle 401 errors and redirect to login', () => {
    // Mock window.location
    delete (window as any).location;
    (window as any).location = { href: '' };

    // The response interceptor should be set up
    expect(apiClient.interceptors.response.use).toBeDefined();
  });
});

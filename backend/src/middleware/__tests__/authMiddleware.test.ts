import { Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../authMiddleware';
import { TokenService } from '../../services/tokenService';

jest.mock('../../services/tokenService');

describe("authMiddleware", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let statusMock: jest.Mock;
  let jsonMock: jest.Mock;

  beforeEach(() => {
    statusMock = jest.fn().mockReturnThis();
    jsonMock = jest.fn();
    mockRequest = {
      headers: {},
      params: {},
    };
    mockResponse = {
      status: statusMock,
      json: jsonMock,
    };
    mockNext = jest.fn();
    process.env.TOKEN_SECRET = "test-secret";
    jest.clearAllMocks();
  });

  it('should return 401 if no token is provided', async () => {
    mockRequest.headers = {};

    await authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({ message: 'Unauthorized' });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should return 401 if authorization header is missing token', async () => {
    mockRequest.headers = { authorization: 'Bearer ' };

    await authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({ message: 'Unauthorized' });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should return 401 if token verification fails', async () => {
    mockRequest.headers = { authorization: 'Bearer invalidtoken' };
    (TokenService.verifyToken as jest.Mock).mockRejectedValue(new Error('Invalid token'));

    await authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({ message: 'Unauthorized' });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should return 401 if token is not an access token', async () => {
    mockRequest.headers = { authorization: 'Bearer refreshtoken' };
    (TokenService.verifyToken as jest.Mock).mockResolvedValue({ _id: 'user123', tokenType: 'refresh' });
    (TokenService.assertTokenType as jest.Mock).mockImplementation(() => {
      throw new Error('Invalid token type');
    });

    await authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({ message: 'Unauthorized' });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should call next and set userId in params if token is valid', async () => {
    mockRequest.headers = { authorization: 'Bearer validtoken' };
    (TokenService.verifyToken as jest.Mock).mockResolvedValue({ _id: 'user123', tokenType: 'access' });
    (TokenService.assertTokenType as jest.Mock).mockImplementation(() => undefined);
    (TokenService.extractUserId as jest.Mock).mockReturnValue('user123');

    await authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockRequest.params?.userId).toBe('user123');
    expect(mockNext).toHaveBeenCalled();
    expect(statusMock).not.toHaveBeenCalled();
  });
});

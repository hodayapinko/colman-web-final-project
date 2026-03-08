import { TokenService } from '../tokenService';

describe('TokenService', () => {
  beforeEach(() => {
    process.env.TOKEN_SECRET = 'test-secret';
  });

  it('should generate access and refresh tokens with tokenType', async () => {
    const pair = TokenService.generateTokenPair('user123');
    expect(pair).not.toBeNull();

    const accessPayload = await TokenService.verifyToken(pair!.accessToken);
    const refreshPayload = await TokenService.verifyToken(pair!.refreshToken);

    expect(accessPayload._id).toBe('user123');
    expect(refreshPayload._id).toBe('user123');

    expect(accessPayload.tokenType).toBe('access');
    expect(refreshPayload.tokenType).toBe('refresh');

    // Guard helpers
    expect(() => TokenService.assertTokenType(accessPayload, 'access')).not.toThrow();
    expect(() => TokenService.assertTokenType(refreshPayload, 'refresh')).not.toThrow();
    expect(() => TokenService.assertTokenType(accessPayload, 'refresh')).toThrow();
  });
});

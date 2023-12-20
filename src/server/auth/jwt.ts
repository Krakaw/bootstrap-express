import jwt from 'jsonwebtoken';

import { JwtAccessToken, JwtRefreshToken, JwtScope } from '../../types/jwt';
import config from '../../utils/config';

// Generate accessToken and refreshToken
export function generateJwtTokens(
    jwtData: JwtAccessToken,
    salt = ''
): {
    token: string;
    refreshToken: string;
} {
    const {
        refreshTokenSecret,
        accessTokenSecret,
        accessTokenExpiresIn,
        refreshTokenExpiresIn
    } = config.server.jwt;

    const token = jwt.sign(jwtData, accessTokenSecret + salt, {
        expiresIn: accessTokenExpiresIn
    });
    const refreshToken = jwt.sign(
        { id: jwtData.id, scope: 'refresh' },
        refreshTokenSecret + salt,
        {
            expiresIn: refreshTokenExpiresIn
        }
    );
    return {
        token,
        refreshToken
    };
}

export function authenticateJwtUser(
    jwtScope: JwtScope.Access,
    token: string,
    salt?: string
): JwtAccessToken;
export function authenticateJwtUser(
    jwtScope: JwtScope.Refresh,
    token: string,
    salt?: string
): JwtRefreshToken;
export function authenticateJwtUser(
    jwtScope: JwtScope,
    token?: string,
    salt = ''
): JwtAccessToken | JwtRefreshToken {
    if (!token) {
        throw new Error('Unauthorized');
    }
    const { accessTokenSecret, refreshTokenSecret } = config.server.jwt;
    const secret =
        jwtScope === JwtScope.Access ? accessTokenSecret : refreshTokenSecret;
    return jwt.verify(token, secret + salt);
}

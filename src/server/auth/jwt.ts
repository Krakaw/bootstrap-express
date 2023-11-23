import jwt from 'jsonwebtoken';

import { JwtAccessToken, JwtRefreshToken, JwtScope } from '../../types/jwt';
import config from '../../utils/config';

// Generate accessToken and refreshToken
export function generateJwtTokens(
    jwtData: JwtAccessToken,
    customExpiresIn?: number
): {
    accessToken: string;
    refreshToken: string;
} {
    const {
        refreshTokenSecret,
        accessTokenSecret,
        accessTokenExpiresIn,
        refreshTokenExpiresIn
    } = config.server.jwt;

    const accessToken = jwt.sign(jwtData, accessTokenSecret, {
        expiresIn: customExpiresIn || accessTokenExpiresIn
    });
    const refreshToken = jwt.sign(
        { id: jwtData.id, scope: 'refresh' },
        refreshTokenSecret,
        {
            expiresIn: customExpiresIn || refreshTokenExpiresIn
        }
    );
    return {
        accessToken,
        refreshToken
    };
}

export function authenticateJwtUser(
    jwtScope: JwtScope.ACCESS,
    token: string
): JwtAccessToken;
export function authenticateJwtUser(
    jwtScope: JwtScope.REFRESH,
    token: string
): JwtRefreshToken;
export function authenticateJwtUser(
    jwtScope: JwtScope,
    token?: string
): JwtAccessToken | JwtRefreshToken {
    if (!token) {
        throw new Error('Unauthorized');
    }
    const { accessTokenSecret, refreshTokenSecret } = config.server.jwt;
    const secret =
        jwtScope === JwtScope.ACCESS ? accessTokenSecret : refreshTokenSecret;
    return jwt.verify(token, secret);
}

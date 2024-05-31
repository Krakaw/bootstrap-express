import { NextFunction, Request, Response } from 'express';

import { JwtScope } from '../../types/jwt';
import { authenticateJwtUser } from '../auth/jwt';

function extractJwtFromReq(req: Request): string | null {
    // Check for query param
    const queryToken = req.query.token;
    if (queryToken && typeof queryToken === 'string') {
        return queryToken;
    }

    // Check if it is passed back in state
    const { state } = req.query;
    if (state && typeof state === 'string') {
        const token = decodeURIComponent(state).split('token=')[1];
        if (token) {
            return token;
        }
    }

    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return null;
    }
    const [bearer, token] = authHeader.split(' ');
    if (bearer !== 'Bearer') {
        return null;
    }
    return token;
}
export function authenticateJwt(
    req: Request,
    res: Response,
    next: NextFunction
): void {
    try {
        const token = extractJwtFromReq(req) || '';
        req.jwt = authenticateJwtUser(JwtScope.Access, token);
        const { jwt } = req;
        const { id } = jwt;
        if (!id) {
            throw new Error('Invalid JWT');
        }
        next();
    } catch (err) {
        res.status(401).json({ message: 'Unauthorized' });
    }
}

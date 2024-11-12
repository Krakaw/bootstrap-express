import { Request, Response, NextFunction } from 'express';
import config from '../../utils/config';


export default function requireToken(
    req: Request,
    res: Response,
    next: NextFunction
): Response | undefined {
    if (
        !config.auth.adminToken ||
        config.auth.adminToken !== req.header(config.auth.adminTokenHeader)
    ) {
        return res.status(401).send('Invalid token');
    }
    next();
}

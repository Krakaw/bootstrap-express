import express from 'express';

import config from '../../utils/config';

// eslint-disable-next-line consistent-return
export default function requireToken(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
): Express.Response | void {
    if (
        !config.auth.adminToken ||
        config.auth.adminToken !== req.header(config.auth.adminTokenHeader)
    ) {
        return res.status(401).send('Invalid token');
    }
    next();
}

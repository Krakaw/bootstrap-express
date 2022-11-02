import cookieParser from 'cookie-parser';
import express, { Express, Request, Response } from 'express';

import { version } from '../../package.json';
import { Services } from '../types/services';
import appRouter from './routes';

export default function initApp(services: Services): Express {
    const app = express();

    app.use(cookieParser());
    app.disable('x-powered-by');
    app.use(express.json());
    app.use((req: Request, res, next) => {
        // Inject services into the request object
        req.services = services;
        next();
    });

    app.get('/status', (req: Request, res: Response) => {
        res.send(version);
    });
    app.use('/', appRouter);
    return app;
}

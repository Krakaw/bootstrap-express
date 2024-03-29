import cookieParser from 'cookie-parser';
import express, { Express, Request, Response } from 'express';
import 'express-async-errors';
import path from 'path';

import { version } from '../../package.json';
import { Services } from '../types/services';
import logger from '../utils/logger';
import appRouter from './routes';

export default function initApp(services: Services): Express {
    const app = express();
    app.set('trust proxy', true);
    app.use(cookieParser());
    app.disable('x-powered-by');
    app.use(express.static(path.join(__dirname, '../../public')));
    app.use(express.json());
    app.use((req: Request, res, next) => {
        // Inject services into the request object
        req.services = services;
        next();
    });

    app.get('/status', (req: Request, res: Response) => {
        res.send(version);
    });
    app.use('/', appRouter(services));
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    app.use((err, req, res, _next) => {
        const { message } = err;
        if (message.startsWith('invalid input syntax')) {
            res.status(400).json({
                message: 'Invalid ID'
            });
        } else if (message.startsWith('Could not find any entity of type')) {
            res.status(404).json({
                message: 'Could not find entity'
            });
        } else {
            logger.error(err, 'Catch-All Error');
            res.status(500).json({ message: 'Something broke!' });
        }
    });
    return app;
}

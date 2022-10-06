import express, { Request, Response } from 'express';

import { version } from '../../package.json';

const app = express();

app.get('/status', (req: Request, res: Response) => {
    res.send(version);
});

export default app;

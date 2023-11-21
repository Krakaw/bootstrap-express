import * as e from 'express';
import * as http from 'http';

import initApp from '../server/app';
import initServices from '../services';
import { Services } from '../types/services';
import config from '../utils/config';

export const mochaServices = {
    app: undefined as unknown as e.Express,
    server: undefined as unknown as http.Server,
    services: undefined as unknown as Services
};

export const mochaHooks = {
    beforeAll: [
        async function (): Promise<void> {
            config.app.isTest = true;
            config.auth.adminToken = 'secret';
            mochaServices.services = await initServices();
            mochaServices.app = await initApp(mochaServices.services);
            mochaServices.server = mochaServices.app.listen((err: unknown) => {
                if (err) throw err;
            });
        }
    ],
    afterAll: [
        async function (): Promise<void> {
            mochaServices.services.kill.kill('SIGINT');
            mochaServices.server.close();
        }
    ]
};

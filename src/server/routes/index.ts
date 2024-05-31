import express, { Router } from 'express';

import { Services } from '../../types/services';
import admin from './admin';
import auth from './auth';
import jwt from './jwt';

const router = express.Router();

export default (services: Services): Router => {
    router.use('/auth', auth(services));
    router.use('/admin', admin);
    router.use('/jwt', jwt);
    return router;
};

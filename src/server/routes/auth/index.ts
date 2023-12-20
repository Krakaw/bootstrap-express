import express, { Router } from 'express';
import expressSession from 'express-session';
import passport from 'passport';

import { Services } from '../../../types/services';
import local from './local';
import twitter from './twitter';

const router = express.Router();

export default (services: Services): Router => {
    router.use(
        expressSession({
            secret: 'keyboard cat',
            resave: false,
            saveUninitialized: false
        })
    );
    router.use(passport.initialize());
    router.use(passport.session());
    router.use('/twitter', twitter(services));
    router.use('/local', local(services));
    return router;
};

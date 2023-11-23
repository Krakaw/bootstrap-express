import express from 'express';

import admin from './admin';
import jwt from './jwt';

const router = express.Router();
router.use('/admin', admin);
router.use('/jwt', jwt);
export default router;

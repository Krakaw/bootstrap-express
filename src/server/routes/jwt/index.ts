import express from 'express';

import { authenticateJwt } from '../../middleware/jwt';

const router = express.Router();
router.use(authenticateJwt);

router.get('/echo/:echo', (req, res) => {
    res.json({ message: req.params.echo });
});

export default router;

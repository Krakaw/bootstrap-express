import express from 'express';

import requireToken from '../../middleware/requireToken';

const router = express.Router();
router.use(requireToken as express.RequestHandler);

router.get('/echo/:echo', (req, res) => {
    res.json({ message: req.params.echo });
});

export default router;

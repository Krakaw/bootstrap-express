import { expect } from 'chai';
import express from 'express';
import request from 'supertest';

import router from '../../../server/routes/guarded/index';

describe('Guarded Echo Endpoint', () => {
    const app = express();
    app.use(router);

    it('should return the echoed message when x-admin-token is present', async () => {
        const message = 'Hello, world!';
        const response = await request(app)
            .get(`/echo/${message}`)
            .use((req) => {
                req.set('x-admin-token', 'secret');
            });

        expect(response.status).to.be.equal(200);
        expect(response.body).to.be.deep.equal({ message });
    });

    it('should return a 401 when the x-admin-token is omitted', async () => {
        const message = 'Hello, world!';
        const response = await request(app).get(`/echo/${message}`);

        expect(response.status).to.be.equal(401);
    });

    it('should return a 401 when the x-admin-token is incorrect', async () => {
        const message = 'Hello, world!';
        const response = await request(app)
            .get(`/echo/${message}`)
            .use((req) => {
                req.set('x-admin-token', 'wrong-secret');
            });

        expect(response.status).to.be.equal(401);
    });
});

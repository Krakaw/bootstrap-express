import { expect } from 'chai';
import request from 'supertest';

import { mochaServices } from '../../bootstrap';

describe('Admin Echo Endpoint', () => {
    it('should return the echoed message when x-admin-token is present', async () => {
        const { app } = mochaServices;

        const message = 'Hello, world!';
        const response = await request(app)
            .get(`/admin/echo/${message}`)
            .use((req) => {
                req.set('x-admin-token', 'secret');
            });

        expect(response.status).to.be.equal(200);
        expect(response.body).to.be.deep.equal({ message });
    });

    it('should return a 401 when the x-admin-token is omitted', async () => {
        const { app } = mochaServices;

        const message = 'Hello, world!';
        const response = await request(app).get(`/admin/echo/${message}`);

        expect(response.status).to.be.equal(401);
    });

    it('should return a 401 when the x-admin-token is incorrect', async () => {
        const { app } = mochaServices;

        const message = 'Hello, world!';
        const response = await request(app)
            .get(`/admin/echo/${message}`)
            .use((req) => {
                req.set('x-admin-token', 'wrong-secret');
            });

        expect(response.status).to.be.equal(401);
    });
});

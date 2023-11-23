import { expect } from 'chai';
import request from 'supertest';

import { mochaServices } from '../../bootstrap';

describe('JWT Echo Endpoint', () => {
    it('should return the echoed message when a valid JWT is passed in', async () => {
        const { app } = mochaServices;
        const jwt =
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyMzQ1Njc4OTAiLCJzY29wZSI6ImFjY2VzcyIsImlhdCI6MTcxNjIzOTAyMn0.pvjC3s1PVPZxwVJmgDKXdC-v2F9vL03lFEsm0Exd7vQ';
        const message = 'Hello, world!';
        const response = await request(app)
            .get(`/jwt/echo/${message}`)
            .use((req) => {
                req.set('Authorization', `Bearer ${jwt}`);
            });

        expect(response.status).to.be.equal(200);
        expect(response.body).to.be.deep.equal({ message });
    });
    it('should return a 401 when the JWT does not have an id', async () => {
        const { app } = mochaServices;
        const jwt =
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzY29wZSI6ImFjY2VzcyIsImlhdCI6MTcxNjIzOTAyMn0.U0Qeyrm2h8sAHIzGdlxkHvo_au9Ams9wQ23TvES5OEw';
        const message = 'Hello, world!';
        const response = await request(app)
            .get(`/jwt/echo/${message}`)
            .use((req) => {
                req.set('Authorization', `Bearer ${jwt}`);
            });

        expect(response.status).to.be.equal(401);
    });

    it('should return a 401 when the JWT is not signed correctly', async () => {
        const { app } = mochaServices;
        const jwt =
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyMzQ1Njc4OTAiLCJzY29wZSI6ImFjY2VzcyIsImlhdCI6MTcxNjIzOTAyMn0.L-vspUtco6p3DXq-xf5MFC0LDQ1zX_4YDJMrf54eraE';
        const message = 'Hello, world!';
        const response = await request(app)
            .get(`/jwt/echo/${message}`)
            .use((req) => {
                req.set('Authorization', `Bearer ${jwt}`);
            });

        expect(response.status).to.be.equal(401);
    });

    it('should return a 401 when the JWT has the wrong scope', async () => {
        const { app } = mochaServices;
        const jwt =
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyMzQ1NiIsInNjb3BlIjoicmVmcmVzaCIsImlhdCI6MTcxNjIzOTAyMn0.8dWMQCxQY7DYMTv7URTwtZzZjZzJTDNY2aLX9K0mDPQ';
        const message = 'Hello, world!';
        const response = await request(app)
            .get(`/jwt/echo/${message}`)
            .use((req) => {
                req.set('Authorization', `Bearer ${jwt}`);
            });

        expect(response.status).to.be.equal(401);
    });

    it('should return a 401 when the jwt is missing', async () => {
        const { app } = mochaServices;

        const message = 'Hello, world!';
        const response = await request(app).get(`/jwt/echo/${message}`);

        expect(response.status).to.be.equal(401);
    });
});

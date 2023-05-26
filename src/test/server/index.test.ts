import { expect } from 'chai';
import request from 'supertest';

import { version } from '../../../package.json';
import { mochaServices } from '../bootstrap';

describe('Server', () => {
    it('version matches package.json', () => {
        const { app } = mochaServices;
        request(app)
            .get('/status')
            .expect(200, async (err, res) => {
                expect(res.text).to.be.equals(version);
            });
    });
});

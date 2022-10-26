import { expect } from 'chai';
import request from 'supertest';

import app from '../server/app';

describe('App', () => {
    before((done) => {
        app.listen((err: unknown) => {
            if (err) return done(err);
            return done();
        });
    });

    it('works properly', (done) => {
        request(app)
            .get('/status')
            .expect(200, (err, res) => {
                if (err) return done(err);
                expect(res.text).to.be.equals('0.0.1');
                return done();
            });
    });
});

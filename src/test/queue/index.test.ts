import { expect } from 'chai';

import sleep from '../../utils/sleep';
import { mochaServices } from '../bootstrap';

describe('Example Queue Processor', () => {
    let jobId: string | null = null;
    it('should allow a new job to be added', async () => {
        const { queues } = mochaServices.services;

        jobId = await queues.defaultQueueExample.addJob({
            data: { value: 'roar' },
            id: '1'
        });
        expect(jobId).to.be.a('string');
    });

    it('should have an existing unprocessed job', async () => {
        const { pgBoss } = mochaServices.services;
        const job = await pgBoss.connection.getJobById(jobId || '');
        expect(job).to.have.property('id', jobId);
    });

    it('should process the job', async () => {
        const { queues, pgBoss } = mochaServices.services;
        queues.defaultQueueExample.process();
        const job = await pgBoss.connection.getJobById(jobId || '');
        console.log(job);
        expect(job).to.have.property('id', jobId);
    });
});

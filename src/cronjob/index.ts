import { CronJob } from 'cron';

import { Services } from '../types/services';

export default async function initCron(services: Services): Promise<void> {
    const { logger, kill } = services;
    logger.info('⚡ Starting Cron');
    return new Promise((resolve) => {
        const jobs: CronJob[] = [];

        jobs.push(
            new CronJob(
                '*/15 * * * *',
                () => {
                    // Cron runner
                },
                null,
                true,
                'UTC'
            )
        );
        kill.on('kill', () => {
            logger.info('Stopping cron jobs');
            jobs.forEach((job) => job.stop());
            resolve();
        });
    });
}

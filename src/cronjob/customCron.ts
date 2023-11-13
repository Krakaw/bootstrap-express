import { CronJob } from 'cron';

import CustomCron from '../db/customCron';
import { Services } from '../types/services';

export default async function initCustomCron(
    services: Services
): Promise<void> {
    const { logger, kill } = services;
    logger.info('⚡ Starting Custom Cron processor');
    const customCrons = await services.dataSource
        .getRepository(CustomCron)
        .find({
            where: {
                active: true
            }
        });
    const jobs = customCrons
        .map((customCron): undefined | CronJob => {
            logger.debug(
                `⚡ Starting custom cron ${customCron.name} ${customCron.cron}`
            );
            return new CronJob(
                customCron.cron,
                async () => {
                    switch (customCron.type) {
                        default:
                            logger.error(
                                `Unknown custom cron type: ${customCron.type}`
                            );
                    }
                },
                null,
                true,
                'UTC'
            );
        })
        .filter((job) => job !== undefined) as CronJob[];

    logger.info(`⚡ ${jobs.length} cron jobs started`);
    return new Promise((resolve) => {
        kill.on('kill', () => {
            logger.info('Stopping custom cron jobs');
            jobs.forEach((job) => job.stop());
            resolve();
        });
    });
}

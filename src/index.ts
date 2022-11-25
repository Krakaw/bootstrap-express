import { Arguments } from 'yargs';

import { version } from '../package.json';
import initializeCli from './cli';
import dataSource from './db';
import startProcessor from './processor';
import startServer from './server';
import redisInit from './services/redis';
import { Services } from './types/services';
import config from './utils/config';
import Kill from './utils/kill';
import appLogger, { Logger } from './utils/logger';

appLogger.debug(`Version: ${version}`);

const initializeServices = async (logger: Logger): Promise<Services> => {
    const kill = new Kill(logger);
    await dataSource.initialize();

    const redis = redisInit(logger);
    await new Promise((r) => {
        redis.on('ready', r);
    });
    dataSource.subscribers.forEach((s) => {
        const subscriberServices = {
            setRedisStream: redis
        };
        Object.keys(subscriberServices).forEach((key) => {
            if (typeof s[key] === 'function') {
                s[key](subscriberServices[key]);
            }
        });
    });
    return {
        dataSource,
        redis,
        logger,
        kill
    };
};
async function init(argv: Arguments) {
    const services = await initializeServices(appLogger);
    const { _ = ['server'] } = argv;
    const command = ((_.pop() as string) || '').toLowerCase()?.trim();
    switch (command) {
        case 'process':
            await startProcessor(services);
            break;
        default:
            await startServer(services);
    }
}
const cliArgs: Arguments = initializeCli();
init(cliArgs)
    .then(() => {
        appLogger.info('Completed');
        process.exit(0);
    })
    .catch((e) => appLogger.error(e));

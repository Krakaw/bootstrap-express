/* eslint-disable @typescript-eslint/no-shadow */
import initDb, { initTestDb } from '../db';
import { Pubsub } from '../pubsub';
import Queue, { IQueueConstructor } from '../queue';
import DefaultQueueExample from '../queue/defaultQueueExample';
import { CoreServices, Queues, Services } from '../types/services';
import config from '../utils/config';
import Kill from '../utils/kill';
import logger from '../utils/logger';
import PgBossConnection from './pg-boss';
import { Redis } from './redis';

function createQueue<DataType>(
    NewQueue: IQueueConstructor<DataType>,
    queueName: string
): Queue<DataType> {
    return new NewQueue(queueName);
}

function initQueues(): Queues {
    return {
        // Add your queues here
        defaultQueueExample: createQueue(
            DefaultQueueExample,
            'Default Queue Example'
        )
    };
}

async function cleanup({
    kill,
    logger,
    dataSource,
    pgBoss,
    redis,
    pubsub
}: Services) {
    kill.on('kill', async () => {
        logger.debug('Stopping database');
        await dataSource.destroy();
        logger.debug('Stopping rabbit');
        await pgBoss.disconnect();
        logger.debug('Stopping redis');
        await redis.disconnect();
        logger.debug('Stopping pubsub');
        await pubsub.stop();
    });
}

export default async function initServices(): Promise<Services> {
    logger.debug('Initializing Services...');

    logger.debug('Initializing Database...');
    const dataSource = config.app.isTest ? await initTestDb() : initDb();
    if (!dataSource.isInitialized) {
        await dataSource.initialize();
    }
    logger.debug('Database Initialized');

    logger.debug('Initializing Redis...');
    const redis = new Redis(config.redis, logger);
    logger.debug('Redis Initialized');

    logger.debug('Initializing Process Kill...');
    const kill = new Kill(logger);
    logger.debug('Process Kill Initialized');

    const coreServices: CoreServices = {
        dataSource,
        redis,
        logger,
        kill
    };

    const pubsub = new Pubsub(redis.duplicate());

    logger.debug('Initializing PgBoss...');
    const pgBoss = new PgBossConnection(coreServices);
    logger.debug('Initialized PgBoss...');
    const queues = initQueues();
    dataSource.insertQueues(queues);
    const services: Services = {
        ...coreServices,
        queues,
        pubsub,
        pgBoss
    };

    if (!config.app.isTest) {
        // eslint-disable-next-line no-restricted-syntax
        for (const key of Object.keys(queues)) {
            logger.debug(`Initializing Queue ${key}...`);
            // eslint-disable-next-line no-await-in-loop
            await queues[key as keyof Queues]?.init(services);
            logger.debug(`Queue ${key} Initialized`);
        }
    }

    logger.debug('Create cleanup steps');
    await cleanup(services);
    logger.debug('Services Initialized');

    return services;
}

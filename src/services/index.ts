/* eslint-disable @typescript-eslint/no-shadow */
import initDb, { initTestDb } from '../db';
import { Pubsub } from '../pubsub';
import Queue, { IQueueConstructor } from '../queue';
import ProcessQueue from '../queue/process';
import { CoreServices, Queues, Services } from '../types/services';
import config from '../utils/config';
import Kill from '../utils/kill';
import logger, { Logger } from '../utils/logger';
import RabbitConnection from './rabbit';
import { Redis } from './redis';

function createQueue<DataType>(
    NewQueue: IQueueConstructor<DataType>,
    logger: Logger,
    name: string,
    onComplete?: () => void
): Queue<DataType> {
    return new NewQueue({
        name,
        onComplete:
            onComplete ||
            (() => {
                logger.info(`Queue ${name} completed`);
            })
    });
}
function initQueues(services: CoreServices): Queues {
    const { logger } = services;
    return {
        processQueue: createQueue(ProcessQueue, logger, 'Process Queue')
    };
}

async function cleanup({
    kill,
    logger,
    dataSource,
    rabbit,
    redis,
    pubsub
}: Services) {
    kill.on('kill', async () => {
        logger.debug('Stopping database');
        await dataSource.destroy();
        // TODO: Add some logic to kill to wait for all queues to finish
        // TODO: This should a depends_on based queue system, but out of scope for now
        logger.debug('Stopping rabbit');
        await rabbit.disconnect();
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

    logger.debug('Initializing RabbitMQ...');
    const rabbit = new RabbitConnection(logger);
    if (config.queue.rabbitUrl) {
        await rabbit.connect();
        logger.debug('RabbitMQ Initialized');
    } else {
        logger.debug('RabbitMQ initialization skipped');
    }

    logger.debug('Initializing Redis...');
    const redis = new Redis(config.redis, logger);
    logger.debug('Redis Initialized');

    logger.debug('Initializing Process Kill...');
    const kill = new Kill(logger);
    logger.debug('Process Kill Initialized');

    const coreServices: CoreServices = {
        dataSource,
        redis,
        rabbit,
        logger,
        kill
    };

    const pubsub = new Pubsub(redis.duplicate());

    const queues = initQueues(coreServices);
    dataSource.insertQueues(queues);
    const services: Services = {
        ...coreServices,
        queues,
        pubsub
    };

    // eslint-disable-next-line no-restricted-syntax
    for (const key of Object.keys(queues)) {
        logger.debug(`Initializing Queue ${key}...`);
        // eslint-disable-next-line no-await-in-loop
        await queues[key as keyof Queues]?.init(services);
        logger.debug(`Queue ${key} Initialized`);
    }

    logger.debug('Create cleanup steps');
    await cleanup(services);
    logger.debug('Services Initialized');

    return services;
}

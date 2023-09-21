import { type DataSourceWithRepositories } from '../db';
import { Pubsub } from '../pubsub';
import type ProcessQueue from '../queue/process';
import RabbitConnection from '../services/rabbit';
import { Redis } from '../services/redis';
import Kill from '../utils/kill';
import { Logger } from '../utils/logger';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface Queues {
    processQueue: ProcessQueue;
}
export interface CoreServices {
    dataSource: DataSourceWithRepositories;
    redis: Redis;
    rabbit: RabbitConnection;
    logger: Logger;
    kill: Kill;
}
export interface Services extends CoreServices {
    queues: Queues;
    pubsub: Pubsub;
}

import { type DataSourceWithRepositories } from '../db';
import { Pubsub } from '../pubsub';
import type DefaultQueueExample from '../queue/defaultQueueExample';
import type PgBossConnection from '../services/pg-boss';
import { Redis } from '../services/redis';
import Kill from '../utils/kill';
import { Logger } from '../utils/logger';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface Queues {
    defaultQueueExample: DefaultQueueExample;
}
export interface CoreServices {
    dataSource: DataSourceWithRepositories;
    redis: Redis;
    logger: Logger;
    kill: Kill;
}
export interface Services extends CoreServices {
    queues: Queues;
    pubsub: Pubsub;
    pgBoss: PgBossConnection;
}

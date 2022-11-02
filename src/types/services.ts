import { DataSource } from 'typeorm';

import { Redis } from '../services/redis';
import Kill from '../utils/kill';
import { Logger } from '../utils/logger';

export interface Services {
    dataSource: DataSource;
    redis: Redis;
    logger: Logger;
    kill: Kill;
}

import EventEmitter from 'events';
import CreateClient from 'ioredis';
import { Logger } from 'pino';

import systemConfig, { RedisConfig } from '../utils/config';

export class Redis extends EventEmitter {
    public readonly client;

    private readonly logger;

    constructor(config: RedisConfig, logger: Logger) {
        super();
        this.logger = logger.child({
            service: 'redis'
        });
        const redisConfig: any = { ...config };
        delete redisConfig.url;
        delete redisConfig.prefix;

        this.client = new CreateClient(redisConfig);
        this.client.on('error', (err: any) =>
            this.logger.error({ message: 'Redis Client Error', err })
        );
        this.client.on('ready', () => {
            this.logger.debug(`Redis connected`);
            this.emit('ready');
        });
    }

    async disconnect(): Promise<void> {
        await this.client.quit();
    }

    async mExists(keys: string[]): Promise<number> {
        return this.client.exists(keys);
    }

    async mGet(keys: string[]): Promise<(string | null)[]> {
        return this.client.mget(keys);
    }

    async mSet(data: Record<string, string>): Promise<string> {
        return this.client.mset(data);
    }

    async get(key: string): Promise<string | null> {
        return this.client.get(key);
    }

    async set(
        key: string,
        value: string | boolean | number,
        expiry?: number
    ): Promise<string> {
        if (expiry) {
            return this.client.set(key, value, 'EX', expiry);
        }
        return this.client.set(key, value);
    }

    async del(key: string): Promise<number> {
        return this.client.del(key);
    }

    async getByPattern(pattern: string): Promise<string[]> {
        let cursor = 0;
        let results: string[] = [];
        do {
            // eslint-disable-next-line no-await-in-loop
            const result: any = await this.client.scan(
                cursor,
                'MATCH',
                pattern,
                'COUNT',
                100
            );
            if (result) {
                cursor = result.shift();
                results = results.concat(result[1]);
            }
        } while (cursor > 0);
        return results;
    }

    async flushAll(): Promise<string> {
        this.logger.info(`Flushing all records`);
        return this.client.flushall();
    }
}

export default (logger: Logger): Redis => new Redis(systemConfig.redis, logger);

import EventEmitter from 'events';
import CreateClient, { Redis as RedisClient, Result } from 'ioredis';
import IoRedisMock from 'ioredis-mock';

import systemConfig, { RedisConfig } from '../utils/config';
import { Logger } from '../utils/logger';

export class Redis extends EventEmitter {
    public readonly client!: RedisClient;

    private readonly logger:  Logger | undefined;

    constructor(redis: Redis);

    constructor(config: RedisConfig, logger: Logger);

    constructor(config: RedisConfig | Redis, logger?: Logger) {
        super();
        if (config instanceof Redis) {
            this.client = config.client.duplicate();
            this.logger = config.logger;
            return;
        }
        this.logger = logger;
        const redisConfig: {
            lazyConnect?: boolean;
            password?: string;
            port?: number;
            url?: string;
            prefix?: string;
            host?: string;
            name?: string;
            maxRetriesPerRequest?: number | null;
            enableReadyCheck?: boolean;
            username?: string
        } = { ...config };
        delete redisConfig.url;
        delete redisConfig.prefix;

        this.client = systemConfig.app.isTest
            ? new IoRedisMock()
            : new CreateClient(redisConfig);
        this.client.on('error', (err: Error) =>
            { this.logger?.error({ message: 'Redis Client Error', err }); }
        );
        this.client.on('ready', () => {
            this.logger?.debug(`Redis connected`);
            this.emit('ready');
        });
    }

    duplicate(): Redis {
        return new Redis(this);
    }

    async disconnect(): Promise<void> {
        await this.client.quit();
    }

    async publish(channel: string, message: string): Promise<number> {
        return this.client.publish(channel, message);
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
        value: string | Buffer | number,
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

            // eslint-disable-next-line
            const result: Result<any, any> = await this.client.scan(
                cursor,
                'MATCH',
                pattern,
                'COUNT',
                100
            );
            if (result) {
                // eslint-disable-next-line
                cursor = result.shift();
                // eslint-disable-next-line
                results = results.concat(result[1]);
            }
        } while (cursor > 0);
        return results;
    }

    async flushAll(): Promise<string> {
        this.logger?.info(`Flushing all records`);
        return this.client.flushall();
    }
}

export default (logger: Logger): Redis => new Redis(systemConfig.redis, logger);

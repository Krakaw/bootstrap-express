import dotenv from 'dotenv';

import parseBoolean from './parseBoolean';

dotenv.config();

export interface RedisConfig {
    host?: string;
    port?: number;
    password?: string;
    username?: string;
    name?: string;
    maxRetriesPerRequest?: number | null;
    enableReadyCheck?: boolean;
    prefix?: string;
    lazyConnect?: boolean;
}

export function getRedisConfigFromEnv(env: never, prefix: ''): RedisConfig {
    const toString = (v: string) => v;
    const toInt = (v: string) => parseInt(v, 10);
    const redisKeys: Record<
        string,
        {
            convert: (v: any) => any;
            key: string;
        }
    > = {
        REDIS_HOST: { convert: toString, key: 'host' },
        REDIS_PORT: { convert: toInt, key: 'port' },
        REDIS_PASSWORD: { convert: toString, key: 'password' },
        REDIS_DB: { convert: toInt, key: 'db' },
        REDIS_LAZY_CONNECT: { convert: parseBoolean, key: 'lazyConnect' }
    };
    const result = { prefix } as RedisConfig;
    Object.keys(redisKeys).forEach((key: string) => {
        const converter = redisKeys[key];
        const envKey = `${prefix}${key}`;
        if (env[envKey]) {
            result[converter.key as keyof RedisConfig] = converter.convert(
                env[envKey]
            );
        }
    });

    return result;
}

const env = { ...process.env };
export default {
    app: {
        name: env.NAME || 'server',
        isTest: parseBoolean(env.IS_TEST || false)
    },
    auth: {
        adminToken: env.AUTH_ADMIN_TOKEN,
        adminTokenHeader: env.AUTH_ADMIN_TOKEN_HEADER || 'x-admin-token'
    },
    db: {
        username: env.POSTGRES_USER,
        password: env.POSTGRES_PASSWORD,
        database: env.POSTGRES_DB || 'database',
        host: env.POSTGRES_HOST || '127.0.0.1',
        port: parseInt(env.POSTGRES_PORT || '5432', 10)
    },
    log: {
        level: env.LOG_LEVEL || 'debug',
        target: env.LOG_TARGET || 'pino/file'
    },
    queue: {
        // Rabbit queue url
        rabbitUrl: env.RABBITMQ_URL ?? '',
        // Rabbit Queue Name
        queueName: env.RABBITMQ_QUEUE_NAME || 'process-queue',
        // Rabbit Exchange Details
        exchange: {
            // Rabbit Exchange Name
            name: env.RABBITMQ_EXCHANGE_NAME || 'process-exchange',
            // Rabbit Exchange Type
            type: env.RABBITMQ_EXCHANGE_TYPE || 'fanout',
            // Rabbit Exchange Options
            options: {
                // Rabbit Exchange Durable
                durable: parseBoolean(env.RABBITMQ_EXCHANGE_DURABLE || true),
                // Rabbit Exchange Auto Delete
                autoDelete: parseBoolean(
                    env.RABBITMQ_EXCHANGE_AUTO_DELETE || false
                )
            }
        },
        // The max jobs to pull per worker
        maxRunningJobs: parseInt(env.RABBITMQ_MAX_RUNNING_JOBS || '1', 10),
        // Maximum number of retries for a job
        workerRetryMax: parseInt(env.RABBITMQ_WORKER_RETRY_MAX || '1', 10),
        // Retry strategy
        workerRetryStrategy: env.RABBITMQ_WORKER_RETRY_STRATEGY || 'exponential'
    },
    redis: getRedisConfigFromEnv(env as never, ''),
    server: {
        host: env.HOST || '0.0.0.0',
        port: parseInt(env.PORT || '3000', 10),
        jwt: {
            accessTokenSecret: env.JWT_ACCESS_TOKEN_SECRET || 'secret',
            accessTokenExpiresIn: env.JWT_ACCESS_TOKEN_EXPIRES_IN || '15m',
            refreshTokenSecret: env.JWT_REFRESH_TOKEN_SECRET || 'secret',
            refreshTokenExpiresIn: env.JWT_REFRESH_TOKEN_EXPIRES_IN || '30d'
        }
    }
};

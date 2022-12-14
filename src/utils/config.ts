import dotenv from 'dotenv';

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
        REDIS_DB: { convert: toInt, key: 'db' }
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
        name: env.NAME || 'server'
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
        rabbitUrl: env.QUEUE_URL || 'amqp://localhost:5672',
        // Rabbit Queue Name
        queueName: env.QUEUE_NAME || 'process-queue',
        // The max jobs to pull per worker
        maxRunningJobs: parseInt(env.MAX_RUNNING_JOBS || '1', 10),
        // Maximum number of retries for a job
        workerRetryMax: parseInt(env.WORKER_RETRY_MAX || '1', 10)
    },
    redis: getRedisConfigFromEnv(env as never, ''),
    server: {
        host: env.HOST || '0.0.0.0',
        port: parseInt(env.PORT || '3000', 10)
    }
};

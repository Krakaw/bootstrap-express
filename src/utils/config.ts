import dotenv from 'dotenv';

dotenv.config();

const env = { ...process.env };
export default {
    server: {
        host: env.HOST || '0.0.0.0',
        port: parseInt(env.PORT || '3000', 10)
    },
    log: {
        level: env.LOG_LEVEL || 'debug',
        target: env.LOG_TARGET || 'pino/file'
    }
};

import dotenv from 'dotenv';

dotenv.config();

const env = { ...process.env };
export default {
    server: {
        host: env.HOST || '0.0.0.0',
        port: parseInt(env.PORT || '3000', 10)
    }
};

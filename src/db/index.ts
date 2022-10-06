import { DataSource } from 'typeorm';
import config from '~/utils/config';

// Import Migrations

// Import Entities

export default new DataSource({
    type: 'postgres',
    host: config.db.host,
    port: config.db.port,
    username: config.db.username,
    password: config.db.password,
    database: config.db.database,
    synchronize: false,
    logging: false,
    entities: [],
    subscribers: [],
    migrations: []
});

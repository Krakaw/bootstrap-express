import { DataType, newDb } from 'pg-mem';
import { DataSource, DataSourceOptions } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

// import initPgBoss from '../test/db/initPgBoss';
import { Queues } from '../types/services';
import config from '../utils/config';
import { generateUuid } from '../utils/uuid';
import Model from './models/model';

export class DataSourceWithRepositories extends DataSource {
    public insertQueues(queues: Queues): void {
        this.subscribers.forEach((subscriber) => {
            if ((subscriber as any).setQueues) {
                (subscriber as any).setQueues(queues);
            }
        });
    }
}
const options: DataSourceOptions = {
    type: 'postgres',
    host: config.db.host,
    port: config.db.port,
    username: config.db.username,
    password: config.db.password,
    database: config.db.database,
    synchronize: false,
    logging: false,
    entities: [Model],
    subscribers: [],
    migrations: [],
    namingStrategy: new SnakeNamingStrategy()
};

export default function initDb(): DataSourceWithRepositories {
    return new DataSourceWithRepositories(options);
}

export async function initTestDb(): Promise<DataSourceWithRepositories> {
    const iMemoryDb = newDb({
        autoCreateForeignKeyIndices: true
    });
    iMemoryDb.public.registerFunction({
        name: 'version',
        args: [],
        implementation: () => '9.6.0'
    });
    iMemoryDb.public.registerFunction({
        name: 'current_database',
        args: [],
        implementation: () => options.database
    });
    iMemoryDb.public.registerFunction({
        name: 'uuid_generate_v4',
        returns: DataType.uuid,
        implementation: generateUuid,
        impure: true
    });

    // Re-enable for pg-boss testing
    // initPgBoss(iMemoryDb);
    const typeormDataSource = iMemoryDb.adapters.createTypeormDataSource({
        ...options
        // logging: true
    });
    typeormDataSource.insertQueues = function (queues: Queues): void {
        this.subscribers.forEach((subscriber) => {
            if ((subscriber as any).setQueues) {
                (subscriber as any).setQueues(queues);
            }
        });
    };

    await typeormDataSource.initialize();
    await typeormDataSource.synchronize();
    return typeormDataSource;
}

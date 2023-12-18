import PgBoss, { Db } from 'pg-boss';

import { CoreServices } from '../../types/services';
import { Logger } from '../../utils/logger';

export default class PgBossConnection {
    public connection!: PgBoss;

    public readonly coreServices: CoreServices;

    public readonly logger: Logger;

    constructor(coreServices: CoreServices) {
        this.coreServices = coreServices;
        const { dataSource, logger } = this.coreServices;
        this.logger = logger;
        const db = {
            executeSql: async (sql: string, params: any[]) => {
                const queryResult = await dataSource.query(sql, params);
                return {
                    rows: queryResult,
                    rowCount: queryResult.length
                };
            }
        } as Db;
        this.connection = new PgBoss({
            db
        });
    }

    async disconnect(): Promise<void> {
        await this.connection.stop({
            graceful: true,
            timeout: 20000
        });
    }
}

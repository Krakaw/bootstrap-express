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
        // const db = {
        //     onComplete: false,
        //     executeSql: async (sql: string, params: any[]) => {
        //         const queryResult = await dataSource.query(sql, params);
        //         return {
        //             rows: queryResult || [],
        //             rowCount: queryResult?.length || 0
        //         };
        //     }
        // } as Db;
        // this.connection = new PgBoss({
        //     db
        // });
        //
        this.connection = new PgBoss(
            `postgres://postgres:password@localhost/database`
        );
    }

    async disconnect(): Promise<void> {
        await this.connection.stop({
            graceful: true,
            timeout: 20000
        });
    }
}

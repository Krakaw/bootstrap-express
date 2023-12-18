import { DataType, IMemoryDb } from 'pg-mem';

import { generateUuid } from '../../utils/uuid';

export default function initPgBoss(iMemoryDb: IMemoryDb): void {
    /// PgBoss requirements for pg-mem
    iMemoryDb.createSchema('pgboss');
    function toRegclass(db, tableName) {
        try {
            // Attempt to get the table. If it doesn't exist, an error will be thrown
            return db.getTable(tableName); // Simulating OID by returning the table name
        } catch (error) {
            return 0; // Table does not exist
        }
    }

    iMemoryDb.public.registerFunction({
        name: 'gen_random_uuid',
        returns: DataType.uuid,
        implementation: generateUuid,
        impure: true
    });
    iMemoryDb.public.registerFunction({
        name: 'to_regclass',
        args: [DataType.text],
        returns: DataType.text, // Assuming text return type as we're returning table name
        implementation: (tableName) => toRegclass(iMemoryDb.public, tableName),
        impure: true // Marked as impure since it depends on the current database state
    });

    iMemoryDb.public.registerFunction({
        name: 'md5',
        args: [DataType.text],
        returns: DataType.text,
        implementation: (x) => x,
        impure: true
    });

    iMemoryDb.public.registerFunction({
        name: 'pg_advisory_xact_lock',
        args: [DataType.text],
        implementation: () => 1,
        impure: true
    });
    iMemoryDb.public.registerFunction({
        name: 'right',
        args: [DataType.text, DataType.integer],
        returns: DataType.text,
        allowNullArguments: true,
        implementation: (str, length) =>
            length < 0 ? null : str.substring(str.length - length),
        impure: false
    });

    //
    const oldQuery = iMemoryDb.public.query;
    // eslint-disable-next-line no-param-reassign
    iMemoryDb.public.query = (sql) => {
        if (typeof sql === 'string') {
            const newSql = sql
                .replace(`SET LOCAL statement_timeout = '30s';`, 'SELECT 1;')
                .replace(/::bit\(\d+\)/g, '')
                .replace(
                    /CREATE TABLE pgboss.archive\s*\(\s*LIKE pgboss.job\s*\);/gi,
                    `
            CREATE TABLE pgboss.job (
                id uuid primary key not null default gen_random_uuid(),
                name text not null,
                priority integer not null default(0),
                data jsonb,
                state pgboss.job_state not null default('created'),
                retryLimit integer not null default(0),
                retryCount integer not null default(0),
                retryDelay integer not null default(0),
                retryBackoff boolean not null default false,
                startAfter timestamp with time zone not null default now(),
                startedOn timestamp with time zone,
                singletonKey text,
                singletonOn timestamp without time zone,
                expireIn interval not null default interval '15 minutes',
                createdOn timestamp with time zone not null default now(),
                completedOn timestamp with time zone,
                keepUntil timestamp with time zone NOT NULL default now() + interval '14 days',
                on_complete boolean not null default false,
                output jsonb
        );
`
                );
            return oldQuery.apply(iMemoryDb.public, [newSql]);
        }
        return oldQuery.apply(iMemoryDb.public, [sql]);
    };
    // End PgBoss requirements
}

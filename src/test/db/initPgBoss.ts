import PgBoss from 'pg-boss';
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
        implementation: (str, length) => {
            if (str === null) return '';
            return length < 0 ? '' : str.substring(str.length - length);
        },
        impure: false
    });

    iMemoryDb.public.registerFunction({
        name: 'epoch',
        implementation: () => Math.floor(Date.now() / 1000),
        returns: DataType.integer
    });
    iMemoryDb.public.registerFunction({
        name: 'floor',
        implementation: (val: number) => Math.floor(val || 0),
        args: [DataType.float],
        returns: DataType.integer
    });
    iMemoryDb.public.registerFunction({
        name: 'date_part',
        implementation: (field: string, timestamp: string) => {
            const dt = new Date(timestamp);
            switch (field) {
                case 'epoch':
                    return dt.getTime() / 1000;
                case 'year':
                    return dt.getUTCFullYear();
                case 'month':
                    return dt.getUTCMonth() + 1;
                case 'day':
                    return dt.getUTCDate();
                case 'hour':
                    return dt.getUTCHours();
                case 'minute':
                    return dt.getUTCMinutes();
                case 'second':
                    return dt.getUTCSeconds();
                default:
                    throw new Error(`Unsupported field: ${field}`);
            }
        },
        returns: DataType.float,
        args: [DataType.text, DataType.timestamptz]
    });
    iMemoryDb.public.registerOperator({
        operator: '*',
        left: DataType.interval,
        right: DataType.float,
        implementation: (interval: string, factor: number) => {
            const parts = interval.match(/(\d+)\s*(\w+)/);
            if (!parts) throw new Error('Invalid interval format');
            const value = parseFloat(parts[1]);
            const unit = parts[2];
            const newValue = value * factor;
            return `${newValue} ${unit}`;
        },
        returns: DataType.interval
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
                CREATE TABLE pgboss.archive (
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
                )
                .replace(/text_pattern_ops/g, '')
                .replace('version::int-20', 'version - 20')
                .replace(
                    /'epoch'::timestamp/gi,
                    `'${new Date().toISOString()}'::timestamp`
                )
                .replace(
                    'null::text as startAfterValue',
                    `'${new Date().toISOString()}'::text as startAfterValue`
                );
            return oldQuery.apply(iMemoryDb.public, [newSql]);
        }
        return oldQuery.apply(iMemoryDb.public, [sql]);
    };
    iMemoryDb.public.query(PgBoss.getConstructionPlans());
    iMemoryDb.public.query(PgBoss.getMigrationPlans());

    // End PgBoss requirements
}

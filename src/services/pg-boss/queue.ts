import PgBoss from 'pg-boss';
import { Logger } from 'pino';

import { JobData, ProcessJob } from '../../types/queue';
import { CoreServices } from '../../types/services';
import Kill from '../../utils/kill';
import PgBossConnection from './index';

export interface PgBossQueueProps {
    connection: PgBossConnection;
    queueName: string;
}
export default class PgBossQueue<DataType> {
    private readonly logger: Logger;

    private readonly queueName: string;

    private readonly kill: Kill;

    private readonly connection: PgBossConnection;

    private readonly pgBoss: PgBoss;

    constructor(
        { connection, queueName }: PgBossQueueProps,
        { logger, kill }: CoreServices
    ) {
        this.connection = connection;
        this.pgBoss = connection.connection;
        this.logger = logger;
        this.kill = kill;
        this.queueName = queueName;
    }

    async initQueue(): Promise<void> {
        const errorHandler = (err: Error) => {
            this.logger.error({
                msg: `PG Boss channel error on queue ${this.queueName}`,
                err
            });
            // TODO: perform recovery or kill the app
            process.exit(1);
        };
        this.pgBoss.on('error', errorHandler);
        await this.pgBoss.start();

        this.kill.on('kill', async () => {
            this.logger.info(`Closing PgBoss queue for ${this.queueName}.`);
            try {
                await this.pgBoss.stop({ graceful: true });
            } catch (err) {
                this.logger.error(err, 'Unable to close PgBoss queue.');
            }
        });
    }

    async addJob(
        data: JobData<DataType>,
        priority?: number,
        retryLimit?: number,
        singletonKey?: string
    ): Promise<boolean> {
        const jobId = await this.pgBoss.send(this.queueName, data, {
            // TODO: Change addJob to use SendOptions directly
            priority,
            retryLimit,
            singletonKey
        });
        this.logger.debug(`Added job ${jobId} to ${this.queueName} queue`);
        return true;
    }

    async process(processJob: ProcessJob<DataType>): Promise<void> {
        this.kill.on('kill', async () => {
            this.logger.info(
                `Closing PgBoss queue processor for ${this.queueName}.`
            );
            try {
                await this.pgBoss.stop({ graceful: true, timeout: 20000 });
            } catch (err) {
                this.logger.error(err, 'Unable to close PgBoss queue.');
                process.exit(1);
            }
        });
        await this.pgBoss.work(this.queueName, processJob);
    }
}

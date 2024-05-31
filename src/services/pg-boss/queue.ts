import PgBoss from 'pg-boss';
import { Logger } from 'pino';

import { JobData } from '../../types/queue';
import { CoreServices, Services } from '../../types/services';
import Kill from '../../utils/kill';
import PgBossConnection from './index';

export interface PgBossQueueProps {
    connection: PgBossConnection;
    queueName: string;
}
export default abstract class PgBossQueue<DataType> {
    protected readonly logger!: Logger;

    private readonly queueName: string;

    private readonly kill: Kill;

    private readonly connection: PgBossConnection;

    private readonly pgBoss: PgBoss;

    protected services!: Services;

    constructor(
        { connection, queueName }: PgBossQueueProps,
        coreServices: CoreServices
    ) {
        const { logger, kill } = coreServices;
        this.connection = connection;
        this.pgBoss = connection.connection;
        this.logger = logger;
        this.kill = kill;
        this.queueName = queueName;
    }

    async initQueue(services: Services): Promise<void> {
        this.services = services;
        const errorHandler = (err: Error) => {
            this.logger.error({
                msg: `PG Boss channel error on queue ${this.queueName}`,
                err
            });
            // TODO: perform recovery or kill the app
            process.exit(1);
        };
        this.pgBoss.on('error', errorHandler);
        this.kill.on('kill', async () => {
            this.logger.info(`Closing PgBoss queue for ${this.queueName}.`);
            try {
                await this.pgBoss.stop({ graceful: true });
            } catch (err) {
                this.logger.error(err, 'Unable to close PgBoss queue.');
            }
        });
        await this.pgBoss.start();
    }

    async addJob(
        data: JobData<DataType>,
        sendOptions: PgBoss.SendOptions = {
            startAfter: '0 seconds'
        }
    ): Promise<string | null> {
        const jobId = await this.pgBoss.send(this.queueName, data, sendOptions);
        this.logger.debug(`Added job ${jobId} to ${this.queueName} queue`);
        return jobId;
    }

    async process(): Promise<void> {
        this.kill.on('kill', async () => {
            this.logger.info(
                `Closing PgBoss queue processor for ${this.queueName}.`
            );
            try {
                await this.pgBoss.stop({
                    destroy: true,
                    graceful: true,
                    timeout: 2000
                });
            } catch (err) {
                this.logger.error(err, 'Unable to close PgBoss queue.');
                process.exit(1);
            }
        });
        await this.pgBoss.work(
            this.queueName,
            { newJobCheckInterval: 100 },
            this.worker.bind(this)
        );
    }

    abstract worker(job: JobData<DataType>): Promise<boolean>;
}

export interface IQueueConstructor<DataType> {
    new (
        pgBossQueueProps: PgBossQueueProps,
        coreServices: CoreServices
    ): PgBossQueue<DataType>;
}

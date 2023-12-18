import PgBossQueue from '../services/pg-boss/queue';
import { JobData, ProcessJob } from '../types/queue';
import { Services } from '../types/services';

export interface QueueProcessor<DataType> {
    processJob: ProcessJob<DataType>;
}

export default abstract class Queue<DataType>
    implements QueueProcessor<DataType>
{
    protected services!: Services;

    private pgBossQueue!: PgBossQueue<DataType>;

    private queueName!: string;

    constructor(queueName: string) {
        this.queueName = queueName;
    }

    async init(services: Services): Promise<void> {
        this.services = services;
        this.pgBossQueue = new PgBossQueue<DataType>(
            { connection: services.pgBoss, queueName: this.queueName },
            services
        );
        await this.pgBossQueue.initQueue();
    }

    async addJob(
        data: DataType,
        id: string,
        priority = 0
    ): Promise<string | null> {
        return this.pgBossQueue.addJob(
            {
                id,
                data
            },
            priority
        );
    }

    async startQueue(): Promise<void> {
        this.services.logger.debug(`⚡️ Starting ${this.queueName} processor`);
        // TODO: Add tracer
        await this.pgBossQueue.process(this.processJob.bind(this));
    }

    async processJob(job: JobData<DataType>): Promise<boolean> {
        try {
            await this.process(job);
        } catch (e) {
            this.services.logger.error(e);
        }
        return true;
    }

    abstract process(job: JobData<DataType>): Promise<boolean>;
}

export interface IQueueConstructor<DataType> {
    new (queueName: string): Queue<DataType>;
}

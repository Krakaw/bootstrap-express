import { Options } from 'amqplib';

import PgBossQueue, { PgBossQueueProps } from '../services/pg-boss/queue';
import RabbitQueue, {
    JobData,
    ProcessJob,
    RabbitExchange
} from '../services/rabbit/queue';
import { Services } from '../types/services';
import config from '../utils/config';

import AssertQueue = Options.AssertQueue;

export interface QueueParams {
    queueName: string;
    onComplete: () => void;
}

export interface QueueProcessor<DataType> {
    processJob: ProcessJob<DataType>;
}

export default abstract class Queue<DataType>
    implements QueueProcessor<DataType>
{
    protected services!: Services;

    private pgBossQueue!: PgBossQueue<DataType>;

    private queueName!: string;

    constructor(services: Services) {
        this.services = services;
    }

    async init(
        queueProps: PgBossQueueProps & QueueParams,
        services: Services
    ): Promise<void> {
        const { queueName } = queueProps;
        this.queueName = queueName;
        this.pgBossQueue = new PgBossQueue<DataType>(queueProps, services);
        if (config.queue.rabbitUrl) {
            await this.pgBossQueue.initQueue();
        }
    }

    async addJob(data: DataType, id: string, priority = 0): Promise<boolean> {
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

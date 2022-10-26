import { Logger } from 'pino';
import { DataSource } from 'typeorm';

import Rabbit, { JobData, ProcessJob } from '../services/rabbit';
import Redis from '../services/redis';

export interface QueueParams {
    name: string;
    onComplete: () => void;
}

export interface QueueProcessor<DataType> {
    processJob: ProcessJob<DataType>;
}
export default abstract class Queue<DataType>
    implements QueueProcessor<DataType>
{
    protected readonly logger: Logger;

    protected readonly appDataSource: DataSource;

    protected readonly redis: Redis;

    private readonly params: QueueParams;

    private rabbit!: Rabbit<DataType>;

    constructor(
        params: QueueParams,
        {
            logger,
            appDataSource,
            redis
        }: { logger: Logger; appDataSource: DataSource; redis: Redis }
    ) {
        this.params = params;
        this.logger = logger;
        this.redis = redis;
        this.appDataSource = appDataSource;
    }

    async init(): Promise<void> {
        this.rabbit = await Rabbit.instance(this.params.name, this.logger);
    }

    addJob(data: DataType, id: string, priority = 0): boolean {
        return this.rabbit.addJob({ id, data }, priority);
    }

    async startQueue(): Promise<void> {
        this.logger.debug('Starting queue processor');
        // TODO: Add tracer
        await this.rabbit.process(this.processJob.bind(this));
    }

    abstract processJob(data: JobData<DataType>): Promise<boolean>;
}

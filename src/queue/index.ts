import { Options } from 'amqplib';

import RabbitQueue, {
    JobData,
    ProcessJob,
    RabbitExchange
} from '../services/rabbit/queue';
import { Services } from '../types/services';
import config from '../utils/config';

import AssertQueue = Options.AssertQueue;

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
    protected services!: Services;

    private readonly params: QueueParams;

    private readonly exchange: RabbitExchange;

    private readonly queueOptions: AssertQueue;

    private readonly routingKey?: string;

    private rabbit!: RabbitQueue<DataType>;

    constructor(
        params: QueueParams,
        exchange?: RabbitExchange,
        queueOptions?: AssertQueue,
        routingKey?: string
    ) {
        this.params = params;
        this.exchange = exchange || config.queue.exchange;
        this.queueOptions = queueOptions || {};
        this.routingKey = routingKey;
    }

    async init(services: Services): Promise<void> {
        this.services = services;

        this.rabbit = await new RabbitQueue<DataType>({
            connection: this.services.rabbit.connection,
            queueName: this.params.name,
            exchange: this.exchange,
            logger: this.services.logger,
            routingKey: this.routingKey,
            kill: this.services.kill
        });
        if (config.queue.rabbitUrl) {
            await this.rabbit.initQueue();
        }
    }

    addJob(data: DataType, id: string, priority = 0): boolean {
        return this.rabbit.addJob(
            {
                id,
                data
            },
            priority
        );
    }

    async startQueue(): Promise<void> {
        this.services.logger.debug(
            `⚡️ Starting ${this.params.name} processor`
        );
        // TODO: Add tracer
        await this.rabbit.process(this.processJob.bind(this));
    }

    async processJob(job: JobData<DataType>): Promise<boolean> {
        let throwError;
        const jobKey = `${this.params.name}_${job.id}`;
        try {
            if (await this.services.redis.client?.get(jobKey)) {
                this.services.logger.info(
                    `${jobKey} is currently being processed, aborting this job and acking.`
                );
                return false;
            }
            await this.services.redis.client?.set(jobKey, 1, 'EX', 60);
            this.services.logger.debug(`Starting job ${jobKey}`);
            await this.process(job);
        } catch (e) {
            this.services.logger.error(e);
            throwError = e;
        } finally {
            await this.services.redis.client?.del(jobKey);
        }
        if (throwError) {
            throw throwError;
        }
        return true;
    }

    abstract process(job: JobData<DataType>): Promise<boolean>;
}

export interface IQueueConstructor<DataType> {
    new (
        params: QueueParams,
        exchange?: RabbitExchange,
        queueOptions?: AssertQueue,
        routingKey?: string
    ): Queue<DataType>;
}

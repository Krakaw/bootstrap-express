import amqplib, { Channel, Connection, ConsumeMessage, Options } from 'amqplib';
import { Logger } from 'pino';

import config from '../../utils/config';
import Kill from '../../utils/kill';

import AssertQueue = Options.AssertQueue;

export interface JobData<DataType> {
    id: string;
    data: DataType;
}

export type ProcessJob<DataType> = (
    data: JobData<DataType>
) => Promise<boolean>;

export type ExchangeType =
    | 'direct'
    | 'topic'
    | 'headers'
    | 'fanout'
    | 'match'
    | string;
export interface ExchangeOptions {
    durable?: boolean | undefined;
    internal?: boolean | undefined;
    autoDelete?: boolean | undefined;
    alternateExchange?: string | undefined;
    arguments?: any;
}
export interface RabbitExchange {
    name: string;
    type?: ExchangeType;
    options?: ExchangeOptions;
}
export interface RabbitProps {
    connection: Connection;
    queueName: string;
    queueOptions?: amqplib.Options.AssertQueue;
    exchange: RabbitExchange;
    routingKey?: string;
    logger: Logger;
    kill: Kill;
}

export default class RabbitQueue<DataType> {
    private channel!: Channel;

    private msgsInFlight = 0; // how many messages are we currently processing (jobs in progress)

    private readonly connection: Connection;

    private readonly exchange!: RabbitExchange;

    private readonly queueOptions!: AssertQueue;

    private readonly queueName: string;

    private readonly routingKey?: string;

    private readonly logger: Logger;

    private readonly kill: Kill;

    constructor({
        connection,
        exchange,
        logger,
        queueName,
        queueOptions,
        routingKey,
        kill
    }: RabbitProps) {
        this.connection = connection;
        this.exchange = exchange;
        this.logger = logger;
        this.queueName = queueName;
        this.queueOptions = queueOptions || {};
        this.routingKey = routingKey;
        this.kill = kill;
    }

    async initQueue(): Promise<void> {
        this.channel = await this.connection.createChannel();

        const errorHandler = (err: Error) => {
            this.logger.error({
                msg: `AMQP channel error on queue ${this.queueName}`,
                err
            });
            // TODO: perform recovery or kill the app
            process.exit(1);
        };
        this.channel.on('error', errorHandler);

        const exchangeName = this.exchange.name;
        await this.channel.assertExchange(
            exchangeName,
            this.exchange.type || 'fanout',
            this.exchange.options
        );
        const defaultQueueOptions = {
            durable: true,
            arguments: {
                'x-max-priority': 10
            },
            ...this.queueOptions
        };
        if (!this.routingKey) {
            this.logger.debug(`Asserting queue ${this.queueName}`);
            await this.channel.assertQueue(this.queueName, defaultQueueOptions);
            await this.channel.bindQueue(this.queueName, exchangeName, '');
        } else {
            this.logger.debug(
                `Not asserting a queue, using routingKey ${this.routingKey} instead`
            );
        }

        this.kill.on('kill', async () => {
            this.logger.info(`Closing AMQP channel for ${this.queueName}.`);
            try {
                await this.channel.close();
            } catch (err) {
                this.logger.error(err, 'Unable to close AMQP channel.');
            }
        });
    }

    addJob(data: JobData<DataType>, priority = 0, retryCount = 0): boolean {
        let result;
        const options = {
            priority,
            messageId: data.id,
            headers: {
                'x-deduplication-header': data.id,
                'x-retry-count': retryCount
            }
        };
        if (this.routingKey) {
            result = this.channel.publish(
                this.exchange.name,
                this.routingKey,
                Buffer.from(JSON.stringify(data), 'utf8'),
                options
            );
            this.logger.debug(
                `Published job ${data.id} to ${this.routingKey}: ${result}`
            );
        } else {
            result = this.channel.sendToQueue(
                this.queueName,
                Buffer.from(JSON.stringify(data), 'utf8'),
                options
            );
            this.logger.debug(
                `Added job ${data.id} to ${this.queueName} queue: ${result}`
            );
        }

        return result;
    }

    async process(processJob: ProcessJob<DataType>): Promise<void> {
        await this.channel.prefetch(config.queue.maxRunningJobs);
        const subscription = await this.channel.consume(
            this.queueName,
            async (msg: ConsumeMessage | null) => {
                if (!msg) {
                    return;
                }
                const data = JSON.parse(msg?.content.toString('utf8') || '{}');
                if (!data.id) {
                    this.logger.error(
                        'Got a job without an id, aborting',
                        msg?.content.toString('utf8')
                    );
                    this.channel.ack(msg);
                    return;
                }
                this.msgsInFlight += 1;
                try {
                    await processJob(data);
                    this.channel.ack(msg);
                } catch (e) {
                    const retryCount =
                        +msg.properties.headers['x-retry-count'] + 1;
                    this.channel.reject(msg, false);
                    if (retryCount < config.queue.workerRetryMax) {
                        this.addJob(data, msg.properties.priority, retryCount);
                    } else {
                        this.logger.error(
                            `Message has reached its max retry count of ${config.queue.workerRetryMax}`
                        );
                    }
                } finally {
                    this.msgsInFlight -= 1;
                }
            },
            {}
        );

        this.kill.on('kill', async () => {
            this.logger.info(
                `Canceling AMQP subscription for ${this.queueName}.`
            );
            try {
                await this.channel.cancel(subscription.consumerTag);
            } catch (err) {
                this.logger.error(err, 'Unable to cancel AMQP subscription.');
            }
            let count = 0; // don't wait forever.
            setInterval(() => {
                if (this.msgsInFlight === 0 || count < 20) {
                    process.exit(0);
                }
                this.logger.info(
                    `Shutdown in process. ${this.msgsInFlight} pending jobs.`
                );
                count += 1;
            }, 1000);
        });
        return new Promise(() => {
            // Empty promise to keep the process alive
        });
    }
}

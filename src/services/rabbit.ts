import amqplib, { Channel, Connection, ConsumeMessage } from 'amqplib';
import { Logger } from 'pino';
import config from '../utils/config.js';

let staticConnection: Connection;

export interface JobData<DataType> {
    id: string;
    data: DataType;
}

export type ProcessJob<DataType> = (
    data: JobData<DataType>
) => Promise<boolean>;

export interface RabbitProps {
    connection: Connection;
    queueName: string;
    logger: Logger;
}

export default class Rabbit<DataType> {
    private channel!: Channel;

    private msgsInFlight = 0; // how many messages are we currently processing (jobs in progress)

    private readonly connection: Connection;

    private readonly queueName: string;

    private readonly logger: Logger;

    constructor({ connection, queueName, logger }: RabbitProps) {
        this.connection = connection;
        this.queueName = queueName;
        this.logger = logger;
    }

    async initQueue(): Promise<void> {
        this.channel = await this.connection.createChannel();

        const errorHandler = (err: Error) => {
            this.logger.error(
                err,
                `AMQP channel error on queue ${this.queueName}`
            );
            // TODO: perform recovery or kill the app
            process.exit(1);
        };
        this.channel.on('error', errorHandler);

        const exchangeName = `${this.queueName}_exchange`;
        await this.channel.assertExchange(exchangeName, 'fanout');
        await this.channel.assertQueue(this.queueName, {
            durable: true,
            arguments: {
                'x-message-deduplication': true,
                'x-max-priority': 10
            }
        });
        await this.channel.bindQueue(this.queueName, exchangeName, '');
    }

    addJob(data: JobData<DataType>, priority = 0, retryCount = 0): boolean {
        const result = this.channel.sendToQueue(
            this.queueName,
            Buffer.from(JSON.stringify(data), 'utf8'),
            {
                priority,
                messageId: data.id,
                headers: {
                    'x-deduplication-header': data.id,
                    'x-retry-count': retryCount
                }
            }
        );
        this.logger.debug(`Added job ${data.id} to queue: ${result}`);
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

        process.on('SIGTERM', async () => {
            this.logger.info('Received SIGTERM. Canceling AMQP subscription.');
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
    }

    public static async instance<T>(
        queueName: string,
        logger: Logger
    ): Promise<Rabbit<T>> {
        if (!staticConnection) {
            const errorHandler = (err: Error) => {
                logger.error(
                    err,
                    `AMQP connection error on queue ${queueName}`
                );
                // TODO: perform recovery or kill the app
                process.exit(1);
            };

            staticConnection = await amqplib.connect(config.queue.rabbitUrl, {
                clientProperties: { connection_name: process.env.HOSTNAME }
            });
            staticConnection.on('error', errorHandler);
        }
        const rabbit = new Rabbit({
            connection: staticConnection,
            queueName,
            logger
        });
        await rabbit.initQueue();
        return rabbit as Rabbit<T>;
    }
}

import amqplib, { Connection } from 'amqplib';
import mockAmqplib from 'mock-amqplib';

import config from '../../utils/config';
import { Logger } from '../../utils/logger';

export default class RabbitConnection {
    public connection!: Connection;

    public readonly logger: Logger;

    public connected = false;

    public requestDisconnect = false;

    constructor(logger: Logger) {
        this.logger = logger;
    }

    public async disconnect(): Promise<void> {
        this.requestDisconnect = true;
        if (this.connection) {
            await this.connection.close();
            this.connected = false;
        }
    }

    public async connect(): Promise<void> {
        this.logger.debug('Initializing RabbitMQ');
        const { rabbitUrl } = config.queue;
        const safeRabbitUrl = rabbitUrl.replace(/:[^@]+@/, ':***@');
        const errorHandler = async (err: Error) => {
            this.logger.error({
                msg: `AMQP connection error on connection ${safeRabbitUrl}`,
                err
            });
            this.connected = false;
            await this.connect();
        };
        if (this.connected) {
            this.logger.debug('Reusing RabbitMQ connection');
            return;
        }
        if (config.app.isTest) {
            amqplib.connect = mockAmqplib.connect;
        }
        this.connection = await amqplib.connect(rabbitUrl, {
            clientProperties: { connection_name: process.env.HOSTNAME }
        });
        this.logger.debug(`AMQP Connected to ${safeRabbitUrl}`);
        this.connection.on('error', errorHandler);
        this.connection.on('close', async (info) => {
            if (this.requestDisconnect) {
                return;
            }
            this.logger.warn({
                msg: `AMQP connection closing, attempting restart for ${safeRabbitUrl}`,
                info
            });
            this.connected = false;
            await this.connect();
        });
        this.connected = true;
    }
}

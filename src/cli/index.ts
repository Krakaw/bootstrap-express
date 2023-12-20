import { Arguments } from 'yargs';

import { version } from '../../package.json';
import initCron from '../cronjob';
import startProcessor from '../processor';
import startServer from '../server';
import initServices from '../services';
import logger from '../utils/logger';
import { Command, CommandQueue } from './commands';

export default async function init(argv: Arguments): Promise<void> {
    logger.debug(`Version: ${version}`);
    const services = await initServices();
    const { _ = ['server'] } = argv;
    const command = ((_.pop() as string) || '').toLowerCase()?.trim();
    switch (command) {
        case Command.Cron:
            await initCron(services);
            break;
        case Command.Queue:
            {
                const { name } = argv;
                switch (name) {
                    case CommandQueue.Example:
                        await services.queues.defaultQueueExample.startQueue();
                        break;
                    default:
                        logger.error(`Unknown queue: ${name}`);
                }
            }
            break;
        case Command.Server:
        default:
            await startServer(services);
    }
    services.kill.kill('SIGINT');
}

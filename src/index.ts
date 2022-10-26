import pino from 'pino';
import { Arguments } from 'yargs';
import yargs from 'yargs/yargs';
import startProcessor from '~/processor';
import startServer from '~/server';
import config from '~/utils/config';

import { version } from '../package.json';
import initializeCli from "./cli";

/** Set Up Logging */
const pinoConfig = {
    name: config.app.name,
    level: config.log.level,
    transport: {
        target: config.log.target
    }
};

const logger = pino(pinoConfig);

async function init(argv: Arguments) {
    logger.debug(`Version: ${version}`);
    const { _ = ['server'] } = argv;
    const command = ((_.pop() as string) || '').toLowerCase()?.trim();
    switch (command) {
        case 'process':
            await startProcessor({ logger });
            break;
        default:
            await startServer({ logger });
    }
}
const cliArgs: Arguments = initializeCli();
init(cliArgs).then(() => {
    logger.info('Completed');
    process.exit(0);
}).catch((e) => logger.error(e));

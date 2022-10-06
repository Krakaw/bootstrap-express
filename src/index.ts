import pino from 'pino';
import yargs from 'yargs/yargs';
import startProcessor from '~/processor';
import startServer from '~/server';
import config from '~/utils/config';

import { version } from '../package.json';

/** Set Up Logging */
const pinoConfig = {
    name: 'server',
    level: config.log.level,
    transport: {
        target: config.log.target
    }
};

const logger = pino(pinoConfig);

async function init(argv: any) {
    logger.debug(`Version: ${version}`);
    const command = (argv._.length ? argv._ : ['server'])
        .pop()
        .toLowerCase()
        .trim();
    switch (command) {
        case 'process':
            await startProcessor({ logger });
            break;
        default:
            await startServer({ logger });
    }
}
const { argv } = yargs(process.argv.slice(2))
    .command('server', 'Start the API server')
    .command('process', 'Start a process worker')
    .demandCommand(1, 1, 'Choose a command: server or process')
    .strict()
    .help('h');

init(argv).catch((e) => console.error(e));

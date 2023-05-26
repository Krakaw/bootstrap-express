import { Arguments } from 'yargs';

import init from './cli';
import argv from './cli/commands';
import logger from './utils/logger';

init(argv as Arguments)
    .then(() => {
        logger.info('Exiting cleanly');
    })
    .catch((error) => {
        logger.error('Exiting with error %s', error);
    });

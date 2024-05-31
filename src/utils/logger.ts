import pino from 'pino';

import config from './config';

/** Set Up Logging */
const pinoConfig = {
    name: config.app.name,
    level: config.log.level,
    useLevelLabels: true,
    transport: {
        target: config.log.target,
        options: {
            customColors: 'invalid:yellow',
            customLevels: 'invalid:25',
            useOnlyCustomProps: false
        }
    }
};

const logger = pino(pinoConfig);
export type Logger = pino.Logger;
export default logger;

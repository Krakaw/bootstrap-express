import pino from 'pino';

import config from './config';

const customLevels = {
    invalid: 25
};

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
    },
    customLevels
};

const logger = pino(pinoConfig);
export type Logger = pino.Logger<typeof pinoConfig>;
export default logger as Logger;

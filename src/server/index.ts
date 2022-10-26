import { Logger } from 'pino';

import config from '../utils/config';
import app from './app';

export default ({ logger }: { logger: Logger }): void => {
    app.listen(config.server.port, config.server.host, () => {
        logger.info(
            `⚡ listening on ${config.server.host}:${config.server.port}`
        );
    });
};

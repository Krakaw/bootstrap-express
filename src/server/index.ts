import { Logger } from 'pino';
import app from '~/server/app';
import config from '~/utils/config';

export default ({ logger }: { logger: Logger }): void => {
    app.listen(config.server.port, config.server.host, () => {
        logger.info(
            `⚡ listening on ${config.server.host}:${config.server.port}`
        );
    });
};

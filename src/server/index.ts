import { Services } from '../types/services';
import config from '../utils/config';
import initApp from './app';

export default (services: Services): void => {
    const { logger } = services;
    const app = initApp(services);
    app.listen(config.server.port, config.server.host, () => {
        logger.info(
            `⚡ listening on ${config.server.host}:${config.server.port}`
        );
    });
};

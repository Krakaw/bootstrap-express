import { Services } from '../types/services';
import config from '../utils/config';
import initApp from './app';

export default (services: Services): Promise<void> => {
    const { logger, kill } = services;
    const app = initApp(services);
    const server = app.listen(config.server.port, config.server.host, () => {
        logger.info(
            `⚡ listening on ${config.server.host}:${config.server.port}`
        );
        kill.on('kill', () => {
            server.close();
        });
    });
    return new Promise((resolve) => {
        server.on('close', resolve);
    });
};

import { Services } from '../../src/types/services';

export {};

declare global {
    namespace Express {
        interface Request {
            services: Services;
        }
    }
}

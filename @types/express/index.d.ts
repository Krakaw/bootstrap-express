import { JwtAccessToken } from '../../src/types/jwt';
import { Services } from '../../src/types/services';

export {};

declare global {
    namespace Express {
        interface Request {
            services: Services;
            jwt: JwtAccessToken;
        }
    }
}

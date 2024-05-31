import { PrimaryId } from './id';
import { UserRoles } from './user';

export enum JwtScope {
    Access = 'access',
    Refresh = 'refresh'
}
export interface JwtAccessToken {
    id: PrimaryId;
    role?: UserRoles;
    scope: JwtScope;
}

export interface JwtRefreshToken {
    id: PrimaryId;
    scope: JwtScope;
}

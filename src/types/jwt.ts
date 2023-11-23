import { PrimaryId } from './id';

export enum JwtScope {
    ACCESS = 'access',
    REFRESH = 'refresh'
}
export interface JwtAccessToken {
    id: PrimaryId;
    role?: string;
    scope: JwtScope;
}

export interface JwtRefreshToken {
    id: PrimaryId;
    scope: JwtScope;
}

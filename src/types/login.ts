export enum Providers {
    Local = 'local',
    Twitter = 'twitter'
}

export interface ProviderMetadata {
    local?: {
        password: string;
        salt: string;
    };
    twitter?: {
        token: string;
        tokenSecret: string;
        profile: {
            id: string;
            username: string;
            displayName: string;
            photos: Array<{
                value: string;
            }>;
        };
    };
}

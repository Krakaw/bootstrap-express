export enum CustomCronType {}

export interface CustomCronMetadata {
    ids?: string[];
}

export class CCustomCronMetadata implements CustomCronMetadata {
    ids?: string[];
}

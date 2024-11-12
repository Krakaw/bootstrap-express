export enum CustomCronType {
    Other = 'other'
}

export interface CustomCronMetadata {
    ids?: string[];
}

export class CCustomCronMetadata implements CustomCronMetadata {
    ids?: string[];
}

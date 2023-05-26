export type BooleanOptions =
    | 'true'
    | 'True'
    | 'TRUE'
    | 'false'
    | 'False'
    | 'FALSE'
    | '0'
    | '1'
    | number
    | string
    | boolean;

export default function parseBoolean(value: BooleanOptions): boolean {
    if (typeof value === 'boolean') {
        return value;
    }
    if (typeof value === 'string') {
        return value.toLowerCase() === 'true';
    }
    return !!value;
}

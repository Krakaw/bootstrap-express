export interface JobData<DataType> {
    id: string;
    data: DataType;
}

export type ProcessJob<DataType> = (
    data: JobData<DataType>
) => Promise<boolean>;

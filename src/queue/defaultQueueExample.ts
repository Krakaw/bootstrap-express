import { JobData } from '../types/queue';
import Queue from './index';

export interface ProcessJobData {
    data: string;
}

export default class DefaultQueueExample extends Queue<ProcessJobData> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async process(_job: JobData<ProcessJobData>): Promise<boolean> {
        return true;
    }
}

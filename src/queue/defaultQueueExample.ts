import { JobData } from '../services/rabbit/queue';
import Queue from './index';

export interface ProcessJobData {
    data: string;
}

export default class DefaultQueueExample extends Queue<ProcessJobData> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    process(_job: JobData<ProcessJobData>): Promise<boolean> {
        return Promise.resolve(false);
    }
}

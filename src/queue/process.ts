import { JobData } from '../services/rabbit/queue';
import Queue from './index';

export interface ProcessJobData {
    data: string;
}

export default class ProcessQueue extends Queue<ProcessJobData> {
    process(job: JobData<ProcessJobData>): Promise<boolean> {
        return Promise.resolve(false);
    }
}

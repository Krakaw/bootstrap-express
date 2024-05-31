import PgBossQueue from '../services/pg-boss/queue';
import { JobData } from '../types/queue';

export interface ProcessJobData {
    value: string;
}

export default class DefaultQueueExample extends PgBossQueue<ProcessJobData> {
    async worker(_job: JobData<ProcessJobData>): Promise<boolean> {
        this.logger.info('Processing job', _job);
        return true;
    }
}

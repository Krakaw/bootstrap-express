import Queue from '~/queue/index';
import { JobData } from '~/services/rabbit';

export interface ProcessJobData {
    data: string;
}

export default class ProcessQueue extends Queue<ProcessJobData> {
    async processJob(job: JobData<ProcessJobData>): Promise<boolean> {
        let throwError;
        try {
            const jobKey = `jobs_${job.id}`;
            if (await this.redis.get(jobKey)) {
                this.logger.info(
                    `${job.id} is currently being processed, aborting this job and acking.`
                );
                return false;
            }
            await this.redis.set(jobKey, true, 60);
            const { ...values } = job.data;
            this.logger.debug(`Starting job ${job.id} ${values}`);
            // TODO: Execute the job
        } catch (e) {
            this.logger.error(e);
            throwError = e;
        } finally {
            await this.redis.del(job.id);
        }
        if (throwError) {
            throw throwError;
        }
        return true;
    }
}

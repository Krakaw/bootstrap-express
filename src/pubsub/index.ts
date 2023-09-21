import EventEmitter from 'events';

import { Redis } from '../services/redis';
import config from '../utils/config';

export class Pubsub extends EventEmitter {
    redis: Redis;

    constructor(redis: Redis) {
        super();
        this.redis = redis;
    }

    async publish(event: string, data: string): Promise<void> {
        // Not the right way to check if redis is available but here we are.
        if (config.redis.lazyConnect) {
            this.emit(event, data);
        } else {
            await this.redis.publish(event, data);
        }
    }

    async subscribe(
        event: string,
        listener: (data: string) => void
    ): Promise<void> {
        // Not the right way to check if redis is available but here we are.
        if (config.redis.lazyConnect) {
            this.on(event, listener);
        } else {
            await this.redis.client.psubscribe(event);
            this.redis.client.on('pmessage', (channel, _pattern, message) => {
                if (channel === event) {
                    listener(message);
                }
            });
        }
    }

    async stop(): Promise<void> {
        return this.redis.disconnect();
    }
}

import { EventEmitter } from 'events';

interface ExpiringValue<T> {
    data: T;
    expiryTimestamp?: number;
}
export default class Cache<T> {
    cache: Map<string, ExpiringValue<T>>;

    inFlightRequests: Map<string, EventEmitter>;

    constructor() {
        this.cache = new Map();
        this.inFlightRequests = new Map();
    }

    get(key: string): T | undefined {
        const value = this.cache.get(key);
        if (!value) {
            return undefined;
        }
        const { data, expiryTimestamp } = value;
        if (expiryTimestamp && expiryTimestamp < Date.now()) {
            this.cache.delete(key);
            return undefined;
        }
        return data;
    }

    async set(
        key: string,
        value: T | (() => Promise<T>),
        expiryMs?: number
    ): Promise<T> {
        // Check the inflight requests first
        const inFlightRequest = this.inFlightRequests.get(key);
        if (inFlightRequest) {
            return new Promise((resolve) => {
                inFlightRequest.on('done', (data: T) => {
                    resolve(data);
                });
            });
        }
        let innerValue: T;
        if (value instanceof Function) {
            const eventEmitter = new EventEmitter();
            eventEmitter.setMaxListeners(1000);
            this.inFlightRequests.set(key, eventEmitter);
            innerValue = (await value()) as T;
            eventEmitter.emit('done', innerValue);
            eventEmitter.removeAllListeners('done');
            this.inFlightRequests.delete(key);
        } else {
            innerValue = value;
        }
        this.cache.set(key, {
            data: innerValue as T,
            expiryTimestamp: expiryMs ? Date.now() + expiryMs : undefined
        });
        return innerValue;
    }

    delete(key: string): void {
        this.cache.delete(key);
    }

    clear(): void {
        this.cache.clear();
    }
}

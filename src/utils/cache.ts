import { EventEmitter } from 'events';

interface ExpiringValue<T> {
    data: T;
    expiryTimestamp?: number;
    count?: number;
    removeTimeout?: NodeJS.Timeout;
}
export default class Cache<T> extends EventEmitter {
    cache: Map<string, ExpiringValue<T>>;

    inFlightRequests: Map<string, EventEmitter>;

    constructor() {
        super();
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
        expiryMs?: number,
        emitOnExpire?: boolean
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
        const oldValue = this.cache.get(key);
        if (oldValue?.removeTimeout) {
            clearTimeout(oldValue.removeTimeout);
        }
        this.cache.set(key, {
            data: innerValue as T,
            expiryTimestamp: expiryMs ? Date.now() + expiryMs : undefined,
            count: oldValue?.count ? oldValue.count + 1 : 1,
            removeTimeout:
                expiryMs && emitOnExpire
                    ? setTimeout(() => {
                          this.delete(key, true);
                      }, expiryMs)
                    : undefined
        });

        return innerValue;
    }

    delete(key: string, emit?: boolean): void {
        if (emit) {
            this.emit('expired', { key, value: this.cache.get(key) });
        }
        this.cache.delete(key);
    }

    clear(): void {
        this.cache.clear();
    }
}

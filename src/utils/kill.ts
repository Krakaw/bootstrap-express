import { EventEmitter } from 'events';
import { Logger } from 'pino';

export default class Kill extends EventEmitter {
    count = 0;

    private readonly logger: Logger;

    constructor(logger: Logger) {
        super();
        this.logger = logger;
        process.on('SIGINT', () => {
            logger.trace('SIGINT received');
            this.kill('SIGINT');
        }); // CTRL+C
        process.on('SIGQUIT', () => {
            logger.trace('SIGQUIT received');
            this.kill('SIGQUIT');
        }); // Keyboard quit
        process.on('SIGTERM', () => {
            logger.trace('SIGTERM received');
            this.kill('SIGTERM');
        }); // `kill` command
    }

    public kill(signal: string): void {
        this.logger.debug(`${signal} received`);

        if (this.count === 0) {
            // Only emit kill once
            this.emit('kill');
        }
        this.count += 1;

        if (this.count > 2) {
            // eslint-disable-next-line no-console
            console.log(`\nForcing exit at ${new Date()}\n`);
            process.exit(1);
        }
    }
}

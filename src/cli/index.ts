import yargs, { Arguments } from 'yargs';

export default function initializeCli(): Arguments {
    return (
        yargs(process.argv.slice(2))
            // API Server
            .command('server', 'Start the API server')
            // Processors
            .command('processor', 'Start the process worker', {})
            // CLI
            .strict()
            .help()
            .parseSync()
    );
}

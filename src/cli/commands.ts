import yargs from 'yargs';

export enum Command {
    Server = 'server',
    Queue = 'queue',
    Cron = 'cron'
}

export enum CommandQueue {
    Example = 'example'
}

const { argv } = yargs(process.argv.slice(2))
    .command(Command.Server, 'Start the API server')
    .command(Command.Cron, 'Start the cron worker')
    .command(Command.Queue, 'Start a queue worker', {
        name: {
            alias: 'n',
            description: 'Queue name to start',
            demandOption: true,
            enum: [CommandQueue.Example]
        }
    })
    .demandCommand(1, 1, 'Choose a command from the list above')
    .strict()
    .help('h');
export default argv;

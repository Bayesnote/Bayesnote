import clear from 'clear'
import { program } from 'commander'
import { createLogger } from 'bunyan'
import { Socket } from './socket'

const log = createLogger({ name: 'Cli' })

clear()
// process.argv.push(...['run', '-p', 'myList=["oli", "ali"]', 'test/parameter-notebook.json'])
// console.log(process.argv)

// options
const parameters = (value: string, previous: string[]) => {
    return previous.concat([value]);
}

program
    .version('0.0.1')
    .option('-p, --parameters <params>', 'Add parameter', parameters, [])
    .option('-c, --clean-injected-parameters', 'Clean injected parameter cells')
    .option('-ws, --web-socket <params>', 'Change WebSocket url')

// command
program.command('run <path>')
    .description('Run notebook')
    .action(onRunNotebook)

// handler
async function onRunNotebook(path: string) {
    let ws = 'http://localhost'
    let clean = false

    if (program.webSocket) { ws = program.webSocket }
    if (program.cleanInjectedParameters) { clean = true }
    // run notebook
    log.info('Running notebook')
    const socket = new Socket(ws)
    await socket.runNotebook(path, program.parameters, clean)
}
program.parse(process.argv)

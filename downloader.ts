import 'https://deno.land/x/hackle@v1.0.0/init.ts'
import { Command } from 'https://deno.land/x/cmd@v1.2.0/mod.ts'
import { downloader } from './mod.ts'

const program = new Command('downloader')
program.version('1.0.0')

program
	.option('-c, --config <file>', 'Path to the configuration file', undefined, '.config/downloader.json')
	.option('--log-level <level>', 'Options are `none`, `error`, `warn`, `notice`, `info`, and `debug`', undefined, `notice`)

program.parse(Deno.args)

const { config, logLevel } = program

if (logLevel === 'none') hackle.setLogLevel(null)
else if (logLevel === 'error') hackle.setLogLevel('error')
else if (logLevel === 'warn') hackle.setLogLevel('warn')
else if (logLevel === 'notice') hackle.setLogLevel('notice')
else if (logLevel === 'info') hackle.setLogLevel('info')
else if (logLevel === 'debug') hackle.setLogLevel('debug')
else if (typeof logLevel === 'string') hackle.error(`An invalid log level was received.  See 'downloader --help' for more information'`)

await downloader({ config })

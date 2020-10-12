import 'https://deno.land/x/hackle@v1.0.0/init.ts'
import { readZip } from 'https://deno.land/x/jszip@0.7.0/mod.ts'
import { exists, copy } from 'https://deno.land/std@0.71.0/fs/mod.ts'
import { join, basename, dirname, isAbsolute, globToRegExp } from 'https://deno.land/std@0.71.0/path/mod.ts'
import type { DownloadInstructions, UnzipScheme } from './schema.ts'
import { download } from 'https://deno.land/x/download/mod.ts'
import { green } from 'https://deno.land/std@0.71.0/fmt/colors.ts'

hackle.addScope({
	name: 'd-download',
	prepend: green('Download'),
	level: 'notice',
})

hackle.addScope({
	name: 'd-copy',
	prepend: green('Copy'),
	level: 'notice',
})

hackle.addScope({
	name: 'd-extract',
	prepend: green('Extract'),
	level: 'notice',
})

hackle.addScope({
	name: 'd-write',
	prepend: green('Write'),
	level: 'notice',
})

export interface DownloaderOptions {
	/** Path to the downloader config.
	 * @default .config/downloader.json
	 */
	config: string
}

export async function downloader(options: DownloaderOptions) {
	const file = options.config || '.config/downloader.json'
	const fileExists = await exists(file)

	if (!fileExists) {
		hackle.error(`Could not find a config file at ${file}`)
		Deno.exit(1)
	}

	const json = await Deno.readTextFile(file).catch(e => {
		e.message = `Error reading ${file}: ${e.message}`
		throw e
	})

	const config = parseJSON(json, file) as DownloadInstructions

	if (!config.dest) hackle.error(`Couldn't find the required 'dest' key in ${file}`)
	if (!config.files || !config.files.length) hackle.warn(`No files to download were found in ${file}.  Exiting...`)

	await downloadFiles(config)
}

export async function downloadFiles(instructions: DownloadInstructions) {
	const { dest, files } = instructions

	const destExists = await exists(dest)
	if (!destExists) await Deno.mkdir(dest, { recursive: true })

	await Promise.all(
		files.map(async fileInfo => {
			if (fileInfo.unzip) {
				const tmpFile = await Deno.makeTempFile()
				await downloadFile(fileInfo.url, tmpFile)
				await unzip(
					tmpFile,
					dest,
					fileInfo.name || basename(fileInfo.url),
					fileInfo.url,
					typeof fileInfo.unzip === 'object' ? fileInfo.unzip : {}
				)
			} else {
				await downloadFile(fileInfo.url, join(dest, fileInfo.name || basename(fileInfo.url)))
			}
		})
	)
}

function parseJSON(json: string, file: string) {
	try {
		return JSON.parse(json)
	} catch (e) {
		e.message = `Error parsing JSON from ${file}: ${e.content}`
		throw e
	}
}

async function unzip(file: string, dest: string, name: string, url: string, unzipOptions: UnzipScheme) {
	hackle.scope('d-extract')(url)

	const zip = await readZip(file)
	const files = Object.keys(zip.files())

	for (let file of files) {
		const innerZip = zip.file(file)

		if (!innerZip || !fileWasIncluded(file, unzipOptions.include || '**/*', unzipOptions.exclude || [])) continue

		hackle.scope('d-write')(file)

		if (unzipOptions.renameArtifacts && unzipOptions.renameArtifacts[file]) file = unzipOptions.renameArtifacts[file]

		const path = unzipOptions.nest !== false ? join(dest, name, file) : join(dest, file)
		const data = await innerZip.async('uint8array')
		const dir = dirname(path)

		if (!(await exists(dir))) await Deno.mkdir(dirname(path), { recursive: true })
		await Deno.writeFile(path, data)
	}
}

async function downloadFile(uri: string, file: string) {
	if (uri.slice(0, 4) === 'http') await downloadURL(uri, file)
	else if (uri.slice(0, 7) === 'file://') await copyFile(uri.slice(7), file)
	else if (uri.startsWith('/') || uri.startsWith('./') || uri.startsWith('../')) await copyFile(uri, file)
	else hackle.error(`Invalid uri: ${uri}`)

	async function downloadURL(url: string, file: string) {
		hackle.scope('d-download')(url)

		const dir = dirname(file)
		const filename = basename(file)

		try {
			await download(url, { dir, file: filename })
		} catch (e) {
			hackle.error(`Unable to download ${url}: ${e.message}`)
		}
	}

	async function copyFile(path: string, file: string) {
		hackle.scope('d-copy')(path)

		const pathExists = await exists(path)

		if (!pathExists) {
			hackle.error(`Could not locate ${path}`)
			Deno.exit(1)
		}

		await copy(path, file, { overwrite: true })
	}
}

function fileWasIncluded(file: string, include: string[] | string, exclude: string[] | string): boolean {
	const globIsFile = (file: string, glob: string): boolean => {
		if (isAbsolute(glob)) globIsFile(file, glob.slice(1))
		else if (glob.startsWith('./')) return globIsFile(file, glob.slice(2))
		else if (glob.startsWith('./')) return globIsFile(file, glob.slice(3))

		return globToRegExp(glob).test(file)
	}

	const makeArray = <T>(data: T[] | T) => (Array.isArray(data) ? data : [data])

	let didInclude = false
	for (let glob of makeArray(include)) {
		if (globIsFile(file, glob)) {
			didInclude = true
			break
		}
	}

	if (didInclude) return true

	let didExclude = false
	for (let glob of makeArray(exclude)) {
		if (globIsFile(file, glob)) {
			didExclude = true
			break
		}
	}

	return !didExclude
}

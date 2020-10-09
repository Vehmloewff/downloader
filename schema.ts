export interface DownloadInstructions {
	/** The directory in which all downloaded files are to be written to */
	dest: string

	/** The files to be downloaded */
	files: FileScheme[]
}

export interface FileScheme {
	/**
	 * The url of the file to be downloaded.
	 * Can be an http/https url, a relative path, or an absolute path.
	 */
	url: string

	/**
	 * What name the file should go under in the parent directory.
	 * @default basename(url)
	 *
	 * @example
	 * {
	 * 	...
	 * 	url: 'https://example.com/foo.js'
	 * 	name: 'bar.js'
	 * }
	 *
	 * @example
	 * {
	 * 	...
	 * 	url: 'https://example.com/foo.js'
	 * 	name: 'sub-dir/bar.js'
	 * }
	 */
	name?: string

	/**
	 * If this field is specified, downloader will attempt to unzip the file,
	 * and write the contents to disc according to the fields and values in this key.
	 */
	unzip?: UnzipScheme | boolean
}

export interface UnzipScheme {
	/**
	 * If `false`, files and folders extracted from the zip will be spread out over the parent directory.
	 * If `true`, the artifacts will be nested under a subdirectory with the name of `name` or, if it was not specified, the name of the zip.
	 * @default true
	 */
	nest?: boolean

	/**
	 * Files inside the zip to be included in the final artifacts list.
	 * @default '**\/*'
	 */
	include?: string[] | string

	/**
	 * Files inside the zip to be excluded from the final artifacts list.
	 * @default []
	 */
	exclude?: string[] | string

	/**
	 * Any artifacts in the zip whose relative path, without the first './', is found as a key in this object,
	 * will be renamed to the value of the matching key.
	 */
	renameArtifacts?: { [key: string]: string }
}

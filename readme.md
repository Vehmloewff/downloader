# downloader

[![deno doc](https://doc.deno.land/badge.svg)](https://doc.deno.land/https/deno.land/x/downloader/mod.ts)

Downloads files, extracting them when ordered to do so

## CLI Usage

```sh
deno install --unstable --allow-read --allow-write --allow-net --allow-env https://deno.land/x/downloader/cli.ts
```

Create a config...

```json
{
	"$schema": "https://deno.land/x/downloader/schema.json",
	"dest": "destination/dir",
	"files": [
		{
			"url": "https://deno.land/x/hackle/mod.ts",
			"name": "hackle.ts"
		},
		{
			"url": "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?ixlib=rb-1.2.1&q=80&fm=jpg&crop=entropy&cs=tinysrgb&dl=clement-h-95YRwf6CNw8-unsplash.jpg",
			"name": "code.jpg"
		},
		{
			"url": "https://codeload.github.com/Vehmloewff/custom-format/zip/1.0.1",
			"unzip": {
				"exclude": "**/*",
				"include": "*README*",
				"renameArtifacts": {
					"README.md": "custom-format-readme.md"
				},
				"nest": false
			}
		},
	]
}
```

...and download the files:

```sh
downloader --config path/to/config
```

## Programmatic Usage

```ts
import { downloader, downloadFiles } from 'https://deno.land/x/downloader/mod.ts'

await downloader({ config: 'path/to/config' })

// or

await downloadFiles({
	// your config here
})
```

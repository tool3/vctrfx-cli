#!/usr/bin/env node

import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import { applyCommand } from './commands/apply'
import { listCommand } from './commands/list'
import { names } from './effects'
import type { CliOptions } from './types'

const createParser = () =>
  yargs(hideBin(process.argv))
    .parserConfiguration({ 'boolean-negation': false })
    .scriptName('vctrfx')
    .usage('Usage: $0 [input...] [options]')
    .example('$0 logo.svg -e bloom', 'Apply one effect, print to stdout')
    .example('$0 logo.svg -p crt -o out.svg', 'Apply a preset, write to a file')
    .example('cat logo.svg | $0 -p vhs > out.svg', 'Read piped SVG from stdin')
    .example('$0 - -e grain < logo.svg', 'Read stdin explicitly')
    .example('$0 icons/ -p riso -o dist/', 'Batch a directory into an output directory')
    .example('$0 a.svg b.svg -e invert --in-place', 'Overwrite several files in place')
    .example('$0 https://example.com/logo.svg -p neon', 'Fetch and process a remote SVG')
    .example('$0 logo.svg -e "bloom:radius=8" -e "scanlines:gap=3"', 'Stack effects with options, in order')
    .example('$0 logo.svg -p crt --data-uri', 'Emit a data: URI for CSS or HTML')
    .example('$0 logo.svg -p vhs -a', 'Animate everything in a preset that can move')
    .example('$0 logo.svg -p crt -a --no-animate scanlines', 'Animate a preset but keep some effects still')
    .example('$0 logo.svg -c effects.json', 'Read the effect stack from JSON')
    .example('$0 card.svg -p crt --clip none', 'Let effects spill past a rounded frame')
    .example('$0 list', 'List every effect and preset')

    .command('list', 'List all effects and presets with their options', {}, () => listCommand())

    .option('effect', {
      alias: 'e',
      type: 'array',
      description: 'Effect to apply, repeatable and order preserving. name or name:key=value,key=value',
      default: [] as string[],
    })
    .option('preset', {
      alias: 'p',
      type: 'array',
      description: 'Preset to apply, repeatable',
      default: [] as string[],
    })
    .option('config', {
      alias: 'c',
      type: 'string',
      description: 'JSON file holding the effect stack',
    })
    .option('output', {
      alias: 'o',
      type: 'string',
      description: 'Output file, or directory when processing more than one input',
    })
    .option('in-place', {
      alias: 'i',
      type: 'boolean',
      description: 'Overwrite the input files',
      default: false,
    })
    .option('data-uri', {
      alias: 'u',
      type: 'boolean',
      description: 'Emit a data: URI instead of raw markup',
      default: false,
    })
    .option('base64', {
      alias: 'b',
      type: 'boolean',
      description: 'Base64 encode the data URI',
      default: false,
    })
    .option('seed', {
      alias: 's',
      type: 'string',
      description: 'Seed for every random decision, so output is reproducible',
    })
    .option('prefix', {
      type: 'string',
      description: 'Prefix for generated ids',
    })
    .option('scope', {
      type: 'string',
      description: 'Id namespace, defaults to a hash of the input and effects',
    })
    .option('clip', {
      type: 'string',
      description: "Trim the result to the artwork's own frame so its silhouette is untouched",
      choices: ['shape', 'none'],
      default: 'shape',
    })
    .option('animate', {
      alias: 'a',
      type: 'boolean',
      description: 'Animate every animatable effect inside the presets. Inline effects opt in with name:animate',
      default: false,
    })
    .option('no-animate', {
      type: 'string',
      description: 'Comma separated effects to keep still, e.g. "scanlines,grain". Bare, it forces a still frame',
      coerce: (raw: string | readonly string[]): readonly string[] =>
        [raw]
          .flat()
          .flatMap((value) => value.split(','))
          .map((name) => name.trim())
          .filter((name) => name.length > 0),
    })
    .option('format', {
      alias: 'f',
      type: 'string',
      description: 'Output formatting',
      choices: ['preserve', 'pretty', 'minify'],
      default: 'preserve',
    })
    .option('quiet', {
      alias: 'q',
      type: 'boolean',
      description: 'Do not report written files on stderr',
      default: false,
    })

    .epilogue(`Effects and presets: ${names().join(', ')}`)
    .help('help')
    .alias('help', '?')
    .version()
    .wrap(Math.min(120, yargs().terminalWidth()))

const run = async (): Promise<void> => {
  const parser = createParser()
  const argv = (await parser.argv) as unknown as CliOptions & { _: readonly string[] }

  if (argv._[0] === 'list') return

  const code = await applyCommand(argv)
  if (code === -1) {
    parser.showHelp()
    process.exit(0)
  }
}

run().catch((error: unknown) => {
  console.error(`Error: ${error instanceof Error ? error.message : String(error)}`)
  process.exit(1)
})

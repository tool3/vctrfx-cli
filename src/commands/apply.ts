import { readFileSync } from 'node:fs'
import { relative } from 'node:path'
import { createPipeline, toDataUri } from 'vctrfx'
import { collect } from '../input'
import { destination, write } from '../output'
import { toSettings } from '../settings'
import { toMotion, withMotion } from '../motion'
import { build, parseSpec, readConfig } from '../spec'
import type { CliOptions } from '../types'
import type { Effect } from 'vctrfx'

const gather = (options: CliOptions): readonly Effect[] => {
  const specs = [
    ...(options.config === undefined ? [] : readConfig(readFileSync(options.config, 'utf8'), options.config)),
    ...options.preset.map(parseSpec),
    ...options.effect.map(parseSpec),
  ]
  return withMotion(specs, toMotion(options.animate, options.noAnimate)).map(build)
}

const display = (target: string): string => {
  const nearby = relative(process.cwd(), target)
  return nearby.startsWith('..') ? target : nearby
}

const present = (markup: string, options: CliOptions): string =>
  options.dataUri || options.base64
    ? toDataUri(markup, { base64: options.base64 })
    : markup

export const applyCommand = async (options: CliOptions): Promise<number> => {
  const effects = gather(options)
  if (effects.length === 0) return -1

  const targets = options._.map(String)
  const inputs = await collect(targets)
  if (inputs.length === 0) return -1

  const pipeline = createPipeline(effects, toSettings(options))
  const batch = inputs.length > 1

  const written = inputs.reduce<readonly string[]>((done, input) => {
    const result = present(pipeline.apply(input.source), options)
    const target = destination(input, options.output, options.inPlace, batch)
    if (target === null) {
      process.stdout.write(`${result}\n`)
      return done
    }
    write(target, result)
    return [...done, target]
  }, [])

  if (!options.quiet && written.length > 0) {
    const names = effects.map((effect) => effect.name).join(' → ')
    written.forEach((target) => console.error(`${display(target)}  ${names}`))
  }

  return 0
}

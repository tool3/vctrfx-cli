import { PRESET_NAMES } from 'grfti'
import { EFFECTS, PRESETS } from '../effects'
import type { EffectMeta } from '../types'

const column = (entries: Readonly<Record<string, EffectMeta>>): number =>
  Object.keys(entries).reduce((widest, name) => Math.max(widest, name.length), 0)

const render = (title: string, entries: Readonly<Record<string, EffectMeta>>): readonly string[] => {
  const width = column(entries)
  return [
    '',
    title,
    '',
    ...Object.entries(entries).flatMap(([name, meta]) => {
      const flat = meta.options.filter((option) => meta.nested?.[option] === undefined)
      const options = flat.length > 0 ? `  [${flat.join(', ')}]` : ''
      const head = `  ${name.padEnd(width)}  ${meta.summary}${options}`
      const inner = Object.entries(meta.nested ?? {}).map(
        ([id, keys]) => `  ${' '.repeat(width)}    ${id}.[${keys.join(', ')}]`,
      )
      return [head, ...inner]
    }),
  ]
}

export const listCommand = (): void => {
  const lines = [
    ...render(`Effects (${Object.keys(EFFECTS).length})`, EFFECTS),
    ...render(`Presets (${Object.keys(PRESETS).length})`, PRESETS),
    '',
    'Options go after a colon, comma separated:',
    '',
    '  vctrfx logo.svg -e "bloom:radius=8,threshold=0.5"',
    '  vctrfx logo.svg -e halftone:size=5,angle=15 -e "grain:amount=0.3"',
    '',
    'Presets are stacks of effects. Reach inside one with a dot:',
    '',
    '  vctrfx logo.svg -p "film:grain.amount=0.5"',
    '  vctrfx logo.svg -p "crt:scanlines.gap=6,vignette.amount=0.9"',
    '',
    'Animate every effect in a preset that can move, optionally keeping some still:',
    '',
    '  vctrfx logo.svg -p vhs -a',
    '  vctrfx logo.svg -p vhs -a --no-animate "scanlines,grain"',
    '  vctrfx logo.svg -e grain:animate',
    '',
    'Colour options take any grfti colour: a CSS name, hex, rgb(), hsl(), oklch():',
    '',
    '  vctrfx logo.svg -e "glow:color=rebeccapurple"',
    '  vctrfx logo.svg -e "tint:color=oklch(0.7 0.15 250),amount=0.4"',
    '  vctrfx logo.svg -e "duotone:shadow=midnightblue,highlight=hotpink"',
    '',
    `Gradient preset names usable as colour pairs (${PRESET_NAMES.length}): ${PRESET_NAMES.join(', ')}`,
    '',
  ]
  console.log(lines.join('\n'))
}

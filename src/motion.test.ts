import { describe, expect, it } from 'vitest'
import { toMotion, withMotion } from './motion'
import { parseSpec } from './spec'
import { toSettings } from './settings'

const apply = (raws: readonly string[], animate: boolean, noAnimate?: readonly string[]) =>
  withMotion(raws.map(parseSpec), toMotion(animate, noAnimate)).map((spec) => spec.options)

describe('--animate', () => {
  it('leaves specs alone when not given', () => {
    expect(apply(['vhs', 'grain'], false)).toEqual([{}, {}])
  })

  it('animates every animatable effect inside a preset', () => {
    expect(apply(['vhs'], true)).toEqual([
      { wave: { animate: true }, grain: { animate: true }, scanlines: { animate: true } },
    ])
  })

  it('reaches presets that have no animate shorthand', () => {
    expect(apply(['film'], true)).toEqual([{ grain: { animate: true } }])
  })

  it('skips presets with nothing to animate', () => {
    expect(apply(['neon'], true)).toEqual([{}])
  })

  it('does not touch inline effects', () => {
    expect(apply(['crt', 'grain'], true)).toEqual([{ scanlines: { animate: true } }, {}])
  })

  it('lets an explicit nested option win', () => {
    expect(apply(['crt:scanlines.animate=false,scanlines.gap=6'], true)).toEqual([
      { scanlines: { animate: false, gap: 6 } },
    ])
  })

  it('explains itself when there is no preset to animate', () => {
    expect(() => apply(['grain'], true)).toThrow(/applies to presets.*-e grain:animate/)
  })
})

describe('--no-animate', () => {
  it('keeps the listed effects still', () => {
    expect(apply(['vhs'], true, ['scanlines', 'grain'])).toEqual([
      { wave: { animate: true }, grain: { animate: false }, scanlines: { animate: false } },
    ])
  })

  it('overrides the preset animate shorthand', () => {
    expect(apply(['crt:animate'], false, ['scanlines'])).toEqual([
      { animate: true, scanlines: { animate: false } },
    ])
  })

  it('accepts camelCase and kebab-case names', () => {
    expect(apply(['vhs'], true, ['Wave'])[0]).toMatchObject({ wave: { animate: false } })
  })

  it('rejects an effect that cannot animate', () => {
    expect(() => apply(['crt'], true, ['halftone'])).toThrow(/"halftone".*Animatable effects: grain, scanlines, glitch, wave/)
  })

  it('forces a still frame when given bare', () => {
    const settings = (noAnimate?: readonly string[]) =>
      toSettings({ clip: 'shape', animate: false, format: 'preserve', noAnimate } as never).animate
    expect(settings(undefined)).toBe(true)
    expect(settings([])).toBe(false)
    expect(settings(['grain'])).toBe(true)
  })
})

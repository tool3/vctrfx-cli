import { EFFECTS, canonical, resolve } from './effects'
import type { EffectSpec, Motion } from './types'

export const ANIMATABLE: readonly string[] = Object.keys(EFFECTS).filter((id) =>
  EFFECTS[id]?.options.includes('animate'),
)

const isPreset = (spec: EffectSpec): boolean => resolve(spec.name)?.nested !== undefined

const animatableInside = (spec: EffectSpec): readonly string[] =>
  Object.entries(resolve(spec.name)?.nested ?? {})
    .filter(([, keys]) => keys.includes('animate'))
    .map(([id]) => id)

const wantedFor = (id: string, motion: Motion): boolean | undefined =>
  motion.except.includes(canonical(id)) ? false : motion.all ? true : undefined

const withInnerMotion = (options: Record<string, unknown>, id: string, motion: Motion): Record<string, unknown> => {
  const wanted = wantedFor(id, motion)
  const inner = (options[id] ?? {}) as Record<string, unknown>
  return wanted === undefined ? options : { ...options, [id]: { animate: wanted, ...inner } }
}

const animatePreset = (spec: EffectSpec, motion: Motion): EffectSpec => ({
  ...spec,
  options: animatableInside(spec).reduce((options, id) => withInnerMotion(options, id, motion), spec.options),
})

const checkExclusions = (except: readonly string[]): void => {
  const unknown = except.filter((name) => !ANIMATABLE.includes(name))
  if (unknown.length > 0) {
    throw new Error(`--no-animate got ${unknown.map((name) => `"${name}"`).join(', ')}. Animatable effects: ${ANIMATABLE.join(', ')}.`)
  }
}

const checkTargets = (specs: readonly EffectSpec[], motion: Motion): void => {
  if (motion.all && !specs.some(isPreset)) {
    const example = specs[0]?.name ?? 'grain'
    throw new Error(`--animate applies to presets. Animate an effect on its own with -e ${example}:animate.`)
  }
}

export const toMotion = (animate: boolean, noAnimate: readonly string[] | undefined): Motion => ({
  all: animate,
  except: (noAnimate ?? []).map(canonical),
})

export const withMotion = (specs: readonly EffectSpec[], motion: Motion): readonly EffectSpec[] => {
  checkExclusions(motion.except)
  checkTargets(specs, motion)
  return specs.map((spec) => (isPreset(spec) ? animatePreset(spec, motion) : spec))
}

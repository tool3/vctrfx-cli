import { camelKey, canonical, choicesFor, normalizeKeys, resolve } from './effects'
import type { EffectMeta, EffectSpec } from './types'
import type { Effect } from 'vctrfx'

const coerce = (raw: string): unknown => {
  const value = raw.trim()
  if (value === 'true') return true
  if (value === 'false') return false
  if (value === 'null') return null
  if (value === '') return true
  return Number.isFinite(Number(value)) ? Number(value) : value
}

const entryOf = (entry: string): readonly [string, unknown] => {
  const index = entry.indexOf('=')
  return index === -1 ? [entry.trim(), true] : [entry.slice(0, index).trim(), coerce(entry.slice(index + 1))]
}

const suggest = (name: string, valid: readonly string[]): string => {
  const close = valid.filter((option) => option.toLowerCase().startsWith(name.slice(0, 3).toLowerCase()))
  return close.length > 0 ? ` Did you mean ${close.join(' or ')}?` : ''
}

const checkChoice = (name: string, owner: string, key: string, value: unknown): void => {
  const allowed = choicesFor(owner, key)
  if (allowed !== undefined && !allowed.includes(String(value))) {
    const where = owner === name ? `"${name}" option "${key}"` : `"${name}" effect "${owner}" option "${key}"`
    throw new Error(`${where} must be one of ${allowed.join(', ')}, got "${String(value)}".`)
  }
}

const nest = (path: readonly string[], value: unknown): unknown =>
  path.length === 0 ? value : { [path[0] as string]: nest(path.slice(1), value) }

const merge = (
  target: Record<string, unknown>,
  key: string,
  value: unknown,
): Record<string, unknown> => {
  const existing = target[key]
  const mergeable =
    typeof existing === 'object' && existing !== null && typeof value === 'object' && value !== null
  return {
    ...target,
    [key]: mergeable
      ? Object.entries(value as Record<string, unknown>).reduce(
          (inner, [nestedKey, nestedValue]) => merge(inner, nestedKey, nestedValue),
          existing as Record<string, unknown>,
        )
      : value,
  }
}

const resolvePath = (name: string, meta: EffectMeta, raw: string): readonly string[] => {
  const path = raw
    .split('.')
    .map((part) => camelKey(part.trim()))
    .filter((part) => part.length > 0)
  const [head, leaf, ...rest] = path

  if (head === undefined) throw new Error(`"${name}" was given an empty option name.`)
  if (!meta.options.includes(head)) {
    throw new Error(
      `"${name}" has no option "${head}". Valid: ${meta.options.join(', ') || 'none'}.${suggest(head, meta.options)}`,
    )
  }

  const inner = meta.nested?.[head]
  if (leaf === undefined) {
    if (inner !== undefined) {
      throw new Error(
        `"${name}" option "${head}" is an effect inside the preset. Set one of its options, for example ${name}:${head}.${inner[0] ?? 'value'}=…`,
      )
    }
    return path
  }

  if (inner === undefined) {
    throw new Error(`"${name}" option "${head}" takes a value, not a nested one like "${raw}".`)
  }
  if (!inner.includes(leaf)) {
    throw new Error(
      `"${name}" effect "${head}" has no option "${leaf}". Valid: ${inner.join(', ') || 'none'}.${suggest(leaf, inner)}`,
    )
  }
  if (rest.length > 0) throw new Error(`"${name}" option "${raw}" nests too deeply.`)

  return path
}

export const parseSpec = (raw: string): EffectSpec => {
  const separator = raw.indexOf(':')
  const name = (separator === -1 ? raw : raw.slice(0, separator)).trim()
  const body = separator === -1 ? '' : raw.slice(separator + 1)

  const meta = resolve(name)
  if (meta === null) throw new Error(`Unknown effect "${name}". Run \`vctrfx list\` to see everything available.`)

  const options = body
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0)
    .map(entryOf)
    .reduce<Record<string, unknown>>((collected, [key, value]) => {
      const path = resolvePath(name, meta, key)
      const [head, ...tail] = path
      checkChoice(name, tail.length > 0 ? (head as string) : canonical(name), path.at(-1) as string, value)
      return merge(collected, head as string, nest(tail, value))
    }, {})

  return { name, options }
}

export const build = (spec: EffectSpec): Effect => {
  const meta = resolve(spec.name)
  if (meta === null) throw new Error(`Unknown effect "${spec.name}".`)
  return meta.create(spec.options)
}

export const toEffect = (raw: string): Effect => build(parseSpec(raw))

export const readConfig = (contents: string, origin: string): readonly EffectSpec[] => {
  const parsed: unknown = JSON.parse(contents)
  const list = Array.isArray(parsed) ? parsed : (parsed as { effects?: unknown }).effects
  if (!Array.isArray(list)) throw new Error(`${origin} must contain an array of effects, or an { "effects": [...] } object.`)

  return list.map((entry) => {
    if (typeof entry === 'string') return parseSpec(entry)
    const { effect, preset, ...options } = entry as Record<string, unknown>
    const name = String(effect ?? preset ?? '')
    if (resolve(name) === null) throw new Error(`${origin}: unknown effect "${name}".`)
    return { name, options: normalizeKeys(options) }
  })
}

export const fromConfig = (contents: string, origin: string): readonly Effect[] =>
  readConfig(contents, origin).map(build)

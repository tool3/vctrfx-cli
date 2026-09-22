import type { Effect, OutputFormat } from 'vctrfx'

export interface EffectMeta {
  readonly create: (options: Record<string, unknown>) => Effect
  readonly options: readonly string[]
  readonly summary: string
  readonly nested?: Readonly<Record<string, readonly string[]>>
}

export interface EffectSpec {
  readonly name: string
  readonly options: Record<string, unknown>
}

export interface Motion {
  readonly all: boolean
  readonly except: readonly string[]
}

export type InputKind = 'file' | 'stdin' | 'url'

export interface Input {
  readonly kind: InputKind
  readonly name: string
  readonly source: string
}

export interface CliOptions {
  readonly _: readonly (string | number)[]
  readonly effect: readonly string[]
  readonly preset: readonly string[]
  readonly config?: string
  readonly output?: string
  readonly inPlace: boolean
  readonly dataUri: boolean
  readonly base64: boolean
  readonly seed?: string
  readonly prefix?: string
  readonly scope?: string
  readonly clip: 'shape' | 'none'
  readonly animate: boolean
  readonly noAnimate?: readonly string[]
  readonly format: OutputFormat
  readonly quiet: boolean
}

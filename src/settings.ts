import type { VctrfxSettings } from 'vctrfx'
import type { CliOptions } from './types'

export const toSettings = (options: CliOptions): VctrfxSettings => ({
  ...(options.seed === undefined ? {} : { seed: options.seed }),
  ...(options.prefix === undefined ? {} : { prefix: options.prefix }),
  ...(options.scope === undefined ? {} : { scope: options.scope }),
  clip: options.clip,
  animate: options.noAnimate === undefined || options.noAnimate.length > 0,
  format: options.format,
})

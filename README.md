<div align="center">

# vctrfx-cli

`vctrfx logo.svg -p crt`

<img src="https://raw.githubusercontent.com/tool3/vctrfx-cli/master/examples/svgs/crt.svg" width="420" alt="crt preset">

### Post-processing effects for any SVG, straight from your shell.

Pipe it, point it at a file, a directory or a URL — get back a real SVG with
scanlines, bloom, glitch, halftone or a dozen other looks baked in. Still vector,
still editable, no rasterizing.

[![npm](https://img.shields.io/npm/v/vctrfx-cli)](https://www.npmjs.com/package/vctrfx-cli)
[![license](https://img.shields.io/badge/license-MIT-orange)](./LICENSE)

</div>

---

## Highlights

- ✅ **Pipe-first** — `cat logo.svg | vctrfx -p vhs > out.svg` just works.
- ✅ **Every input** — file, directory, glob, stdin, `-`, or an `https://` URL.
- ✅ **Stackable effects** — `-e` is repeatable and order preserving, exactly like the library's array.
- ✅ **27 effects + 8 presets** — one binary, `vctrfx list` to see them all.
- ✅ **Batch a folder** — `vctrfx icons/ -p riso -o dist/`.
- ✅ **Deterministic** — `--seed` makes output byte-identical run to run.
- ✅ **Data URIs** — `--data-uri` for dropping straight into CSS or HTML.
- ✅ **Keeps existing animation** — an SVG that already animates keeps animating.

---

## Table of contents

- [Installation](#installation)
- [Quick start](#quick-start)
- [Input](#input)
- [Output](#output)
- [Effects](#effects)
- [Presets](#presets)
- [Options](#options)
- [Recipes](#recipes)
- [Library](#library)

---

## Installation

```bash
npm install -g vctrfx-cli
```

Or run it without installing:

```bash
npx vctrfx-cli logo.svg -p crt -o out.svg
```

## Quick start

```bash
vctrfx logo.svg -e bloom                        # one effect, printed to stdout
vctrfx logo.svg -p crt -o out.svg               # a preset, written to a file
cat logo.svg | vctrfx -p vhs > out.svg          # piped in, redirected out
vctrfx icons/ -p riso -o dist/                  # a whole directory
vctrfx list                                     # everything available
```

Effects stack in the order you pass them, the same way they do in the library:

```bash
vctrfx logo.svg -e "bloom:radius=8" -e "scanlines:gap=3" -e "grain:amount=0.3"
```

<img src="https://raw.githubusercontent.com/tool3/vctrfx-cli/master/examples/svgs/stacked.svg" width="420" alt="bloom, scanlines and grain stacked">

## Input

| Form | Example |
| ---- | ------- |
| File | `vctrfx logo.svg -p crt` |
| Several files | `vctrfx a.svg b.svg -e invert -o dist/` |
| Glob (shell expands it) | `vctrfx icons/*.svg -p riso -o dist/` |
| Directory | `vctrfx icons/ -p riso -o dist/` |
| Piped stdin | `cat logo.svg \| vctrfx -p vhs` |
| Explicit stdin | `vctrfx - -e grain < logo.svg` |
| Remote URL | `vctrfx https://example.com/logo.svg -p neon` |

Directories are scanned one level deep for `.svg` files, sorted by name.

## Output

| Flag | Behaviour |
| ---- | --------- |
| *(none)* | Writes the SVG to stdout, so it pipes and redirects |
| `-o out.svg` | Writes one file |
| `-o dist/` | Writes into a directory, keeping each input's filename |
| `-i`, `--in-place` | Overwrites the input files |
| `-u`, `--data-uri` | Emits a `data:` URI instead of markup |
| `-b`, `--base64` | Base64-encodes the data URI |

Written paths are reported on stderr, so stdout stays clean for piping. Use `-q` to silence it.

## Effects

`vctrfx list` prints all of these with their options.

| | |
| --- | --- |
| **Light** | `blur` `bloom` `glow` `shadow` |
| **Colour** | `grayscale` `saturate` `hue-rotate` `invert` `brightness` `contrast` `sepia` `fade` `posterize` `threshold` `duotone` `tint` |
| **Texture** | `grain` `scanlines` `chromatic-aberration` `glitch` `pixelate` `halftone` `vignette` `outline` `wave` `emboss` `sharpen` |

Options go after a colon, comma separated. Keys accept kebab-case or camelCase:

```bash
vctrfx logo.svg -e "halftone:size=5,angle=15,keep-source=true"
vctrfx logo.svg -e "glow:color=#ff2d55,radius=8"
vctrfx logo.svg -e "grain:animate"              # a bare key means true
```

<img src="https://raw.githubusercontent.com/tool3/vctrfx-cli/master/examples/svgs/halftone.svg" width="300" alt="halftone"> <img src="https://raw.githubusercontent.com/tool3/vctrfx-cli/master/examples/svgs/glitch.svg" width="300" alt="glitch">


### Overlays follow your SVG's shape

`scanlines`, `vignette` and `halftone` lay something over the drawing rather than
filtering it. They mask that overlay to the artwork's own silhouette, so a rounded
terminal window, a logo on transparency, or anything with a non-rectangular shape keeps
its edges instead of getting a rectangle painted over it.

```bash
vctrfx terminal.svg -p crt -o out.svg              # rounded corners survive
vctrfx terminal.svg -e scanlines:clip=viewport   # opt out, fill the whole frame
```

## Presets

| Preset | Look |
| ------ | ---- |
| `crt` | Phosphor glow, scanlines, colour fringing, vignette |
| `vhs` | Tape wobble, heavy fringing, rolling lines, noise |
| `riso` | Two-colour risograph with paper grain |
| `xerox` | Blown-out photocopy |
| `neon` | Saturated sign glow |
| `film` | Halation, grain and a soft vignette |
| `newsprint` | Halftone dots on off-white stock |
| `cyberpunk` | Sliced, shifted, bloomed, scanned |

<img src="https://raw.githubusercontent.com/tool3/vctrfx-cli/master/examples/svgs/riso.svg" width="300" alt="riso preset"> <img src="https://raw.githubusercontent.com/tool3/vctrfx-cli/master/examples/svgs/neon.svg" width="300" alt="neon preset">

Presets take options too:

```bash
vctrfx logo.svg -p "riso:shadow=#2b3a67,highlight=#ff5a5f"
vctrfx logo.svg -p "crt:animate=true"
```

### Animation

`grain`, `scanlines`, `glitch` and `wave` can move. `-a` switches on every one of them inside
the presets you apply. Inline effects are explicit, so each opts in on its own:

```bash
vctrfx logo.svg -p vhs -a                                  # wave, grain and scanlines all move
vctrfx logo.svg -p vhs -a --no-animate "scanlines,grain"   # only the wave moves
vctrfx logo.svg -p crt -e grain:animate                    # still crt, moving grain
vctrfx logo.svg -p "crt:animate" --no-animate              # a still frame, whatever asked to move
```

An explicit nested option such as `crt:scanlines.animate=false` always wins over the flags.

### Tuning what's inside a preset

A preset is a stack of effects. Reach any one of them with a dot, and the rest of the
recipe stays as it was:

```bash
vctrfx logo.svg -p "film:grain.amount=0.5"
vctrfx logo.svg -p "crt:scanlines.gap=6,vignette.amount=0.9,animate=true"
vctrfx logo.svg -p "newsprint:halftone.size=8,halftone.angle=15"
```

`vctrfx list` prints each preset's inner effects and their options. Paths are validated at
both levels, so a typo tells you what was valid where:

```
$ vctrfx logo.svg -p "film:scanlines.gap=3"
Error: "film" has no option "scanlines". Valid: contrast, bloom, grain, vignette.
```

## Options

| Flag | Default | Description |
| ---- | ------- | ----------- |
| `-e`, `--effect` | | Effect to apply. Repeatable, order preserving |
| `-p`, `--preset` | | Preset to apply. Repeatable |
| `-c`, `--config` | | JSON file holding the effect stack |
| `-o`, `--output` | stdout | Output file, or directory for several inputs |
| `-i`, `--in-place` | `false` | Overwrite the input files |
| `-u`, `--data-uri` | `false` | Emit a `data:` URI |
| `-b`, `--base64` | `false` | Base64-encode the data URI |
| `-s`, `--seed` | `vctrfx` | Seed for every random decision |
| `--prefix` | `vctrfx` | Prefix for generated ids |
| `--scope` | auto | Id namespace, defaults to a hash of the input and effects |
| `-a`, `--animate` | `false` | Animate every animatable effect inside the presets |
| `--no-animate` | | Comma separated effects to keep still. Bare, forces a still frame |
| `-f`, `--format` | `preserve` | `preserve`, `pretty` or `minify` |
| `-q`, `--quiet` | `false` | Do not report written files |

## Recipes

**A stack you reuse, kept in a file**

```json
[
  { "effect": "duotone", "shadow": "#111d4a", "highlight": "#ffd166" },
  { "effect": "halftone", "size": 5, "angle": 15 },
  "grain:amount=0.3"
]
```

```bash
vctrfx logo.svg -c poster.json -o poster.svg
```

**Straight into CSS**

```bash
echo "background-image: url('$(vctrfx logo.svg -p crt -u)');"
```

**Every icon in a folder, minified**

```bash
vctrfx icons/ -p riso -f minify -o dist/
```

**An SVG that already animates keeps animating**

```bash
vctrfx spinner.svg -p crt -o spinner-crt.svg
```

<img src="https://raw.githubusercontent.com/tool3/vctrfx-cli/master/examples/svgs/motion-crt.svg" width="300" alt="crt over an animated svg">

**Reproducible output in CI**

```bash
vctrfx logo.svg -e glitch --seed release-42 -o out.svg
```

## Library

This is the terminal front end for
[`vctrfx`](https://www.npmjs.com/package/vctrfx).
Every effect, option and default is the same — reach for the library when you want
this inside a build script or an app.

```bash
npm install vctrfx
```

## License

MIT © Tal Hayut

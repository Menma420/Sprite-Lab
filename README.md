# Sprite Lab

> A pixel-art reverse-engineering workbench for reconstructing and generating compact GBA-style character sprites.

Sprite Lab started with a simple question:

**Can we measure a sprite precisely enough to reconstruct it instead of merely copying the pixels?**

The tool is built around an evidence-first pipeline:

```text
reference sprite
      ↓
 decode + measure
      ↓
 pixel topology
      ↓
 construction grammar
      ↓
 semantic renderer
      ↓
 exact reconstruction
      ↓
 parameterized character generation
```

The current release is **v0.8.3**. It includes forensic analysis, semantic Brendan reconstruction, and a grammar-based character authoring surface.

---

## What it does

### Reverse-engineer a sprite

Sprite Lab measures the source instead of guessing first:

- Indexed PNG decoding, including 4-bit indexed palettes
- Exact 16×32 object-cell slicing
- Visible-pixel occupancy and bounding boxes
- Row spans and silhouette primitives
- Palette indices and palette usage
- Same-palette connected components
- Palette topology / adjacency
- Centerline symmetry and asymmetry
- Walk-cycle alignment and residual deformation
- Semantic construction slots

For the bundled Brendan reference, the canonical figure is **14×21 px inside a 16×32 cell**, centered around `x=7`. fileciteturn101file0L20-L24

### Reconstruct Brendan

Brendan is the golden reconstruction target.

Sprite Lab renders Brendan through the semantic construction path and compares the generated 16×32 cell against the reference. The current proof is:

```text
512 / 512 pixels matched
0 pixel diff
100% cell accuracy
```

The proof is intentionally separate from the older canonical raster replay, so a successful result actually validates the semantic renderer. fileciteturn101file0L94-L107

### Generate a new character

The same construction model can be parameterized for a new trainer rather than directly painting pixels.

The Character Creator exposes semantic parameters such as:

- head dimensions
- torso / shoulder width
- leg width
- shoe width
- hair style
- face style
- outfit
- palette roles
- facing direction

The goal is to preserve the construction language while changing the character, rather than producing twelve unrelated hand-drawn frames.

---

## Brendan's measured construction model

The current grammar records the measured canonical bands as:

| Region | Y range | Width | Pixels |
|---|---:|---:|---:|
| Head | 10–17 | 12 | 66 |
| Upper body | 18–23 | 14 | 72 |
| Lower body | 24–29 | 14 | 70 |
| Feet | 30 | 8 | 6 |

The semantic layer maps those measurements into construction slots for rendering. Those anatomical labels are explicitly treated as author-assigned hypotheses rather than claims about the original artist's internal construction. fileciteturn101file0L74-L82

The walk analysis found a strong common pattern across directions: an integer `(0,+1)` alignment followed by local lower-body / foot deformation, with the head remaining stable. fileciteturn101file0L84-L92

---

## Quick start

Sprite Lab is designed to run locally with no build step.

```text
1. Download the repository.
2. Open index.html in a browser.
3. Load the bundled Brendan reference, or load your own indexed PNG.
4. Inspect the measurements / topology sections.
5. Use the Character Creator to author a grammar-based variation.
6. Export PNG or character JSON.
```

The bundled tool is intentionally offline-friendly: the UI and reference assets are shipped together.

---

## Character Creator workflow

The intended workflow is:

```text
Choose a base construction model
            ↓
Edit semantic geometry
            ↓
Edit semantic palette roles
            ↓
Select hair / face / outfit variants
            ↓
Preview direction
            ↓
Generate
            ↓
Export
```

The creator is **not** a freehand pixel editor. It is a parameterized construction system.

That distinction matters: Brendan remains a fixed golden reference, while a custom character is produced from the same underlying grammar.

---

## Animation model

The overworld model uses four directions:

```text
South
North
West
East
```

with three pose positions per direction for the walk system.

Sprite Lab's source analysis found the same major structural pattern across Brendan's directions: head stability, a shared integer translation, and most local deformation concentrated in the lower body and feet. fileciteturn101file0L84-L92

East/West mirroring is represented explicitly where the source construction permits it.

---

## Evidence discipline

Sprite Lab separates three kinds of knowledge:

**FACT** — directly measured from the source.

**DERIVED** — computed from measured pixels, such as symmetry, walk alignment, or primitive compression.

**INTERPRETATION** — a construction hypothesis or author-assigned semantic label.

This distinction is deliberate. Palette colors can be measured exactly, but names such as `head`, `torso`, or `shoe` are not treated as source-authored facts. fileciteturn101file0L5-L18

---

## Validation

The current local QA harness exercises the renderer across thousands of parameterized combinations and checks that generated grids remain valid 16×32 integer-pixel sprites.

It also re-verifies the Brendan semantic reconstruction as **512/512, 0 pixel diff**. The QA report is a local runtime/static harness result, not a substitute for a full browser E2E suite. fileciteturn100file3

---

## Project structure

```text
Sprite Lab/
├── index.html                         # Offline workbench
├── walking.png                       # Bundled Brendan reference
├── construction-grammar-*.md         # Human-readable grammar snapshots
├── brendan-construction-recipe-*.md  # Measurement recipe
├── V0.*_QA.md                        # Runtime / validation reports
└── ...
```

The core idea is that the reference analysis remains inspectable and exportable instead of disappearing into an opaque renderer.

---

## Design goal

Sprite Lab is not trying to become a generic pixel editor.

It is trying to make the relationship between:

**pixels → structure → construction rules → animation → new character**

explicit enough to inspect, validate, and reuse.

Brendan is the proof target.
A custom trainer is the eventual output.

---

## Current status

**Working**

- forensic analysis
- palette / topology extraction
- semantic partitioning
- semantic Brendan reconstruction
- exact reconstruction proof
- grammar-based character authoring surface
- PNG / sprite-sheet / character JSON export

**Next engineering target**

- richer anatomical primitives and substitutions
- complete reusable four-direction generation for custom characters
- higher-level character presets
- tighter visual authoring controls

---

## License / source assets

Sprite Lab is an original tool and should not be confused with the proprietary source game assets it may analyze.

Use only source material you have the right to inspect and redistribute. The bundled reference is included for the specific reverse-engineering workflow demonstrated by this repository.

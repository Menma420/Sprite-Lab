# Sprite Lab v0.8.3

Offline pixel-art reverse-engineering workbench with semantic reconstruction and a parameterized character creator.

This patch hardens the v0.8 runtime: slot-local program compression, creator builder references, landmark normalization, direction mirroring, and defensive bounds checks.

v0.8 keeps the v0.7 semantic Brendan renderer and adds a practical authoring surface.

## Workflow
1. Load bundled Brendan or another indexed PNG.
2. Scroll to **Character Creator**.
3. Edit name, hair, face, outfit, direction, dimensions, and palette-role colors.
4. Preview live.
5. Export the current 16×32 PNG, a 4-direction sheet, or character JSON.

## Validation
Brendan semantic mode remains the golden 512/512, 0-diff proof and does not use canonicalRowRuns in its renderer.

## Scope
The creator is grammar-based, not a freehand pixel editor. It is designed to make a new character while retaining the same compact GBA-style construction language.

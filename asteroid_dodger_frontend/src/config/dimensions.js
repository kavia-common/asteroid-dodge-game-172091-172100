//
// Centralized game dimensions and utilities for responsive sizing.
//
// Logical size is used for game physics/logic; render size is computed
// based on viewport constraints while preserving aspect ratio.
//
// PUBLIC_INTERFACE
export const GameDimensions = {
  // Logical coordinate system for physics and game logic
  logical: {
    width: 800,
    height: 600,
    aspect: 800 / 600,
  },

  // Min/max bounds for rendering area
  // These are soft caps; final size is computed from viewport and these bounds.
  bounds: {
    minWidth: 380,
    minHeight: 320,
    maxWidth: 980,
    // Max height is dynamic via viewport cap; still provide a hard cap
    maxHeight: 780,
  },

  // Size presets for quick overrides (via URL param or settings control)
  // small: more compact height (good for tighter screens)
  // medium: default
  // large: taller within viewport cap
  // PUBLIC_INTERFACE
  presets: {
    small: { scale: 0.85 },
    medium: { scale: 1.0 },
    large: { scale: 1.15 },
  },
};

/**
 * PUBLIC_INTERFACE
 * getSizePresetFromQuery
 * Parses window.location.search for ?size=small|medium|large
 * Returns a preset object or null if not present/invalid.
 */
export function getSizePresetFromQuery() {
  try {
    const params = new URLSearchParams(window.location.search);
    const size = params.get("size");
    if (!size) return null;
    const key = String(size).toLowerCase();
    return GameDimensions.presets[key] || null;
  } catch {
    return null;
  }
}

/**
 * PUBLIC_INTERFACE
 * computeRenderSize
 * Computes the actual render width/height for the game area based on:
 * - container width
 * - viewport height cap (75-85vh)
 * - logical aspect ratio
 * - optional preset scale
 * - configured min/max bounds
 *
 * Returns { width, height, scale } where:
 * - width/height are CSS pixel sizes to apply to the canvas
 * - scale is the factor to convert from logical to render pixels:
 *     scale = min(width / logical.width, height / logical.height)
 */
export function computeRenderSize(containerW, viewportH, options = {}) {
  const { logical, bounds } = GameDimensions;
  const aspect = logical.aspect;
  const preset = options.preset || null;

  const presetScale = typeof preset?.scale === "number" ? preset.scale : 1.0;

  // Cap height to a fraction of viewport to avoid vertical clipping under header/footer.
  // Default cap: 0.80 * vh, can be adjusted slightly based on preset.
  const capVh = clamp(0.75 * presetScale, 0.70, 0.85); // between 70% and 85% vh
  const maxH = Math.min(bounds.maxHeight, Math.floor(viewportH * capVh));

  // Base container width within bounds
  const baseW = clamp(Math.floor(containerW), bounds.minWidth, bounds.maxWidth);

  // Compute ideal size keeping aspect within the capped height
  let width = baseW;
  let height = Math.floor(width / aspect);
  if (height > maxH) {
    height = maxH;
    width = Math.floor(height * aspect);
  }

  // Apply preset scale, while ensuring we still fit within maxH and container width
  let scaledW = Math.floor(width * presetScale);
  let scaledH = Math.floor(height * presetScale);

  // Re-clamp if scaled surpasses container or viewport caps
  if (scaledH > maxH) {
    scaledH = maxH;
    scaledW = Math.floor(scaledH * aspect);
  }
  if (scaledW > baseW) {
    scaledW = baseW;
    scaledH = Math.floor(scaledW / aspect);
  }

  // Final clamp to prevent going below minimums
  const finalW = clamp(scaledW, bounds.minWidth, bounds.maxWidth);
  const finalH = Math.max(
    clamp(scaledH, bounds.minHeight, bounds.maxHeight),
    Math.floor(finalW / aspect)
  );

  // Render scale factor: convert from logical space to pixel render
  const scale = Math.min(finalW / logical.width, finalH / logical.height);

  return { width: finalW, height: finalH, scale };
}

// PUBLIC_INTERFACE
export function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

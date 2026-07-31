<template>
  <div class="stack">
    <p class="display title">Construction</p>
    <p class="eyebrow">Opening Soon</p>
    <p class="muted">
      The Marketplace is under construction. When it opens, it will host handles, cosmetics,
      collectibles, and app-specific items with explicit trading permissions.
    </p>
    <ul>
      <li>Handles</li>
      <li>Cosmetics</li>
      <li>Collectibles</li>
      <li>App-local items (clearly labelled)</li>
    </ul>
    <p class="hint">Watch the site in the plaza — progress will show in the world first.</p>
  </div>
</template>

<style scoped>
.stack {
  display: grid;
  gap: 0.65rem;
}

.title {
  margin: 0;
  color: var(--nw-gold);
}

.eyebrow {
  margin: 0;
  font-family: Sora, sans-serif;
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--nw-green);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.muted {
  margin: 0;
  color: var(--nw-muted);
  line-height: 1.45;
}

.hint {
  margin: 0;
  color: var(--nw-muted);
  font-size: 0.85rem;
  line-height: 1.4;
}

ul {
  margin: 0;
  padding-left: 1.1rem;
  color: var(--nw-text);
}
</style>

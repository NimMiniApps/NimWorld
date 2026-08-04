<script setup lang="ts">
import IdenticonAvatar from './IdenticonAvatar.vue'
import { PREVIEW_FRIENDS } from './hudPreviewData'
</script>

<template>
  <aside class="nw-panel shell friends-shell" aria-label="Friends preview">
    <header class="head">
      <h2 class="title">Friends online</h2>
      <span class="nw-hud-badge">Preview</span>
    </header>

    <ul class="list">
      <li v-for="friend in PREVIEW_FRIENDS" :key="friend.handle">
        <IdenticonAvatar :address="friend.address" :fallback="friend.handle" size="2.1rem" />
        <div class="meta">
          <p class="handle">{{ friend.handle }}</p>
          <p class="place">{{ friend.place }}</p>
        </div>
        <span class="dot" :class="{ on: friend.online }" aria-hidden="true" />
      </li>
    </ul>

    <button class="view-all" type="button" disabled>View All Friends</button>
  </aside>
</template>

<style scoped>
.friends-shell {
  display: none;
  width: min(15.5rem, 22vw);
  padding: 0.6rem;
  border-color: rgba(155, 123, 255, 0.35);
  pointer-events: auto;
}

.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.title {
  margin: 0;
  font-family: var(--nw-font-pixel);
  font-size: 0.48rem;
  letter-spacing: 0.03em;
  color: var(--nw-text);
}

.list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.4rem;
}

.list li {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 0.5rem;
  padding: 0.35rem 0.3rem;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.03);
}

.handle {
  margin: 0;
  font-size: 0.8rem;
  font-weight: 700;
}

.place {
  margin: 0.1rem 0 0;
  font-size: 0.68rem;
  color: var(--nw-muted);
}

.dot {
  width: 0.55rem;
  height: 0.55rem;
  border-radius: 999px;
  background: #5a647f;
}

.dot.on {
  background: var(--nw-green);
  box-shadow: 0 0 8px rgba(79, 209, 165, 0.55);
}

.view-all {
  width: 100%;
  margin-top: 0.55rem;
  border-radius: 10px;
  border: 1px solid var(--nw-panel-border);
  background: rgba(155, 123, 255, 0.12);
  color: var(--nw-muted);
  padding: 0.45rem 0.6rem;
  font-size: 0.72rem;
  font-weight: 700;
  cursor: not-allowed;
  opacity: 0.75;
}

@media (min-width: 900px) {
  .friends-shell {
    display: block;
  }
}
</style>

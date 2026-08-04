<script setup lang="ts">
import { PREVIEW_EVENTS } from './hudPreviewData'
</script>

<template>
  <aside class="nw-panel shell events-shell" aria-label="Events preview">
    <header class="head">
      <h2 class="title">Today's events</h2>
      <span class="nw-hud-badge">Preview</span>
    </header>

    <ul class="list">
      <li v-for="event in PREVIEW_EVENTS" :key="event.title">
        <span class="bullet" aria-hidden="true">●</span>
        <div class="meta">
          <p class="event-title">{{ event.title }}</p>
          <p class="time">{{ event.time }}</p>
        </div>
      </li>
    </ul>

    <button class="view-all" type="button" disabled>View All Events</button>
  </aside>
</template>

<style scoped>
.events-shell {
  display: none;
  width: min(15.5rem, 22vw);
  padding: 0.6rem;
  border-color: rgba(245, 166, 35, 0.35);
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
  gap: 0.45rem;
}

.list li {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.45rem;
  align-items: start;
}

.bullet {
  color: var(--nw-gold);
  font-size: 0.55rem;
  margin-top: 0.25rem;
  text-shadow: 0 0 8px rgba(245, 166, 35, 0.45);
}

.event-title {
  margin: 0;
  font-size: 0.8rem;
  font-weight: 700;
}

.time {
  margin: 0.1rem 0 0;
  font-size: 0.68rem;
  color: var(--nw-muted);
}

.view-all {
  width: 100%;
  margin-top: 0.55rem;
  border-radius: 10px;
  border: 1px solid var(--nw-panel-border);
  background: rgba(245, 166, 35, 0.1);
  color: var(--nw-muted);
  padding: 0.45rem 0.6rem;
  font-size: 0.72rem;
  font-weight: 700;
  cursor: not-allowed;
  opacity: 0.75;
}

@media (min-width: 900px) {
  .events-shell {
    display: block;
  }
}
</style>

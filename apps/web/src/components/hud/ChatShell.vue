<script setup lang="ts">
import { ref } from 'vue'
import { PREVIEW_CHAT } from './hudPreviewData'

const activeTab = ref<(typeof PREVIEW_CHAT.tabs)[number]>('World')
</script>

<template>
  <aside class="nw-panel shell chat-shell" aria-label="Chat preview">
    <header class="head">
      <div class="tabs" role="tablist" aria-label="Chat channels">
        <button
          v-for="tab in PREVIEW_CHAT.tabs"
          :key="tab"
          type="button"
          role="tab"
          class="tab"
          :class="{ active: activeTab === tab }"
          :aria-selected="activeTab === tab"
          @click="activeTab = tab"
        >
          {{ tab }}
        </button>
      </div>
      <span class="nw-hud-badge">Preview</span>
    </header>

    <ul class="feed" aria-live="polite">
      <li v-for="(msg, i) in PREVIEW_CHAT.messages" :key="i">
        <span class="user">{{ msg.user }}</span>
        <span class="text">{{ msg.text }}</span>
      </li>
    </ul>

    <form class="compose" @submit.prevent>
      <input type="text" placeholder="Type a message…" disabled aria-disabled="true" />
      <button class="send" type="submit" disabled aria-label="Send (coming soon)">➤</button>
    </form>
  </aside>
</template>

<style scoped>
.chat-shell {
  display: none;
  width: min(20rem, 28vw);
  padding: 0.55rem;
  border-color: rgba(88, 196, 255, 0.28);
  pointer-events: auto;
}

.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.45rem;
}

.tabs {
  display: flex;
  gap: 0.2rem;
}

.tab {
  border: 0;
  background: transparent;
  color: var(--nw-muted);
  font-family: var(--nw-font-pixel);
  font-size: 0.42rem;
  padding: 0.35rem 0.45rem;
  border-radius: 8px;
  cursor: pointer;
}

.tab.active {
  color: var(--nw-cyan);
  background: rgba(88, 196, 255, 0.14);
}

.feed {
  list-style: none;
  margin: 0;
  padding: 0.35rem 0.25rem;
  display: grid;
  gap: 0.4rem;
  min-height: 5.5rem;
  max-height: 7.5rem;
  overflow: auto;
}

.user {
  color: var(--nw-cyan);
  font-weight: 700;
  margin-right: 0.35rem;
  font-size: 0.78rem;
}

.text {
  color: var(--nw-text);
  font-size: 0.78rem;
}

.compose {
  display: flex;
  gap: 0.35rem;
  margin-top: 0.4rem;
}

.compose input {
  flex: 1;
  min-width: 0;
  border-radius: 10px;
  border: 1px solid var(--nw-panel-border);
  background: rgba(8, 12, 28, 0.65);
  color: var(--nw-muted);
  padding: 0.45rem 0.65rem;
  font-size: 0.78rem;
}

.send {
  width: 2.2rem;
  border-radius: 10px;
  border: 1px solid rgba(88, 196, 255, 0.35);
  background: rgba(88, 196, 255, 0.16);
  color: var(--nw-cyan);
  cursor: not-allowed;
  opacity: 0.7;
}

@media (min-width: 900px) {
  .chat-shell {
    display: block;
  }
}
</style>

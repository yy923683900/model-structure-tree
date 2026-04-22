<script setup lang="ts">
import { ref } from 'vue';
import type { MstTreeNode } from '@mst/vue';

const data = ref<MstTreeNode[]>([
  {
    key: 'root',
    label: 'Model',
    children: [
      { key: 'head', label: 'Head' },
      {
        key: 'body',
        label: 'Body',
        children: [
          { key: 'arm-l', label: 'Left Arm' },
          { key: 'arm-r', label: 'Right Arm' },
        ],
      },
    ],
  },
]);

function onClick(tag: string) {
  console.log('clicked', tag);
}

function onSelect(e: Event) {
  console.log('select', (e as CustomEvent).detail);
}
</script>

<template>
  <div style="font-family: system-ui; padding: 32px">
    <h1>MST · Vue</h1>

    <div style="display: flex; gap: 12px; margin-bottom: 24px">
      <mst-button @mst-click="onClick('default')">Default</mst-button>
      <mst-button variant="primary" @mst-click="onClick('primary')">
        Primary
      </mst-button>
      <mst-button variant="danger">Danger</mst-button>
    </div>

    <mst-tree :data="data" @mst-select="onSelect" />
  </div>
</template>

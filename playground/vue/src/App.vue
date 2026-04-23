<script setup lang="ts">
import { ref } from 'vue';
import type { FeatureTreeNode, MstTreeNode } from '@mst-ui/vue';

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

const featureData = ref<FeatureTreeNode[]>([
  {
    key: '0',
    title: '建筑A',
    id: 1001,
    children: [
      {
        key: '0-0',
        title: '一层',
        id: 1002,
        children: [
          { key: '0-0-0', title: '墙体-1', id: 1003 },
          { key: '0-0-1', title: '门-1', id: 1004 },
          { key: '0-0-2', title: '窗户-1', id: 1005 },
        ],
      },
      {
        key: '0-1',
        title: '二层',
        id: 1006,
        children: [
          { key: '0-1-0', title: '墙体-2', id: 1007 },
          { key: '0-1-1', title: '楼梯', id: 1008 },
        ],
      },
    ],
  },
  {
    key: '1',
    title: '建筑B',
    id: 2001,
    children: [
      { key: '1-0', title: '屋顶', id: 2002 },
      { key: '1-1', title: '地基', id: 2003 },
    ],
  },
]);

function onClick(tag: string) {
  console.log('clicked', tag);
}
function onSelect(e: Event) {
  console.log('select', (e as CustomEvent).detail);
}
function onFeatureEvent(name: string, e: Event) {
  console.log(name, (e as CustomEvent).detail);
}
</script>

<template>
  <div style="font-family: system-ui; padding: 32px; background: #f5f7fa; min-height: 100vh">
    <h1>MST · Vue</h1>

    <section style="background: #fff; padding: 16px; border-radius: 8px; margin-bottom: 24px">
      <h2>Button</h2>
      <div style="display: flex; gap: 12px">
        <mst-button @mst-click="onClick('default')">Default</mst-button>
        <mst-button variant="primary" @mst-click="onClick('primary')">
          Primary
        </mst-button>
        <mst-button variant="danger">Danger</mst-button>
      </div>
    </section>

    <section style="background: #fff; padding: 16px; border-radius: 8px; margin-bottom: 24px">
      <h2>Simple tree</h2>
      <mst-tree :data="data" @mst-select="onSelect" />
    </section>

    <section style="background: #fff; padding: 16px; border-radius: 8px">
      <h2>Feature Tree</h2>
      <mst-feature-tree
        :data="featureData"
        :height="500"
        @mst-select="(e: Event) => onFeatureEvent('select', e)"
        @mst-visibility-change="(e: Event) => onFeatureEvent('visibility', e)"
        @mst-edit-model="(e: Event) => onFeatureEvent('edit-model', e)"
        @mst-edit-properties="(e: Event) => onFeatureEvent('edit-props', e)"
        @mst-search="(e: Event) => onFeatureEvent('search', e)"
      />
    </section>
  </div>
</template>

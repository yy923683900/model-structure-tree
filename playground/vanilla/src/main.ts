import {
  defineAll,
  type FeatureTreeNode,
  type MstTreeNode,
} from '@mst-ui/core';

defineAll();

const tree = document.querySelector('#tree') as HTMLElement & {
  data: MstTreeNode[];
};

tree.data = [
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
];

tree.addEventListener('mst-select', (e) => {
  console.log('selected:', (e as CustomEvent).detail);
});

document.querySelectorAll('mst-button').forEach((b) =>
  b.addEventListener('mst-click', () => console.log('clicked', b.textContent)),
);

// ────────────────────────────────────────────────────────────── feature-tree demo
const featureTree = document.querySelector('#feature-tree') as HTMLElement & {
  data: FeatureTreeNode[];
  selectByKey(key: string | null): void;
};

featureTree.data = [
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
];

featureTree.addEventListener('mst-select', (e) => {
  console.log('[feature-tree] select:', (e as CustomEvent).detail);
});
featureTree.addEventListener('mst-visibility-change', (e) => {
  console.log('[feature-tree] visibility:', (e as CustomEvent).detail);
});
featureTree.addEventListener('mst-edit-model', (e) => {
  console.log('[feature-tree] edit-model:', (e as CustomEvent).detail);
});
featureTree.addEventListener('mst-edit-properties', (e) => {
  console.log('[feature-tree] edit-properties:', (e as CustomEvent).detail);
});
featureTree.addEventListener('mst-search', (e) => {
  console.log('[feature-tree] search:', (e as CustomEvent).detail);
});

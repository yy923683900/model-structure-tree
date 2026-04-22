import { defineAll, type MstTreeNode } from '@mst/core';

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

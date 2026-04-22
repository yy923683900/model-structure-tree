import * as React from 'react';
import { createComponent } from '@lit/react';
import { MstButton as MstButtonElement } from '@mst/core/components/mst-button';
import { MstTree as MstTreeElement } from '@mst/core/components/mst-tree';

export type { MstButtonVariant } from '@mst/core/components/mst-button';
export type { MstTreeNode } from '@mst/core/components/mst-tree';

export const MstButton = createComponent({
  react: React,
  tagName: 'mst-button',
  elementClass: MstButtonElement,
  events: {
    onMstClick: 'mst-click',
  },
});

export const MstTree = createComponent({
  react: React,
  tagName: 'mst-tree',
  elementClass: MstTreeElement,
  events: {
    onMstSelect: 'mst-select',
  },
});

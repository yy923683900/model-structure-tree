import * as React from 'react';
import { createComponent } from '@lit/react';
import { MstButton as MstButtonElement } from '@mst-ui/core/components/mst-button';
import { MstTree as MstTreeElement } from '@mst-ui/core/components/mst-tree';
import { MstFeatureTree as MstFeatureTreeElement } from '@mst-ui/core/components/mst-feature-tree';

export type { MstButtonVariant } from '@mst-ui/core/components/mst-button';
export type { MstTreeNode } from '@mst-ui/core/components/mst-tree';
export type {
  FeatureTreeNode,
  FeatureTreeSelectDetail,
  FeatureTreeExpandDetail,
  FeatureTreeSearchDetail,
  FeatureTreeVisibilityDetail,
  FeatureTreeEditDetail,
} from '@mst-ui/core/components/mst-feature-tree';

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

export const MstFeatureTree = createComponent({
  react: React,
  tagName: 'mst-feature-tree',
  elementClass: MstFeatureTreeElement,
  events: {
    onMstSelect: 'mst-select',
    onMstExpand: 'mst-expand',
    onMstSearch: 'mst-search',
    onMstVisibilityChange: 'mst-visibility-change',
    onMstEditModel: 'mst-edit-model',
    onMstEditProperties: 'mst-edit-properties',
  },
});

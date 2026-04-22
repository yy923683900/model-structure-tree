import type { DefineComponent } from 'vue';
import type { MstButtonVariant, MstTreeNode } from './index';

/**
 * Augments Vue's JSX/template so `<mst-button>` / `<mst-tree>` have types.
 *
 * Consumers importing anything from `@mst/vue` will automatically get these
 * typings in their SFC templates.
 */
declare module 'vue' {
  export interface GlobalComponents {
    'mst-button': DefineComponent<
      {
        variant?: MstButtonVariant;
        disabled?: boolean;
      },
      object,
      object,
      object,
      object,
      object,
      object,
      {
        'mst-click': (detail: { originalEvent: MouseEvent }) => void;
      }
    >;
    'mst-tree': DefineComponent<
      {
        data?: MstTreeNode[];
      },
      object,
      object,
      object,
      object,
      object,
      object,
      {
        'mst-select': (detail: { node: MstTreeNode }) => void;
      }
    >;
  }
}

export {};

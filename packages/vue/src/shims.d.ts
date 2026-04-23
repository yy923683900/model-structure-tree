import type { DefineComponent } from 'vue';
import type {
  MstButtonVariant,
  MstTreeNode,
  FeatureTreeNode,
  FeatureTreeSelectDetail,
  FeatureTreeExpandDetail,
  FeatureTreeSearchDetail,
  FeatureTreeVisibilityDetail,
  FeatureTreeEditDetail,
} from './index';

/**
 * Augments Vue's JSX/template so `<mst-*>` tags have proper types.
 *
 * Consumers importing anything from `@mst-ui/vue` will automatically get these
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
    'mst-feature-tree': DefineComponent<
      {
        data?: FeatureTreeNode[];
        'selected-key'?: string | null;
        searchable?: boolean;
        height?: number;
        width?: number;
      },
      object,
      object,
      object,
      object,
      object,
      object,
      {
        'mst-select': (detail: FeatureTreeSelectDetail) => void;
        'mst-expand': (detail: FeatureTreeExpandDetail) => void;
        'mst-search': (detail: FeatureTreeSearchDetail) => void;
        'mst-visibility-change': (detail: FeatureTreeVisibilityDetail) => void;
        'mst-edit-model': (detail: FeatureTreeEditDetail) => void;
        'mst-edit-properties': (detail: FeatureTreeEditDetail) => void;
      }
    >;
  }
}

export {};

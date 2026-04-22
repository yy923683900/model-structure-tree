import type { App, Plugin } from 'vue';
import { defineAll } from '@mst/core';

export type { MstButtonVariant } from '@mst/core/components/mst-button';
export type { MstTreeNode } from '@mst/core/components/mst-tree';
export type {
  FeatureTreeNode,
  FeatureTreeSelectDetail,
  FeatureTreeExpandDetail,
  FeatureTreeSearchDetail,
  FeatureTreeVisibilityDetail,
  FeatureTreeEditDetail,
} from '@mst/core/components/mst-feature-tree';

/**
 * Vue plugin – registers all `<mst-*>` custom elements globally.
 *
 * NOTE: You still need to tell Vue's compiler to treat `mst-*` tags as
 * custom elements. Add this to your `vite.config.ts`:
 *
 * ```ts
 * import vue from '@vitejs/plugin-vue';
 * vue({
 *   template: {
 *     compilerOptions: {
 *       isCustomElement: (tag) => tag.startsWith('mst-'),
 *     },
 *   },
 * })
 * ```
 */
export const MstPlugin: Plugin = {
  install(_app: App) {
    defineAll();
  },
};

export { defineAll };

/**
 * A small helper you can call at app bootstrap instead of using the plugin.
 */
export function registerMstElements(): void {
  defineAll();
}

import { MstButton } from './components/mst-button/mst-button';
import { MstTree } from './components/mst-tree/mst-tree';

const registry: Array<[string, CustomElementConstructor]> = [
  ['mst-button', MstButton],
  ['mst-tree', MstTree],
];

/**
 * Register all components onto `window.customElements`.
 * Safe to call multiple times – existing definitions are skipped.
 */
export function defineAll(): void {
  if (typeof window === 'undefined' || !window.customElements) return;
  for (const [tag, ctor] of registry) {
    if (!customElements.get(tag)) {
      customElements.define(tag, ctor);
    }
  }
}

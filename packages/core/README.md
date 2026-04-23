# @mst-ui/core

Framework-agnostic Web Components built with [Lit](https://lit.dev/).

## Install

```bash
npm i @mst-ui/core
```

## Usage (Vanilla / HTML)

```html
<script type="module">
  import { defineAll } from '@mst-ui/core';
  defineAll();
</script>

<mst-button variant="primary">Hello</mst-button>
```

Or register a single component:

```ts
import '@mst-ui/core/components/mst-button';
```

## Components

- `<mst-button>` — primary / default / danger
- `<mst-tree>`   — a minimal model-structure tree (set `.data` via DOM property)

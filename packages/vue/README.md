# @mst/vue

Vue 3 bindings for `@mst/core`.

## 1. Install

```bash
npm i @mst/vue
```

## 2. Configure Vue compiler

In your `vite.config.ts`:

```ts
import vue from '@vitejs/plugin-vue';

export default {
  plugins: [
    vue({
      template: {
        compilerOptions: {
          isCustomElement: (tag) => tag.startsWith('mst-'),
        },
      },
    }),
  ],
};
```

## 3. Register elements

```ts
// main.ts
import { createApp } from 'vue';
import { MstPlugin } from '@mst/vue';
import App from './App.vue';

createApp(App).use(MstPlugin).mount('#app');
```

## 4. Use

```vue
<template>
  <mst-button variant="primary" @mst-click="onClick">Hello</mst-button>
  <mst-tree :data="data" @mst-select="onSelect" />
</template>
```

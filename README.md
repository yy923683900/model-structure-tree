# model-structure-tree

基于 **Web Components (Lit)** 的跨框架组件库。同一份源码，打包出三种产物：

| 包名         | 用途                           | 说明                                    |
| ------------ | ------------------------------ | --------------------------------------- |
| `@mst/core`  | 原生 Web Components（Lit）     | 任意 HTML / Vue / Svelte / Angular 项目 |
| `@mst/react` | 基于 `@lit/react` 的 React 绑定 | 原生 JSX 事件、受控属性、ref           |
| `@mst/vue`   | Vue 3 适配插件 + 类型声明      | `app.use(MstPlugin)` 即可               |

---

## 目录结构

```
.
├── packages/
│   ├── core/          # Web Components 源码（Lit + TS）
│   ├── react/         # React 包装器
│   └── vue/           # Vue 包装器 + Plugin
├── playground/
│   ├── vanilla/       # 纯 HTML 联调
│   ├── react/         # React 联调
│   └── vue/           # Vue 3 联调
├── pnpm-workspace.yaml
├── tsconfig.base.json
└── package.json
```

## 开发

```bash
# 先装 pnpm（>= 8）
npm i -g pnpm

# 安装全部依赖
pnpm install

# 并行 watch 所有 packages
pnpm dev

# 跑某个 playground
pnpm play:vanilla
pnpm play:react
pnpm play:vue
```

## 构建

```bash
pnpm build            # 构建全部 packages
pnpm build:core       # 只构建 core
pnpm build:react      # 只构建 react
pnpm build:vue        # 只构建 vue
```

每个包都会产出：

```
dist/
├── index.js         # ESM
├── index.cjs        # CJS
├── index.d.ts       # 类型
└── ...
```

## 发布流程建议

1. 按序构建：`core` → `react` → `vue`（因为后两者依赖 `core`）。
2. 首次发布前把各包 `package.json` 里的 `workspace:*` 由 pnpm 自动转为实际版本（`pnpm publish` 会处理）。
3. 推荐使用 [changesets](https://github.com/changesets/changesets) 管理版本和 changelog。

```bash
pnpm add -Dw @changesets/cli
pnpm changeset init
```

## 新增组件的约定

1. 在 `packages/core/src/components/mst-xxx/mst-xxx.ts` 用 Lit 写组件。
2. 在 `packages/core/src/define.ts` 里加入 `registry`。
3. 在 `packages/core/vite.config.ts` 的 `lib.entry` 里追加子入口（可选，单独引用时需要）。
4. 在 `packages/react/src/index.ts` 里用 `createComponent` 暴露 React 版本。
5. 在 `packages/vue/src/shims.d.ts` 里补上 Vue 的模板类型。

## 为什么要三个包？

Web Component 在各框架里的直接使用有这些坑：

- **React（< 19）**
  - 属性只会作为 HTML attribute（字符串）传递，无法传 object / array。
  - `on*` 事件只识别原生事件名（`onclick`），自定义事件如 `mst-click` 识别不到。
  - `@lit/react` 的 `createComponent` 解决了这两点，并补上 ref / controlled 表单等细节。
- **Vue 3**
  - 需要告诉编译器哪些标签是自定义元素（`isCustomElement`）。
  - 事件可以直接 `@mst-click` 监听，但类型提示需要在模板里补声明。

因此将框架适配层单独成包，业务侧直接 `import` 即可，零配置、零心智负担。

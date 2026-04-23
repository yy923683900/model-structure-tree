# @mst-ui/react

React bindings for `@mst-ui/core`.

```tsx
import { MstButton, MstTree } from '@mst-ui/react';

export default function App() {
  return (
    <>
      <MstButton variant="primary" onMstClick={(e) => console.log(e)}>
        Hello
      </MstButton>
      <MstTree data={[{ key: 'a', label: 'root' }]} />
    </>
  );
}
```

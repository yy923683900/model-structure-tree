# @mst/react

React bindings for `@mst/core`.

```tsx
import { MstButton, MstTree } from '@mst/react';

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

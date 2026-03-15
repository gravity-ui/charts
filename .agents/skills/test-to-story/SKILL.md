---
name: test-to-story
description: Create a Storybook story from a visual test case, or delete a story created from a test. Use when the user provides a link to a test case, asks to create a story from a test, or to remove a story from the From Tests scope.
---

# Test to Story

Create a Storybook story from a Playwright visual test case, or delete one. Stories live in the **From Tests** scope so they are easy to find and remove.

**Do not create a plan.** This is an ad-hoc utility task — execute the steps directly and produce the result.

## Create a story from a test case

**Input:** Path to test file + test name (e.g. `src/__tests__/area-series.visual.test.tsx`, test `Basic`).

**Steps:**

1. Read the test file and locate the test by name (e.g. `test('Basic', async ({mount}) => {...})`).
2. Extract the `data` passed to `<ChartTestStory data={...} />`. It can be:
   - **Imported fixture** (e.g. `areaBasicData`) — story imports the same fixture.
   - **Inline object** — create `src/__stories__/__data__/from-tests/<slug>.ts` and export the data, then import in the story.
   - **Modified fixture** (e.g. `cloneDeep(areaStakingNormalData)` + `set(...)`) — create a fixture in `from-tests/` that reproduces the result.
3. Create the story file:

**Path:** `src/__stories__/FromTests/<TestFile>-<TestName>.stories.tsx`

Example: `src/__stories__/FromTests/area-series-Basic.stories.tsx`

**Story template:**

```tsx
import type {Meta, StoryObj} from '@storybook/react';
import {ChartStory} from '../ChartStory';
import {areaBasicData} from '../__data__'; // or from '../__data__/from-tests/...'

const meta: Meta<typeof ChartStory> = {
  title: 'From Tests/Area series/Basic',
  render: ChartStory,
};

export default meta;

type Story = StoryObj<typeof ChartStory>;

export const Basic = {
  args: {
    data: areaBasicData,
    // style: {...} — only if the test explicitly set styles
  },
} satisfies Story;
```

4. Use `title: 'From Tests/<source>/<test-name>'` so the story groups under "From Tests" in the sidebar. To pin "From Tests" near the top, add it to `storySort.order` in `.storybook/preview.tsx`:

   ```js
   order: ['Showcase', 'From Tests'],
   ```

5. Add `style` to args **only if the test explicitly sets styles** (e.g. custom dimensions, `chartStyles`, `styles`). Do not add style by default — ChartTestStory's fixed dimensions are for snapshot consistency, not for the story.

6. **After creating the story**, add a message with a link to open it in Storybook (port 7007). Format: `http://localhost:7007/?path=/story/<story-id>`.

   **Story ID format:** `<path>--<story-name>`
   - **Path:** all title segments joined and slugified. "From Tests/Bar-y series/Border should be ignored for dense bars" → `from-tests-bar-y-series-border-should-be-ignored-for-dense-bars`
   - **Story name:** slugified export name. `BorderShouldBeIgnoredForDenseBars` → `border-should-be-ignored-for-dense-bars`
   - **Result:** `from-tests-bar-y-series-border-should-be-ignored-for-dense-bars--border-should-be-ignored-for-dense-bars`

## Delete a story from From Tests

**Input:** Story file path, story file attached via @, or story name.

**Steps:**

1. Delete the story file: `src/__stories__/FromTests/<name>.stories.tsx`.
2. If the story used a fixture from `__data__/from-tests/<slug>.ts` and no other story uses it, delete that fixture file too.

## Naming convention

| Test file                     | Test name         | Story file                                    |
| ----------------------------- | ----------------- | --------------------------------------------- |
| `area-series.visual.test.tsx` | `Basic`           | `FromTests/area-series-Basic.stories.tsx`     |
| `tooltip.visual.test.tsx`     | `More points row` | `FromTests/tooltip-MorePointsRow.stories.tsx` |

Use kebab-case for file names. Replace spaces in test names with nothing or hyphens.

## Examples

See [examples.md](examples.md) for concrete usage examples.

## Reference

- Test pattern: `test('Name', async ({mount}) => { const component = await mount(<ChartTestStory data={data} />); ... })`
- ChartTestStory: `playwright/components/ChartTestStory.tsx` — wraps ChartStory with fixed size
- ChartStory: `src/__stories__/ChartStory.tsx` — main story renderer
- Fixtures: `src/__stories__/__data__/` — create `from-tests/` subfolder for extracted inline data

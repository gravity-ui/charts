---
name: stand-to-story
description: Extract ChartData from a live stand (staging environment) via CDP and create a Storybook reproduction story. Use when the user provides a data-qa attribute value (e.g. chartkit-body-entry-abc123xyz) and wants to reproduce a chart from the stand in Storybook.
---

# Stand to Story

Extract `ChartData` from a running browser connected via CDP and create a ready-to-use Storybook story in `src/__stories__/Reproduction/`.

**Do not create a plan.** Execute the steps directly and produce the result.

## Prerequisites

The browser must be running with `--remote-debugging-port=9222`. If the user hasn't set this up yet, point them to [browser-setup.md](browser-setup.md) for browser-specific setup instructions.

## Input

The user provides:

- **`data-qa` value** — the `data-qa` attribute of the chart wrapper element, e.g. `chartkit-body-entry-abc123xyz`
- **URL substring** _(optional)_ — part of the page URL to select the right browser tab if multiple tabs are open

## Steps

1. Run the extraction script from the repo root:

```bash
node .agents/skills/stand-to-story/extract-chart-story.mjs <data-qa-value> [url-substring]
```

Example:

```bash
node .agents/skills/stand-to-story/extract-chart-story.mjs chartkit-body-entry-abc123xyz
node .agents/skills/stand-to-story/extract-chart-story.mjs chartkit-body-entry-abc123xyz wizard
```

2. The script will:
   - Connect to the browser on `localhost:9222`
   - Find the element by `data-qa` attribute
   - Traverse the React Fiber tree to extract `ChartData`
   - Drop function props (not serializable)
   - Strip fields unknown to `ChartData` types (via `tsc`)
   - Format the file with Prettier
   - Write `src/__stories__/Reproduction/Story-<id>.stories.tsx`

3. After the script succeeds, provide the user with a link to open the story in Storybook (port 7007):

   **Story ID format:** `reproduction-story-<id>--default`

   Example: `http://localhost:7007/?path=/story/reproduction-story-abc123xyz--default`

## Troubleshooting

**`Could not connect to browser on port 9222`**
The browser is not running with the debug flag. Ask the user to restart it following the instructions in [browser-setup.md](browser-setup.md).

**`Element [data-qa="..."] not found on this page`**
The script is using the wrong tab. Ask for a URL substring to narrow down the page, then re-run with it as the second argument.

**`No ChartData found in fiber subtree`**
The chart hasn't finished rendering yet. Ask the user to wait for the chart to load and try again.

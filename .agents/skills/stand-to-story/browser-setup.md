# Browser Setup for extract-chart-story

The script connects to a running browser via Chrome DevTools Protocol (CDP). The browser must be started with `--remote-debugging-port=9222` and a separate `--user-data-dir`. The session is preserved in `user-data-dir`, so you only need to log in to the stand once.

## Requirements

- Node.js 18+
- `@playwright/test` — already in project dependencies
- Any Chromium-based browser

## Add a shell alias

Add an alias to `~/.zshrc` (or `~/.bashrc`) so you don't have to type the flags every time:

**Yandex Browser**

```bash
alias ybrowser='/Applications/Yandex.app/Contents/MacOS/Yandex \
  --remote-debugging-port=9222 \
  --user-data-dir=/tmp/yandex-debug'
```

**Google Chrome**

```bash
alias chrome='/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --remote-debugging-port=9222 \
  --user-data-dir=/tmp/chrome-debug'
```

**Microsoft Edge**

```bash
alias edge='/Applications/Microsoft\ Edge.app/Contents/MacOS/Microsoft\ Edge \
  --remote-debugging-port=9222 \
  --user-data-dir=/tmp/edge-debug'
```

**Other Chromium-based browser** — find the path to the binary and substitute it above. Any Chromium-based browser works.

Apply the changes:

```bash
source ~/.zshrc
```

## Usage

### 1. Start the browser

```bash
ybrowser   # or chrome / edge — whichever alias you added
```

### 2. Log in to the stand

Navigate to the page with the chart. The session is saved in `--user-data-dir`, so subsequent runs don't require re-authentication.

### 3. Find the `data-qa` attribute of the chart

Each chart has a wrapper element with an attribute like:

```
data-qa="chartkit-body-entry-abc123xyz"
```

Find it via DevTools (Elements panel → inspect the chart) or DOM search.

### 4. Run the script

```bash
node .agents/skills/stand-to-story/extract-chart-story.mjs <data-qa-value>
```

Example:

```bash
node .agents/skills/stand-to-story/extract-chart-story.mjs chartkit-body-entry-abc123xyz
```

If the script picks the wrong tab (multiple tabs open), pass a URL substring as the second argument:

```bash
node .agents/skills/stand-to-story/extract-chart-story.mjs chartkit-body-entry-abc123xyz wizard
```

### 5. Open the story in Storybook

```bash
npm run dev
```

The story will appear under **Reproduction → Story-&lt;id&gt;**.

## Example output

```
Connecting to browser on localhost:9222...
Using page: https://your-stand.example.com/dashboard
Looking for element: [data-qa="chartkit-body-entry-abc123xyz"]
Note: 2 function prop(s) were dropped (not serializable).
Stripping unknown fields not in ChartData types: custom

Story created: src/__stories__/Reproduction/Story-abc123xyz.stories.tsx
```

## Troubleshooting

**`Could not connect to browser on port 9222`**
The browser was not started with the `--remote-debugging-port=9222` flag. Close it and reopen using the alias.

**`Element [data-qa="..."] not found on this page`**
The script is using the wrong tab. Pass a URL substring as the second argument to select the right page.

**`No ChartData found in fiber subtree`**
The chart hasn't finished rendering yet (data is still loading). Wait for it to load and run again.

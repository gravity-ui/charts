# stand-to-story — Usage

## First-time setup

Before using this skill, configure your browser to run with a debug port. See [browser-setup.md](browser-setup.md) for instructions.

## Create a story from the stand

1. Open the stand in your browser using the alias from the setup (e.g. `ybrowser`)
2. Navigate to the page with the chart you want to reproduce
3. Find the `data-qa` attribute on the chart wrapper element via DevTools (Elements panel → inspect the chart → look for `data-qa="chartkit-body-entry-..."`)
4. Type `/stand-to-story` in the chat and provide the `data-qa` value:

```
/stand-to-story chartkit-body-entry-abc123xyz
```

If you have multiple tabs open and the script picks the wrong one, add a URL substring to target the right tab:

```
/stand-to-story chartkit-body-entry-abc123xyz wizard
```

Here `wizard` matches any tab whose URL contains that word (e.g. `https://stand.example.com/wizard/...`).

The agent will run the extraction script and give you a direct Storybook link to the new story.

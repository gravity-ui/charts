# test-to-story — Usage (Cursor)

## Create a story from a test

1. Type `/test-to-story` in the chat
2. Open the test file (e.g. `src/__tests__/area-series.visual.test.tsx`)
3. Select the line(s) with the `test(...)` call you want to turn into a story
4. Press `Cmd+L` (Add to Chat) to attach the selection
5. Press Enter in the chat

The agent will create the story in the From Tests scope.

## Delete a story

1. Type `/test-to-story`
2. Either:
   - Attach the story file with `@` (select `FromTests/...stories.tsx`) and say "delete" or "remove"
   - Or ask by name (e.g. "Remove From Tests / Area series / Basic")
3. Press Enter

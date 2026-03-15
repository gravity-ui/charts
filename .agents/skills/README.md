# Agent Skills for Gravity UI Charts

Skills for AI agents (Cursor, Claude Code, etc.) when working with the gravity-ui/charts project.

## How to use

**Cursor / Claude Code:**

- Type `/` + skill name to run a skill (e.g. `/test-to-story`)
- Type `@` and select a skill to attach it as context to your message
- The agent can also load skills automatically when your request matches a skill's description

## Available skills

| Skill                           | Description                                                                                           |
| ------------------------------- | ----------------------------------------------------------------------------------------------------- |
| [test-to-story](test-to-story/) | Create a Storybook story from a visual test case, or delete it. Stories go to the "From Tests" scope. |

Skills live in subdirectories. Each skill is a directory with `SKILL.md`.

## Claude Code

Cursor loads skills from `.agents/skills/`. Claude Code only loads from `.claude/skills/`.

**Setup (from repo root):**

```bash
mkdir -p .claude
ln -s "$(pwd)/.agents/skills" .claude/skills
```

If the symlink does not work (e.g. on some Windows setups), copy the skills instead:

```bash
mkdir -p .claude
cp -r .agents/skills .claude/
```

After setup, reload the Cursor extension or the workspace (Cmd+Shift+P → "Developer: Reload Window") so skills are picked up. Start a new Claude Code session in the project root. Skills appear as `/test-to-story` etc.

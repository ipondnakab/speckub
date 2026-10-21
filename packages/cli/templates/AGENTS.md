# SpecKub instructions for Codex

This repository uses SpecKub Markdown API specifications.

Before changing an HTTP endpoint:
1. Find its endpoint ID with `speckub list` (or `node packages/cli/dist/bin.js list` when working in the SpecKub monorepo).
2. Inspect the current specification using `speckub inspect <endpoint-id>`.
3. Update the relevant `docs/api/**/*.md` frontmatter and Markdown body when behavior changes.
4. Preserve stable endpoint IDs unless the endpoint is intentionally replaced.
5. Run `speckub validate --id <endpoint-id>` and the project's tests.
6. Explain any failed checks and never claim semantic verification was performed: the current validator reports semantic checks as skipped.

Do not invent source paths or overwrite existing instructions. Source paths are repository-relative. A spec change is not proof that code implements it.

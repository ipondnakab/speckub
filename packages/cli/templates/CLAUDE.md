# SpecKub instructions for Claude Code

Maintain API documentation as versioned Markdown under `docs/api/`.

When modifying an API route:
- Use `speckub list` to discover endpoint IDs and `speckub inspect <endpoint-id>` to read metadata.
- Keep YAML frontmatter (`specVersion`, `id`, `kind`, `method`, `path`, `summary`, optional `source`) consistent with the implementation.
- Keep endpoint IDs stable, update request/response behavior in Markdown, and check repository-relative source paths.
- Run `speckub validate --id <endpoint-id>` plus relevant application tests.
- Report structural/reference validation separately from semantic correctness; semantic validation is not implemented.

Do not replace existing project-specific instructions without human review.

#!/usr/bin/env bash
set -euo pipefail

# pnpm pack writes its archive in the package directory. Avoid unsupported
# npm-only pack flags and verify what would actually be published.
for package in schema core cli; do
  (
    cd "packages/$package"
    pnpm pack
  )
done

for package in schema core cli; do
  archive="packages/$package/speckub-$package-0.1.2.tgz"
  test -f "$archive"
  contents=$(tar -tzf "$archive")
  grep -Fxq 'package/package.json' <<< "$contents"
  grep -Fxq 'package/dist/index.js' <<< "$contents" || {
    if [[ "$package" != "cli" ]]; then
      echo "Missing entrypoint in $archive" >&2
      exit 1
    fi
  }
done

cli_archive="packages/cli/speckub-cli-0.1.2.tgz"
cli_contents=$(tar -tzf "$cli_archive")
grep -Fxq 'package/dist/bin.js' <<< "$cli_contents"
grep -Fxq 'package/dist/init.js' <<< "$cli_contents"
grep -Fxq 'package/dist/scan.js' <<< "$cli_contents"
grep -Fxq 'package/dist/ui.js' <<< "$cli_contents"
for asset in index.html reader.js styles.css NOTICE.txt; do
  grep -Fxq "package/templates/reader/$asset" <<< "$cli_contents"
done
for skill in scan relations create validate clarify template; do
  grep -Fxq "package/templates/skills/speckub-$skill/SKILL.md" <<< "$cli_contents"
done
for template in AGENTS.md CLAUDE.md speckub.mdc; do
  grep -Fxq "package/templates/$template" <<< "$cli_contents"
done

grep -Fxq 'package/templates/skills/speckub-create/references/sequence-diagrams.md' <<< "$cli_contents"
grep -Fxq 'package/templates/skills/speckub-create/references/api-document.md' <<< "$cli_contents"

for document in api-template.md api-example.md; do
  grep -Fxq "package/templates/documents/$document" <<< "$cli_contents"
done

echo "All SpecKub package archives passed inspection."

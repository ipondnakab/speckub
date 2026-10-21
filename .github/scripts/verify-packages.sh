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
  archive="packages/$package/speckub-$package-0.1.0.tgz"
  test -f "$archive"
  tar -tzf "$archive" | grep -Fxq 'package/package.json'
  tar -tzf "$archive" | grep -Fxq 'package/dist/index.js' || {
    if [[ "$package" != "cli" ]]; then
      echo "Missing entrypoint in $archive" >&2
      exit 1
    fi
  }
done

cli_archive="packages/cli/speckub-cli-0.1.0.tgz"
tar -tzf "$cli_archive" | grep -Fxq 'package/dist/bin.js'
tar -tzf "$cli_archive" | grep -Fxq 'package/dist/init.js'
for template in AGENTS.md CLAUDE.md speckub.mdc; do
  tar -tzf "$cli_archive" | grep -Fxq "package/templates/$template"
done

echo "All SpecKub package archives passed inspection."

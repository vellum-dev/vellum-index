#!/bin/sh
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SITE_DIR="$(dirname "$SCRIPT_DIR")"
VELLUM_DIR="$(dirname "$SITE_DIR")/vellum"
DEST="$SITE_DIR/src/data/packages-metadata.json"

if [ -f "$VELLUM_DIR/packages-metadata.json" ]; then
    echo "Copying packages-metadata.json from vellum repo..."
    cp "$VELLUM_DIR/packages-metadata.json" "$DEST"
    echo "Done."
elif [ -f "$VELLUM_DIR/scripts/generate-metadata.sh" ]; then
    echo "Generating packages-metadata.json..."
    (cd "$VELLUM_DIR" && ./scripts/generate-metadata.sh)
    cp "$VELLUM_DIR/packages-metadata.json" "$DEST"
    echo "Done."
else
    echo "Warning: No packages-metadata.json found, using existing data."
fi

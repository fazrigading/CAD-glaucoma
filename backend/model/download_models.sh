#!/bin/bash
# Download model files from private GitHub release
# Requires: gh CLI authenticated with access to the private repo

REPO="fazrigading/cad-glaucoma-models"
TAG="v1.0"
MODEL_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "Downloading model files from $REPO..."

gh release download "$TAG" \
  --repo "$REPO" \
  --pattern "*.h5" \
  --dir "$MODEL_DIR" \
  --clobber

echo "Models downloaded to $MODEL_DIR"
ls -la "$MODEL_DIR"/*.h5

#!/bin/bash
set -e

echo "Copying shared dependencies into handler directories..."

# Services
for handler in admin invoicing payments shipping; do
  mkdir -p "dist/handlers/$handler/services"
  cp dist/services/*.js "dist/handlers/$handler/services/" 2>/dev/null || true
  cp dist/services/*.js.map "dist/handlers/$handler/services/" 2>/dev/null || true
done

# Utils
for handler in auth orders users admin; do
  mkdir -p "dist/handlers/$handler/utils"
  cp dist/utils/*.js "dist/handlers/$handler/utils/" 2>/dev/null || true
  cp dist/utils/*.js.map "dist/handlers/$handler/utils/" 2>/dev/null || true
done

echo "Fixing relative import paths for SAM Lambda runtime..."

# Fix services imports
for handler in admin invoicing payments shipping; do
  if [ -f "dist/handlers/$handler/index.js" ]; then
    sed -i '' 's|"../../services/|"./services/|g' "dist/handlers/$handler/index.js"
  fi
done

# Fix utils imports
for handler in auth orders users admin; do
  if [ -f "dist/handlers/$handler/index.js" ]; then
    sed -i '' 's|"../../utils/|"./utils/|g' "dist/handlers/$handler/index.js"
  fi
done

echo "Done."

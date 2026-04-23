#!/bin/sh

# Runtime Environment Variable Injection for Vite
# This script replaces placeholder values in the built files with actual environment variables

# Define placeholders
PLACEHOLDER_URL="__VITE_SUPABASE_URL_PLACEHOLDER__"
PLACEHOLDER_KEY="__VITE_SUPABASE_ANON_KEY_PLACEHOLDER__"

# Get actual values from environment
ACTUAL_URL="${VITE_SUPABASE_URL}"
ACTUAL_KEY="${VITE_SUPABASE_ANON_KEY}"

echo "🔧 Injecting runtime environment variables..."

# Find all JS files in dist and replace placeholders
find /app/dist -type f -name "*.js" -exec sed -i \
  -e "s|${PLACEHOLDER_URL}|${ACTUAL_URL}|g" \
  -e "s|${PLACEHOLDER_KEY}|${ACTUAL_KEY}|g" \
  {} +

echo "✅ Environment variables injected successfully!"
echo "   VITE_SUPABASE_URL: ${ACTUAL_URL}"
echo "   VITE_SUPABASE_ANON_KEY: ${ACTUAL_KEY:0:20}..."

# Start the server
exec serve -s dist -l 80 -n

#!/bin/sh
set -e

echo "Waiting for MongoDB and checking seed status..."
node scripts/wait-and-seed.js

echo "Starting API server..."
exec node src/server.js

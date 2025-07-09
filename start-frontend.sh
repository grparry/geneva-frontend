#!/bin/bash
# Start Geneva Frontend in background

cd "$(dirname "$0")"

# Check if already running
if lsof -Pi :8401 -sTCP:LISTEN -t >/dev/null ; then
    echo "Frontend already running on port 8401"
    exit 1
fi

# Start in background
nohup npm start > frontend.log 2>&1 &
PID=$!

# Save PID
echo $PID > frontend.pid

echo "Frontend started with PID: $PID"
echo "Logs: $(pwd)/frontend.log"
echo "To stop: ./stop-frontend.sh"
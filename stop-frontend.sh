#!/bin/bash
# Stop Geneva Frontend

cd "$(dirname "$0")"

# Try to use PID file first
if [ -f frontend.pid ]; then
    PID=$(cat frontend.pid)
    if kill -0 $PID 2>/dev/null; then
        echo "Stopping frontend (PID: $PID)..."
        kill $PID
        rm frontend.pid
        echo "Frontend stopped"
    else
        echo "Process not found, cleaning up PID file"
        rm frontend.pid
    fi
else
    # Fall back to port-based kill
    echo "No PID file found, trying to stop by port..."
    PID=$(lsof -ti:8401)
    if [ ! -z "$PID" ]; then
        echo "Stopping frontend on port 8401 (PID: $PID)..."
        kill $PID
        echo "Frontend stopped"
    else
        echo "No frontend process found on port 8401"
    fi
fi
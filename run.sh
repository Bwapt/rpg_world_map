#!/bin/bash

echo "🚀 Starting RPG Map project..."

# --- Backend ---
echo "🟢 Starting backend (Flask)..."
cd backend

# Active le venv si présent
if [ -d "venv" ]; then
  source venv/bin/activate
fi

python app.py &
BACK_PID=$!

cd ..

# --- Frontend ---
echo "🔵 Starting frontend (static server)..."
cd frontend

python -m http.server 8000 &
FRONT_PID=$!

cd ..

echo "✅ Servers running:"
echo "Frontend → http://localhost:8000"
echo "Backend  → http://localhost:8001"

# Stop propre avec CTRL+C
trap "echo '🛑 Stopping servers...'; kill $BACK_PID $FRONT_PID; exit" INT

wait
#!/bin/bash
echo "Iniciando Mercado Franquia..."
cd ~/Developer/mercadofranquia/api && uvicorn main:app --reload --port 8000 &
sleep 3
cd ~/Developer/mercadofranquia/inteligencia && npm run dev &
echo "Pronto! Backend: http://localhost:8000 | Frontend: http://localhost:3000"
wait

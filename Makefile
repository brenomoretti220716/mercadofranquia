.PHONY: dev api frontend install db clean

# Roda API + Frontend em paralelo
dev:
	@echo "Iniciando API e Frontend..."
	@make api & make frontend

# Roda a API (FastAPI + Uvicorn)
api:
	cd api && uvicorn main:app --reload --port 8000

# Roda o frontend (Next.js)
frontend:
	cd inteligencia && npm run dev

# Instala todas as dependências
install:
	cd api && pip install -r requirements.txt
	cd inteligencia && npm install

# Popula o banco de dados
db:
	cd api && python3 database.py

# Limpa arquivos gerados
clean:
	rm -rf inteligencia/.next inteligencia/node_modules
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	@echo "Limpo."

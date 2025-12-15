# Docker Setup

## Prérequis
- Docker & Docker Compose
- Clé OpenRouter

## Lancer avec Docker Compose

1) Créer `.env` avec votre clé OpenRouter:
```bash
OPENROUTER_API_KEY=sk-or-...
LLM_MODEL=mistralai/mistral-7b-instruct:free
```

2) Lancer:
```bash
docker-compose up -d
```

L'API est accessible sur `http://localhost:8001`

## Commandes utiles

```bash
# Voir les logs
docker-compose logs -f backend

# Arrêter
docker-compose down

# Reconstruire l'image
docker-compose build --no-cache

# Exécuter un shell dans le conteneur
docker exec -it data-scientist-backend bash
```

## Build manuel

```bash
docker build -t data-scientist-backend .
docker run -p 8001:8001 \
  -e OPENROUTER_API_KEY=sk-or-... \
  data-scientist-backend
```

## Volumes

- `data/` : données persistantes
- `logs/` : fichiers logs

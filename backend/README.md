# Backend - AI Data Analysis API

API FastAPI pour l'analyse de données avec IA utilisant CrewAI et OpenRouter (par défaut `mistralai/mistral-7b-instruct:free`).

## Structure du projet

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py          # Point d'entrée de l'application
│   ├── config.py        # Configuration centralisée
│   ├── database.py      # Configuration de la base de données
│   ├── models.py        # Modèles Pydantic pour les requêtes/réponses
│   ├── core/
│   │   ├── __init__.py
│   │   └── logging.py   # Configuration du logging
│   └── routers/
│       ├── __init__.py
│       ├── data.py      # Endpoints pour la gestion des données
│       └── analysis.py  # Endpoints pour l'analyse et visualisation
├── scripts/             # Scripts CrewAI (agents, tâches, etc.)
├── requirements.txt     # Dépendances Python
├── test_api.py          # Tests de l'API
└── README.md            # Cette documentation
```

## Fonctionnalités

- Upload de données CSV avec validation
- Analyse de données via CrewAI + LLM OpenRouter
- Visualisations générées côté IA
- Cache d'analyses (TTL 1h) pour réduire les appels LLM
- Persistance SQLite et logging structuré
- Configuration centralisée via variables d'environnement

## Installation

1) Créer un environnement virtuel
```bash
python -m venv venv
# Windows
venv\Scripts\activate
```

2) Installer les dépendances
```bash
pip install -r requirements.txt
```

3) Configurer `.env` (exemple)
```env
# Clé OpenRouter obligatoire
OPENROUTER_API_KEY=sk-or-...

# Modèle par défaut
LLM_MODEL=mistralai/mistral-7b-instruct:free

# Base de données et logs
DATABASE_URL=sqlite:///./data.db
LOG_LEVEL=INFO
```

## Lancement

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8001
```

L'API sera disponible sur http://localhost:8001

## Endpoints principaux

- `GET /` : infos API
- `GET /health` : statut
- `POST /data/upload` : charger un CSV
- `GET /data/info` : métadonnées du dataset
- `GET /data/download` : télécharger le dataset
- `DELETE /data/clear` : vider le dataset
- `POST /analysis/analyze` : analyse IA (CrewAI + OpenRouter)
- `POST /analysis/visualize` : génération de visuels

## Développement

### Tests

```bash
python test_api.py
```

### Logging

Niveau défini par `LOG_LEVEL`. Les événements clés sont émis par `app.core.logging` et `scripts.crew`.

### Base de données

SQLite par défaut (`data.db`). Changeable via `DATABASE_URL`.
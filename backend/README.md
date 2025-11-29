# Backend - AI Data Analysis API

API FastAPI pour l'analyse de données avec IA utilisant CrewAI et Groq.

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
├── test_api.py         # Tests de l'API
└── README.md           # Cette documentation
```

## Fonctionnalités

- **Upload de données CSV** avec validation
- **Analyse de données** avec IA (CrewAI + Groq)
- **Génération de visualisations** interactives
- **Persistance des données** dans SQLite
- **Logging structuré** pour le debugging
- **Configuration centralisée** via variables d'environnement

## Installation

1. Créer un environnement virtuel :
```bash
python -m venv venv
source venv/bin/activate  # Sur Windows: venv\Scripts\activate
```

2. Installer les dépendances :
```bash
pip install -r requirements.txt
```

3. Configurer les variables d'environnement dans `.env` :
```env
GROQ_API_KEY=your_groq_api_key
DATABASE_URL=sqlite:///./data.db
LOG_LEVEL=INFO
```

## Lancement

```bash
python -m app.main
```

L'API sera disponible sur `http://localhost:8000`

## Endpoints

- `GET /` - Informations sur l'API
- `GET /health` - Vérification de l'état
- `POST /data/upload` - Upload d'un fichier CSV
- `GET /data/info` - Informations sur les données chargées
- `GET /data/download` - Téléchargement des données
- `DELETE /data/clear` - Suppression des données
- `POST /analysis/analyze` - Analyse des données avec IA
- `POST /analysis/visualize` - Génération de visualisations

## Développement

### Tests

```bash
python test_api.py
```

### Logging

Les logs sont écrits dans `app.log` et affichés dans la console selon le niveau configuré.

### Base de données

Par défaut, utilise SQLite (`data.db`). Modifiable via `DATABASE_URL`.
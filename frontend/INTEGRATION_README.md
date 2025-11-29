# Intégration API FastAPI avec Vivid Analyzer

Cette intégration ajoute la possibilité de créer des visualisations IA directement depuis le chatbot de l'interface Vivid Analyzer.

## 🚀 Fonctionnalités ajoutées

### 1. **Icône d'outil de visualisation**
- Nouveau bouton avec icône de graphique dans le chatbot
- Permet de créer des visualisations Plotly basées sur des prompts en langage naturel

### 2. **Modal de visualisation Plotly**
- Affichage des graphiques générés par l'IA
- Interface interactive avec Plotly
- Boutons de fermeture et d'actualisation

### 3. **Service API intégré**
- Communication avec l'API FastAPI locale
- Upload automatique des données
- Gestion des erreurs et des états de chargement

## 📁 Fichiers ajoutés/modifiés

### Nouveaux fichiers :
- `src/services/api.ts` - Service pour communiquer avec l'API FastAPI
- `src/config/api.ts` - Configuration de l'API
- `src/components/PlotlyVisualization.tsx` - Composant modal pour les visualisations

### Fichiers modifiés :
- `src/components/AIChat.tsx` - Ajout de l'icône d'outil et de la logique de visualisation

## 🔧 Configuration requise

### 1. **API FastAPI en cours d'exécution**
```bash
# Dans le dossier racine du projet
python api.py
```

### 2. **Variables d'environnement**
Assurez-vous que votre fichier `.env` contient :
```env
GROQ_API_KEY=your_groq_api_key_here
CREWAI_TRACING_ENABLED=true
```

### 3. **Dépendances installées**
```bash
# Dans le dossier vivid-analyzer-main
npm install
```

## 🎯 Utilisation

### 1. **Démarrer l'API FastAPI**
```bash
# Terminal 1 - API Backend
python api.py
```

### 2. **Démarrer l'interface React**
```bash
# Terminal 2 - Frontend
cd vivid-analyzer-main
npm run dev
```

### 3. **Utiliser la fonctionnalité**
1. Uploadez un fichier CSV dans l'interface
2. Allez dans l'onglet "Assistant IA"
3. Tapez votre demande de visualisation (ex: "créer un graphique en barres des ventes par mois")
4. Cliquez sur l'icône de graphique (📊) à côté du bouton d'envoi
5. La visualisation s'affichera dans un modal

## 🎨 Exemples de prompts de visualisation

- "Créer un graphique en barres des ventes par mois"
- "Afficher la distribution des âges avec un histogramme"
- "Montrer la corrélation entre prix et taille avec un nuage de points"
- "Créer un graphique en ligne de l'évolution des revenus dans le temps"
- "Afficher la répartition des catégories avec un graphique en secteurs"

## 🔧 Personnalisation

### Changer l'URL de l'API
Modifiez `src/config/api.ts` :
```typescript
export const API_CONFIG = {
  BASE_URL: 'http://votre-serveur:8000', // Votre URL d'API
  // ...
};
```

### Modifier les types de visualisations
Les visualisations sont générées par l'IA basée sur votre prompt. L'IA choisit automatiquement le type de graphique le plus approprié.

## 🐛 Dépannage

### Erreur de connexion à l'API
- Vérifiez que l'API FastAPI est en cours d'exécution sur le port 8000
- Vérifiez la configuration dans `src/config/api.ts`

### Erreur de visualisation
- Vérifiez que votre clé API Groq est correctement configurée
- Vérifiez que les données sont bien uploadées

### Problème de CORS
L'API FastAPI est configurée pour accepter toutes les origines en développement. En production, modifiez la configuration CORS dans `api.py`.

## 📊 Types de visualisations supportées

L'IA peut créer :
- Graphiques en barres
- Graphiques en ligne
- Nuages de points
- Histogrammes
- Graphiques en secteurs
- Graphiques en aires
- Et bien d'autres types Plotly

## 🚀 Prochaines étapes

- [ ] Ajouter la sauvegarde des visualisations
- [ ] Intégrer plus de types de graphiques
- [ ] Ajouter l'export des visualisations
- [ ] Améliorer la gestion des erreurs
- [ ] Ajouter des templates de visualisation prédéfinis






import os
import requests
import dotenv

# Charger les variables d'environnement depuis le fichier .env
dotenv.load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))

# Récupérer la clé API Groq
api_key = os.getenv("GROQ_API_KEY")

if not api_key:
    print("❌ Erreur: La clé API Groq n'a pas été trouvée dans le fichier .env")
    exit(1)

print(f"🔑 Clé API trouvée: {api_key[:5]}...{api_key[-5:]}")

# Vérifier la clé API en utilisant l'endpoint des modèles (plus léger que de faire une complétion)
headers = {
    "Authorization": f"Bearer {api_key}"
}

print("🔄 Vérification de la clé API Groq...")

try:
    # Envoyer une requête à l'API Groq pour lister les modèles disponibles
    response = requests.get(
        "https://api.groq.com/openai/v1/models",
        headers=headers,
        timeout=10  # Timeout de 10 secondes
    )
    
    print(f"📥 Code de statut reçu: {response.status_code}")
    
    # Vérifier le code de statut
    if response.status_code == 200:
        print("✅ Succès! Votre clé API Groq est valide.")
        
        # Afficher les modèles disponibles
        models = response.json()["data"]
        print(f"\n📋 Modèles disponibles ({len(models)}):")
        for model in models:
            print(f"  - {model['id']}")
    else:
        print(f"❌ Erreur: Code de statut {response.status_code}")
        print(f"Détails: {response.text}")
        
except Exception as e:
    print(f"❌ Exception lors de l'appel à l'API: {str(e)}")

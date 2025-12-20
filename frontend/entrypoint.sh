#!/bin/sh
# Entrypoint for serving the frontend

# Inject the runtime API URL directly into index.html before serving
# This ensures the frontend can access the backend via the correct URL

# Replace the placeholder with the actual API URL
# sed -i "s|http://localhost:8001|${VITE_API_URL:-http://localhost:8001}|g" dist/index.html

# Start the server listening on all interfaces
# exec serve -s dist -l 5173

#!/bin/sh
echo "Remplacement de localhost par $VITE_API_URL..."

# On cherche dans tous les fichiers du dossier dist
find /app/dist -type f -exec sed -i "s|http://localhost:8001|$VITE_API_URL|g" {} +

echo "Lancement du serveur..."
exec serve -s dist -l 5173

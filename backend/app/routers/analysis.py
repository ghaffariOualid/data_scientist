from fastapi import APIRouter, Form, HTTPException, Depends
from sqlalchemy.orm import Session
import pandas as pd
from ..database import get_db
from ..models import AnalysisResponse, VisualizationResponse
from ..core.logging import logger
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))

from scripts.crew import CustomCrew
from scripts.custom_tools import extract_code_block
import tempfile
import os
import plotly.express as px
import plotly.graph_objects as go
import json

router = APIRouter(prefix="/analysis", tags=["analysis"])


@router.post("/analyze", response_model=AnalysisResponse)
async def analyze_data(query: str = Form(...), db: Session = Depends(get_db)):
    """
    Analyser les données avec l'IA
    """
    try:
        # Récupérer les données
        df = pd.read_sql("SELECT * FROM uploaded_data", con=db.bind)

        if df.empty:
            raise HTTPException(status_code=404, detail="Aucune donnée chargée. Veuillez d'abord uploader un fichier CSV.")

        logger.info(f"Analyzing data with query: {query}")

        # Exécuter l'analyse avec CrewAI
        custom_crew = CustomCrew(query, df=df)
        result = custom_crew.run()

        logger.info("Analysis completed successfully")

        return AnalysisResponse(
            query=query,
            analysis=result.raw or str(result),
            status="success"
        )

    except Exception as e:
        logger.error(f"Error during analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur lors de l'analyse: {str(e)}")


@router.post("/visualize", response_model=VisualizationResponse)
async def create_visualization(prompt: str = Form(...), db: Session = Depends(get_db)):
    """
    Créer une visualisation des données
    """
    try:
        # Récupérer les données
        df = pd.read_sql("SELECT * FROM uploaded_data", con=db.bind)

        if df.empty:
            raise HTTPException(status_code=404, detail="Aucune donnée chargée. Veuillez d'abord uploader un fichier CSV.")

        logger.info(f"Creating visualization with prompt: {prompt}")

        # Sauvegarder les données temporairement pour l'agent
        temp_csv = tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.csv')
        df.to_csv(temp_csv.name, index=False)
        temp_csv.close()

        # Créer un prompt enrichi
        columns_info = f"Columns available: {list(df.columns)}"
        enriched_prompt = f"{prompt}. {columns_info}. Use the current data from temp.csv file."

        # Générer la visualisation
        custom_crew = CustomCrew(enriched_prompt, df=df, visualization=True)
        crew_output = custom_crew.run()

        # Extraire le code
        fig_code = extract_code_block(crew_output.raw)

        if not fig_code:
            raise HTTPException(status_code=400, detail="Impossible de générer le code de visualisation")

        # Modifier le code pour utiliser df au lieu de temp.csv
        fig_code = fig_code.replace("pd.read_csv('temp.csv')", "df")

        # Exécuter le code
        local_vars = {"df": df, "pd": pd, "px": px, "go": go}
        exec(fig_code, local_vars, local_vars)
        fig = local_vars.get('fig')

        if not fig:
            raise HTTPException(status_code=400, detail="Impossible de créer la figure")

        # Convertir en JSON
        fig_json = fig.to_json()

        # Nettoyer
        os.unlink(temp_csv.name)

        logger.info("Visualization created successfully")

        return VisualizationResponse(
            prompt=prompt,
            visualization=json.loads(fig_json),
            status="success"
        )

    except Exception as e:
        # Nettoyer en cas d'erreur
        if 'temp_csv' in locals():
            try:
                os.unlink(temp_csv.name)
            except:
                pass
        logger.error(f"Error creating visualization: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur lors de la création de la visualisation: {str(e)}")
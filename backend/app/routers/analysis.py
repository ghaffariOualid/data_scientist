from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
import pandas as pd
from ..database import get_db
from ..models import AnalysisResponse, VisualizationResponse, AnalysisRequest, VisualizationRequest
from ..core.logging import logger
import sys
import os
import re
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))

from scripts.crew import CustomCrew
from scripts.custom_tools import extract_code_block
from ..core.result_validator import ResultValidator
from ..core.cache import analysis_cache
import tempfile
import plotly.express as px
import plotly.graph_objects as go
import json

def validate_query_input(query: str) -> str:
    """
    Validate and sanitize user query input.
    """
    if not query or not query.strip():
        raise HTTPException(status_code=400, detail="La question ne peut pas être vide")

    query = query.strip()

    if len(query) > 1000:
        raise HTTPException(status_code=400, detail="La question est trop longue (maximum 1000 caractères)")

    if len(query) < 3:
        raise HTTPException(status_code=400, detail="La question est trop courte (minimum 3 caractères)")

    dangerous_patterns = [
        r';\s*DROP\s+', r';\s*DELETE\s+', r';\s*UPDATE\s+', r';\s*INSERT\s+',
        r'--', r'/\*.*\*/', r'union\s+select', r'information_schema',
        r'<script', r'javascript:', r'onclick', r'onload'
    ]

    query_lower = query.lower()
    for pattern in dangerous_patterns:
        if re.search(pattern, query_lower, re.IGNORECASE):
            logger.warning(f"Potentially dangerous pattern detected in query: {pattern}")
            raise HTTPException(status_code=400, detail="La question contient du contenu potentiellement dangereux")

    return query


def validate_visualization_prompt(prompt: str) -> str:
    """
    Validate visualization prompt input.
    """
    if not prompt or not prompt.strip():
        raise HTTPException(status_code=400, detail="La description de visualisation ne peut pas être vide")

    prompt = prompt.strip()

    if len(prompt) > 500:
        raise HTTPException(status_code=400, detail="La description de visualisation est trop longue (maximum 500 caractères)")

    if len(prompt) < 3:
        raise HTTPException(status_code=400, detail="La description de visualisation est trop courte (minimum 3 caractères)")

    harmful_patterns = [
        r'<script', r'javascript:', r'onclick', r'onload', r'eval\(', r'exec\('
    ]

    prompt_lower = prompt.lower()
    for pattern in harmful_patterns:
        if re.search(pattern, prompt_lower, re.IGNORECASE):
            logger.warning(f"Potentially harmful pattern detected in visualization prompt: {pattern}")
            raise HTTPException(status_code=400, detail="La description de visualisation contient du contenu potentiellement dangereux")

    return prompt


router = APIRouter(prefix="/analysis", tags=["analysis"])


@router.post("/analyze", response_model=AnalysisResponse)
async def analyze_data(request: AnalysisRequest, db: Session = Depends(get_db)):
    """
    Analyser les données avec l'IA
    """
    query = request.query
    logger.info(f"Analyze request received - Query: {query[:100]}...")
    try:
        sanitized_query = validate_query_input(query)

        df = pd.read_sql("SELECT * FROM uploaded_data", con=db.bind)

        if df.empty:
            raise HTTPException(status_code=404, detail="Aucune donnée chargée. Veuillez d'abord uploader un fichier CSV.")

        if len(df) == 0:
            raise HTTPException(status_code=400, detail="Le dataset est vide")

        if len(df.columns) == 0:
            raise HTTPException(status_code=400, detail="Le dataset n'a pas de colonnes")

        logger.info(f"Analyzing data with validated query: {sanitized_query}")
        
        cached_result = analysis_cache.get(sanitized_query, df)
        if cached_result:
            logger.info("Returning cached analysis result")
            return AnalysisResponse(
                query=sanitized_query,
                analysis=cached_result,
                status="success"
            )

        custom_crew = CustomCrew(sanitized_query, df=df)
        result = custom_crew.run()

        if not result or not result.raw:
            logger.warning("Analysis returned empty result")
            raise HTTPException(status_code=500, detail="L'analyse n'a produit aucun résultat")

        analysis_text = result.raw or str(result)

        validator = ResultValidator()
        validation = validator.validate_analysis_result(analysis_text, sanitized_query)

        if not validation.is_valid:
            logger.warning(f"Analysis result failed validation: {validation.issues}")
            quality_feedback = "\n\n--- Quality Assessment ---\n"
            if validation.issues:
                quality_feedback += "Issues found:\n" + "\n".join(f"- {issue}" for issue in validation.issues[:3])
            if validation.suggestions:
                quality_feedback += "\n\nSuggestions:\n" + "\n".join(f"- {sugg}" for sugg in validation.suggestions[:3])
            analysis_text += quality_feedback

            if validation.score < 0.3:
                logger.error("Analysis result quality too low, rejecting")
                raise HTTPException(status_code=500, detail="La qualité du résultat d'analyse est insuffisante")

        try:
            analysis_cache.set(sanitized_query, df, analysis_text)
        except Exception as cache_error:
            logger.warning(f"Failed to cache analysis result: {str(cache_error)}")

        return AnalysisResponse(
            query=sanitized_query,
            analysis=analysis_text,
            status="success"
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error during analysis: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Erreur inattendue lors de l'analyse: {str(e)}")


@router.post("/visualize", response_model=VisualizationResponse)
async def create_visualization(request: VisualizationRequest, db: Session = Depends(get_db)):
    """
    Créer une visualisation des données
    """
    prompt = request.prompt
    temp_csv = None
    try:
        sanitized_prompt = validate_visualization_prompt(prompt)

        try:
            result = db.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='uploaded_data'")
            table_exists = result.fetchone() is not None
            
            if not table_exists:
                raise HTTPException(status_code=404, detail="Aucune donnée chargée. Veuillez d'abord uploader un fichier CSV.")

            df = pd.read_sql("SELECT * FROM uploaded_data", con=db.bind)
        except Exception as db_error:
            logger.error(f"Database error: {str(db_error)}")
            raise HTTPException(status_code=500, detail=f"Erreur de base de données: {str(db_error)}")

        if df.empty:
            raise HTTPException(status_code=404, detail="Aucune donnée chargée. Veuillez d'abord uploader un fichier CSV.")

        if len(df) == 0:
            raise HTTPException(status_code=400, detail="Le dataset est vide")

        if len(df.columns) < 2:
            raise HTTPException(status_code=400, detail=f"Le dataset doit avoir au moins 2 colonnes. Colonnes actuelles: {list(df.columns)}")

        custom_crew = CustomCrew(sanitized_prompt, df=df, visualization=True)
        crew_output = custom_crew.run()

        if not crew_output or not crew_output.raw:
            raise HTTPException(status_code=500, detail="La génération de visualisation n'a produit aucun résultat")

        fig_code = extract_code_block(crew_output.raw)

        if not fig_code:
            raise HTTPException(status_code=400, detail="Impossible de générer le code de visualisation")

        validator = ResultValidator()
        code_validation = validator.validate_visualization_code(fig_code, list(df.columns))

        if not code_validation.is_valid:
            logger.warning(f"Visualization code failed validation: {code_validation.issues}")

        fig_code = fig_code.replace("pd.read_csv('temp.csv')", "df")
        fig_code = fig_code.replace("import plotly.express as px", "")
        fig_code = fig_code.replace("import pandas as pd", "")
        fig_code = fig_code.replace("import plotly.graph_objects as go", "")
        fig_code = fig_code.replace("from plotly import express as px", "")
        fig_code = fig_code.replace("from plotly import graph_objects as go", "")

        local_vars = {"df": df, "pd": pd, "px": px, "go": go}

        try:
            exec(fig_code, {"__builtins__": __builtins__}, local_vars)
        except Exception as exec_error:
            logger.error(f"Error executing visualization code: {str(exec_error)}")
            raise HTTPException(status_code=400, detail=f"Erreur dans l'exécution du code de visualisation: {str(exec_error)}")

        fig = local_vars.get('fig')

        if not fig:
            raise HTTPException(status_code=400, detail="Impossible de créer la figure - objet 'fig' manquant")

        try:
            fig_json = fig.to_json()
            parsed_json = json.loads(fig_json)
            if not isinstance(parsed_json, dict) or 'data' not in parsed_json:
                raise ValueError("Invalid Plotly figure structure")
        except Exception as json_error:
            logger.error(f"Error converting figure to JSON: {str(json_error)}")
            raise HTTPException(status_code=400, detail="La figure générée n'est pas valide")

        return VisualizationResponse(
            prompt=sanitized_prompt,
            visualization=json.loads(fig_json),
            status="success"
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error creating visualization: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Erreur inattendue lors de la création de la visualisation: {str(e)}")
    finally:
        if temp_csv and os.path.exists(temp_csv.name):
            try:
                os.unlink(temp_csv.name)
            except Exception:
                pass


@router.get("/cache/stats")
async def get_cache_stats():
    """
    Get cache statistics for monitoring.
    """
    try:
        stats = analysis_cache.stats()
        return {
            "cache_stats": stats,
            "status": "success"
        }
    except Exception as e:
        logger.error(f"Error getting cache stats: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur lors de la récupération des statistiques cache: {str(e)}")


@router.post("/cache/clear")
async def clear_cache():
    """
    Clear all cached analysis results.
    """
    try:
        cleared_count = analysis_cache.clear()
        logger.info(f"Cache cleared by API request: {cleared_count} entries removed")
        return {
            "message": f"Cache cleared successfully. {cleared_count} entries removed.",
            "status": "success"
        }
    except Exception as e:
        logger.error(f"Error clearing cache: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur lors du vidage du cache: {str(e)}")


@router.post("/cache/invalidate")
async def invalidate_cache_query(query: str):
    """
    Invalidate cache entries for a specific query.
    """
    try:
        invalidated_count = analysis_cache.invalidate_by_query(query)
        logger.info(f"Cache invalidated for query '{query}': {invalidated_count} entries removed")
        return {
            "message": f"Cache invalidated for query. {invalidated_count} entries removed.",
            "status": "success"
        }
    except Exception as e:
        logger.error(f"Error invalidating cache for query '{query}': {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur lors de l'invalidation du cache: {str(e)}")
from fastapi import APIRouter, File, UploadFile, HTTPException, Depends
from fastapi.responses import FileResponse
import pandas as pd
import io
from typing import List
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import UploadResponse, DataInfo
from ..core.logging import logger

router = APIRouter(prefix="/data", tags=["data"])


@router.post("/upload", response_model=UploadResponse)
async def upload_csv(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """
    Upload et analyse d'un fichier CSV
    """
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Le fichier doit être un CSV")

    try:
        logger.info(f"Uploading file: {file.filename}")
        contents = await file.read()

        # Essayer de lire le CSV avec différents séparateurs
        separators = [',', ';', '\t', '|']
        df = None

        for sep in separators:
            try:
                df = pd.read_csv(io.BytesIO(contents), sep=sep, engine='python')
                if len(df.columns) > 1:  # Vérifier qu'on a plusieurs colonnes
                    break
            except Exception:
                continue

        if df is None or df.empty:
            raise HTTPException(status_code=400, detail="Impossible de lire le fichier CSV. Vérifiez le format et les séparateurs.")

        # Nettoyer les données
        df = df.dropna(how='all')  # Supprimer les lignes vides
        df.columns = df.columns.str.strip()  # Nettoyer les noms de colonnes
        df.columns = [col.capitalize() for col in df.columns]

        # Sauvegarder dans la DB (pour persistance)
        df.to_sql(name="uploaded_data", con=db.bind, if_exists="replace", index=False)

        logger.info(f"File uploaded successfully: {len(df)} rows, {len(df.columns)} columns")

        return UploadResponse(
            message="Fichier CSV uploadé avec succès",
            filename=file.filename,
            rows=len(df),
            columns=list(df.columns),
            preview=df.head().to_dict('records')
        )

    except Exception as e:
        logger.error(f"Error uploading file: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur lors du traitement du fichier: {str(e)}")


@router.get("/info", response_model=DataInfo)
async def get_data_info(db: Session = Depends(get_db)):
    """
    Obtenir des informations sur les données actuelles
    """
    try:
        # Récupérer les données de la DB
        df = pd.read_sql("SELECT * FROM uploaded_data", con=db.bind)

        if df.empty:
            raise HTTPException(status_code=404, detail="Aucune donnée chargée. Veuillez d'abord uploader un fichier CSV.")

        return DataInfo(
            rows=len(df),
            columns=list(df.columns),
            data_types={col: str(dtype) for col, dtype in df.dtypes.items()},
            preview=df.head().to_dict('records')
        )

    except Exception as e:
        logger.error(f"Error getting data info: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur lors de la récupération des informations: {str(e)}")


@router.get("/download")
async def download_data(db: Session = Depends(get_db)):
    """
    Télécharger les données actuelles au format CSV
    """
    try:
        df = pd.read_sql("SELECT * FROM uploaded_data", con=db.bind)

        if df.empty:
            raise HTTPException(status_code=404, detail="Aucune donnée chargée.")

        # Créer un fichier temporaire
        temp_file = io.BytesIO()
        df.to_csv(temp_file, index=False)
        temp_file.seek(0)

        return FileResponse(
            temp_file,
            media_type='text/csv',
            filename='data.csv'
        )

    except Exception as e:
        logger.error(f"Error downloading data: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur lors du téléchargement: {str(e)}")


@router.delete("/clear")
async def clear_data(db: Session = Depends(get_db)):
    """
    Nettoyer les données actuelles
    """
    try:
        db.execute("DROP TABLE IF EXISTS uploaded_data")
        db.commit()
        logger.info("Data cleared successfully")
        return {"message": "Données nettoyées avec succès"}

    except Exception as e:
        logger.error(f"Error clearing data: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur lors du nettoyage: {str(e)}")
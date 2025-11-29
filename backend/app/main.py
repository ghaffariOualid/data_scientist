from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .database import engine, Base
from .routers.data import router as data_router
from .routers.analysis import router as analysis_router
from .core.logging import logger

# Créer les tables
Base.metadata.create_all(bind=engine)

# Créer l'application FastAPI
app = FastAPI(
    title=settings.app_name,
    description=settings.description,
    version=settings.version
)

# Configuration CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inclure les routers
app.include_router(data_router)
app.include_router(analysis_router)


@app.get("/")
async def root():
    """Endpoint racine"""
    return {
        "message": settings.app_name,
        "version": settings.version,
        "endpoints": {
            "upload": "/data/upload",
            "analyze": "/analysis/analyze",
            "visualize": "/analysis/visualize",
            "data_info": "/data/info",
            "data_download": "/data/download",
            "data_clear": "/data/clear",
            "health": "/health"
        }
    }


@app.get("/health")
async def health_check():
    """Vérification de l'état de l'API"""
    logger.info("Health check requested")
    return {"status": "healthy", "message": "API is running"}


if __name__ == "__main__":
    import uvicorn
    logger.info(f"Starting server on {settings.host}:{settings.port}")
    uvicorn.run(app, host=settings.host, port=settings.port)
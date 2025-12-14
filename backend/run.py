"""
Run the FastAPI app with proper multiprocessing handling
"""
import os
import sys

# Set environment to disable CrewAI's multiprocessing issues on Windows
os.environ["CREWAI_DISABLE_MULTIPROCESSING"] = "true"

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8001,
        reload=False
    )

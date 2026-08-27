import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.endpoints import router as api_router

app = FastAPI(
    title="ContextAI — AI Text Reader, Analyzer & Summarizer",
    description="Intelligent Document Intelligence & NLP System with Multi-format Extraction, Multi-mode Summarization, RAG Q&A, and Analytics.",
    version="1.0.0"
)

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal Server Error",
            "message": str(exc),
            "detail": "An unexpected error occurred while processing the document."
        }
    )

# Include API Router
app.include_router(api_router, prefix="/api")


@app.get("/")
async def root():
    return {
        "app": "ContextAI API",
        "tagline": "Read Less. Understand More.",
        "status": "online",
        "docs_url": "/docs"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)

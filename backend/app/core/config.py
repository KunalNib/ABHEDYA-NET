"""
Core application settings and security parameters.
"""

import os
from pydantic import BaseModel

class Settings(BaseModel):
    PROJECT_NAME: str = os.getenv("PROJECT_NAME", "ABHEDYA-NET")
    FULL_TITLE: str = os.getenv("FULL_TITLE", "ABHEDYA-NET: AI-Driven Adaptive Cyber Deception & Attack-Path Prediction Platform")
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # AI / LLM Configuration
    LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "RULE_BASED")  # Options: RULE_BASED, OLLAMA, OPENAI
    OLLAMA_HOST: str = os.getenv("OLLAMA_HOST", "http://localhost:11434")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    
    # Temporal Model Config
    SEQUENCE_LENGTH: int = 5  # Number of past NetworkStates used for prediction
    INPUT_DIM: int = 19       # Number of features in canonical NetworkState
    HIDDEN_DIM: int = 64      # LSTM hidden units
    
    # Deception Ports
    DECOY_DB_PORT: int = 5433
    DECOY_API_PORT: int = 8081
    DECOY_ADMIN_PORT: int = 8082
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./sih_cyber.db")

settings = Settings()

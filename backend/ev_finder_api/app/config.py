# app/config.py

from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field
from pathlib import Path # Import the Path object

# --- THIS IS THE KEY CHANGE ---
# 1. Find the project's root directory by going up one level from this file's directory.
#    Path(__file__) is the path to this file (config.py)
#    .parent gives the directory it's in (app/)
#    .parent gives the directory above that (ev_finder_api/)
BASE_DIR = Path(__file__).parent.parent

# 2. Construct the full path to the .env file.
ENV_FILE_PATH = BASE_DIR / ".env"
# -----------------------------

class Settings(BaseSettings):
    """
    Loads and validates application settings from the .env file.
    """
    # Load settings from the .env file using the absolute path we just built
    model_config = SettingsConfigDict(env_file=ENV_FILE_PATH, env_file_encoding='utf-8')

    OCM_API_KEY: str = Field(..., description="API key for OpenChargeMap")

    @property
    def is_configured(self) -> bool:
        return self.OCM_API_KEY not in [None, "", "PASTE_YOUR_REAL_API_KEY_HERE"]

# Create a single, importable instance of the settings
settings = Settings()
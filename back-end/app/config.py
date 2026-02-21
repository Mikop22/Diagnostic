import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    HUGGINGFACE_TOKEN: str = os.getenv("HUGGINGFACE_TOKEN", "")
    PUBMED_API_KEY: str = os.getenv("PUBMED_API_KEY", "")
    MONGODB_URI: str = os.getenv("MONGODB_URI", "")
    MONGODB_DB_NAME: str = os.getenv("MONGODB_DB_NAME", "diagnostic")

settings = Settings()

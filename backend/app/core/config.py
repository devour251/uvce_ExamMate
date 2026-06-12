from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    google_api_key: str = ""
    gemini_model: str = "gemini-1.5-flash"

    supabase_url: str = ""
    supabase_service_key: str = ""
    supabase_jwt_secret: str = ""

    chroma_persist_dir: str = "./chroma_db"
    data_dir: str = "./data/pdfs"

    offline_mode: bool = False

    cors_origins: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "https://uvce-exammate-ai.vercel.app",
        "*",  # dev fallback — restrict in production
    ]


settings = Settings()

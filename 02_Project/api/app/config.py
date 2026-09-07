from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    supabase_url: str
    supabase_publishable_key: str
    # Filled in later, once the ingestion/service-layer work needs direct DB
    # access. Never hardcode this — it must come from the environment only.
    supabase_service_role_key: str | None = None


settings = Settings()

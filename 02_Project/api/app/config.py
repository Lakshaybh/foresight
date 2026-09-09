from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    supabase_url: str
    supabase_publishable_key: str
    # Filled in later, once the ingestion/service-layer work needs direct DB
    # access. Never hardcode this — it must come from the environment only.
    supabase_service_role_key: str | None = None
    # Direct Postgres connection string (Supabase dashboard -> Project Settings
    # -> Database -> Connection string). Required by ingestion scripts that
    # bulk-load data — the anon/publishable key can't do this, RLS blocks it
    # by design. Never hardcode this; it lives only in the local .env file.
    database_url: str | None = None

    # Brevo transactional email, sent via their HTTPS REST API rather than
    # SMTP — Render blocks outbound SMTP ports at the network level, so a
    # raw smtplib connection just times out there. Both optional: if unset,
    # sends are skipped with a log line rather than the app crashing or
    # pretending to send something it didn't.
    brevo_api_key: str | None = None
    smtp_sender_email: str | None = None
    # Platform operator's own inbox — where a lapsed-access renewal request
    # from /access-expired gets sent. Not a secret, but kept in config
    # rather than hardcoded in the router so it can change without a
    # redeploy touching application logic.
    admin_notify_email: str = "lakshaymsharma@gmail.com"


settings = Settings()

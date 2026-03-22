from functools import lru_cache
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str
    clerk_secret_key: str
    clerk_jwt_issuer: str = ""   # e.g. https://<your-clerk-instance>.clerk.accounts.dev
    admin_user_ids: str = ""
    payments_enabled: bool = False
    judge0_api_key: str = ""
    judge0_api_url: str = ""
    deepseek_api_key: str = ""

    @property
    def admin_ids(self) -> list[str]:
        return [id.strip() for id in self.admin_user_ids.split(",") if id.strip()]

    class Config:
        env_file = ".env"

@lru_cache
def get_settings() -> Settings:
    return Settings()

# Module-level convenience alias — still loads from env/file, but now explicit
settings = get_settings()

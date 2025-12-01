from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI
# from pydantic import BaseSettings
def setup_cors(app: FastAPI):
    origins = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*"
    ]

    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

class Settings:
    SECRET_KEY: str = "lZuFh8Rk8d9f95osqmJt1E2jGyNCg0NCo-PHxnQcc07Cne-AY0702wLMw0jPPubzg8D7mm79PbGgpf1ELQLV0g"
    MYSQL_USER: str = "root"
    MYSQL_PASSWORD: str = ""
    MYSQL_HOST: str = "127.0.0.1"
    MYSQL_PORT: int = 3306
    MYSQL_DB: str = "hand_gesture_KLTN_db"

    @property
    def SQLALCHEMY_DATABASE_URI(self) -> str:
        return (
            f"mysql+pymysql://{self.MYSQL_USER}:{self.MYSQL_PASSWORD}"
            f"@{self.MYSQL_HOST}:{self.MYSQL_PORT}/{self.MYSQL_DB}"
            f"?charset=utf8mb4"
        )


settings = Settings()



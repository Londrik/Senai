import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
from pathlib import Path

# --- CONFIGURAÇÃO DE AMBIENTE ---
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

# Tenta carregar a URL do Railway, se não existir, usa SQLITE LOCAL
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")

if not SQLALCHEMY_DATABASE_URL:
    # Cria o banco de dados na pasta do projeto automaticamente
    SQLALCHEMY_DATABASE_URL = "sqlite:///./sql_app.db"
    print("DEBUG: Usando SQLite LOCAL (sql_app.db)")
else:
    print("DEBUG: Usando conexão de PRODUÇÃO (Railway)")

# --- CONFIGURAÇÃO DO SQLALCHEMY ---
# check_same_thread=False é OBRIGATÓRIO para SQLite funcionar com FastAPI/WebSockets
connect_args = {"check_same_thread": False} if "sqlite" in SQLALCHEMY_DATABASE_URL else {}

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True,
    echo=False
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    """Gerencia a abertura e fechamento das sessões do banco."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
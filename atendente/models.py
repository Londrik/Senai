from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime
from .database import Base

class Atendimento(Base):
    __tablename__ = "atendimentos"
    id = Column(Integer, primary_key=True, index=True)
    codigo = Column(String) # Ex: N024
    nome = Column(String)
    tipo = Column(String) # Aluno / Visitante
    status = Column(String, default="aguardando") # aguardando / chamado
    guiche = Column(String, nullable=True)
    data_hora = Column(DateTime, default=datetime.now)
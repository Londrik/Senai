from pydantic import BaseModel
from typing import Optional

class AtendimentoCreate(BaseModel):
    nome: str
    tipo: str

class ChamadaRequest(BaseModel):
    guiche: str

class AtendimentoResponse(BaseModel):
    id: int
    codigo: str
    nome: str
    tipo: str
    status: str
    guiche: Optional[str]
    class Config:
        from_attributes = True
from pydantic import BaseModel, Field
from typing import Optional

class AtendimentoBase(BaseModel):
    """
    Esquema base para os dados de atendimento.
    Define os campos comuns que são compartilhados entre a criação e a leitura.
    """
    nome: str = Field(..., example="Henry Ribeiro", description="Nome do aluno ou visitante")
    tipo: str = Field(..., example="Preferencial", description="Tipo de atendimento (Geral, Matrícula, Preferencial)")

class AtendimentoCreate(AtendimentoBase):
    """
    Esquema utilizado na criação (POST) de uma nova senha via Totem.
    Herda de AtendimentoBase.
    """
    pass

class Atendimento(AtendimentoBase):
    """
    Esquema completo para retorno de dados (Response Model).
    Inclui campos gerados automaticamente pelo servidor ou banco de dados.
    """
    id: int = Field(..., description="ID único incremental do banco de dados")
    codigo: str = Field(..., description="Código formatado da senha (ex: P001, N005)")
    status: str = Field(..., description="Status atual (Aguardando, Chamando, Concluído)")
    guiche: Optional[str] = Field(None, description="Identificação do guichê que realizou a chamada")

    class Config:
        """
        Configuração para permitir que o Pydantic leia dados de objetos ORM (SQLAlchemy).
        'from_attributes = True' substitui o antigo 'orm_mode = True'.
        """
        from_attributes = True

class ChamadaRequest(BaseModel):
    """
    Esquema para as requisições de chamada (Próximo ou Específico).
    Define quais dados o Atendente precisa enviar para acionar o Painel TV.
    """
    guiche: str = Field(..., example="01", description="Número do guichê que está chamando a senha")
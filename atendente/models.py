from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime
from .database import Base

class Atendimento(Base):
    """
    Entidade de Gerenciamento de Fila Ativa.
    
    Esta classe mapeia a tabela 'atendimentos', que armazena o estado atual 
    da fila de espera. Os registros aqui são transitórios e representam 
    o ciclo de vida da senha desde a emissão no Totem até o chamado no Painel.
    """
    __tablename__ = "atendimentos"

    # Identificador único e primário para indexação rápida
    id = Column(Integer, primary_key=True, index=True)
    
    # Nome do aluno capturado via Totem (Suporta nomes longos)
    nome = Column(String(255), nullable=False) 
    
    # Código formatado da senha (ex: N001, P005). Indexado para busca performática
    codigo = Column(String(50), unique=True, index=True, nullable=False)
    
    # Categoria do atendimento para regras de prioridade no CRUD
    tipo = Column(String(50), nullable=False) 
    
    # Status do fluxo: 'Aguardando', 'Chamando', 'Concluído'
    status = Column(String(50), default="Aguardando", nullable=False) 
    
    # Identificação do posto de atendimento (Guichê)
    guiche = Column(String(50), nullable=True)
    
    # Timestamp de emissão para cálculo de tempo de espera (SLA)
    data_criacao = Column(DateTime, default=datetime.now)

class HistoricoAtendimento(Base):
    """
    Entidade de Persistência Histórica (Data Warehouse).
    
    Esta classe mapeia a tabela 'historico_atendimentos'. Diferente da tabela
    de atendimentos, os dados aqui são permanentes e imutáveis, servindo 
    exclusivamente para auditoria e alimentação das métricas do Dashboard.
    """
    __tablename__ = "historico_atendimentos"

    # Chave primária do histórico
    id = Column(Integer, primary_key=True, index=True)
    
    # Preservação do código da senha atendida
    codigo = Column(String(10), nullable=False)
    
    # Preservação do nome do aluno atendido
    nome = Column(String(100), nullable=False)
    
    # Registro de qual guichê realizou o serviço
    guiche = Column(String(50), nullable=False)
    
    # Segmentação por tipo (Geral/Matrícula/Preferencial) para análise de volume
    tipo = Column(String(50), nullable=False) 
    
    # Data e hora exata da emissão (vinda da tabela Atendimento)
    data_chegada = Column(DateTime, nullable=False)
    
    # Data e hora do acionamento pelo Atendente (Momento do chamado)
    data_chamada = Column(DateTime, default=datetime.now)
    
    # Diferença em segundos entre a chegada e a chamada (KPI de Performance)
    tempo_espera_segundos = Column(Integer, nullable=False)

# DOCUMENTAÇÃO DE MANUTENÇÃO:
# 1. Caso altere o 'tipo' no Totem, certifique-se que o tamanho do String(50) comporta.
# 2. A tabela 'historico_atendimentos' não deve ser limpa no reset diário.
# 3. O campo 'tempo_espera_segundos' é calculado via Python no crud.py antes da inserção.
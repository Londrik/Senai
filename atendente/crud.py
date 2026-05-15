from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime
from . import models, schemas

def criar_atendimento(db: Session, nome: str, tipo: str):
    """Gera uma nova senha sequencial e persiste no estado 'Aguardando'."""
    prefixo = "P" if tipo == "Preferencial" else "N"
    total = db.query(models.Atendimento).count() + 1
    codigo = f"{prefixo}{total:03d}"
    
    db_atendimento = models.Atendimento(
        nome=nome, tipo=tipo, codigo=codigo, 
        status="Aguardando", data_criacao=datetime.now()
    )
    db.add(db_atendimento)
    db.commit()
    db.refresh(db_atendimento)
    return db_atendimento

def get_fila_espera(db: Session):
    """Retorna todas as senhas pendentes de atendimento."""
    return db.query(models.Atendimento).filter(models.Atendimento.status == "Aguardando").all()

def resetar_fila_ativa(db: Session):
    """Remove todos os registros da fila de atendimento ativa (Reset Diário)."""
    db.query(models.Atendimento).delete()
    db.commit()

def chamar_por_id(db: Session, senha_id: int, guiche: str):
    """Realiza a chamada de um ID específico e registra no histórico de performance."""
    proximo = db.query(models.Atendimento).filter(
        models.Atendimento.id == senha_id,
        models.Atendimento.status == "Aguardando"
    ).first()

    if proximo:
        agora = datetime.now()
        delta = agora - (proximo.data_criacao or agora)
        espera_segundos = int(delta.total_seconds())

        historico = models.HistoricoAtendimento(
            codigo=proximo.codigo, nome=proximo.nome, guiche=guiche,
            tipo=proximo.tipo, data_chegada=proximo.data_criacao,
            data_chamada=agora, tempo_espera_segundos=espera_segundos
        )
        db.add(historico)
        proximo.status = "Chamado"
        proximo.guiche = guiche 
        db.commit()
        db.refresh(proximo)
        return proximo
    return None

def chamar_proximo(db: Session, guiche: str):
    """Implementa a regra de negócio de prioridade: Preferencial > Ordem de Chegada."""
    proximo = db.query(models.Atendimento).filter(
        models.Atendimento.status == "Aguardando"
    ).order_by(models.Atendimento.tipo.desc(), models.Atendimento.id.asc()).first()

    return chamar_por_id(db, proximo.id, guiche) if proximo else None

def get_metricas_resumo(db: Session):
    """Calcula indicadores de performance baseados na tabela HistoricoAtendimento."""
    total_atendidos = db.query(models.HistoricoAtendimento).count()
    media_espera = db.query(func.avg(models.HistoricoAtendimento.tempo_espera_segundos)).scalar() or 0
    
    try:
        distribuicao_tipo = db.query(
            models.HistoricoAtendimento.tipo, func.count(models.HistoricoAtendimento.id)
        ).group_by(models.HistoricoAtendimento.tipo).all()
    except Exception:
        distribuicao_tipo = []

    return {
        "total": total_atendidos,
        "media_espera": round(media_espera / 60, 1),
        "distribuicao": dict(distribuicao_tipo)
    }

def get_atendimentos_por_hora(db: Session):
    """Gera volume de atendimentos agrupados por hora para análise de tráfego."""
    dados = db.query(
        func.hour(models.HistoricoAtendimento.data_chamada).label('hora'),
        func.count(models.HistoricoAtendimento.id).label('quantidade')
    ).group_by('hora').all()
    return [{"hora": f"{int(d.hora)}h", "quantidade": d.quantidade} for d in dados]
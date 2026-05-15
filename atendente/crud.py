from sqlalchemy.orm import Session
from . import models
from sqlalchemy import func

def criar_atendimento(db: Session, nome: str, tipo: str):
    # Deixa o texto em maiúsculo e sem espaços extras
    t = tipo.upper().strip()
    
    # Identificação Robusta
    if "PREFERENCIAL" in t or "PRIORIDADE" in t:
        prefixo = "P"
    elif "FINANCEIRO" in t or "MATRICULA" in t or "MATRÍCULA" in t:
        # Se contiver Financeiro ou Matricula (com ou sem acento), vira F
        prefixo = "F"
    else:
        prefixo = "N"
    
    count = db.query(models.Atendimento).count() + 1
    codigo = f"{prefixo}{count:03d}"
    
    db_atendimento = models.Atendimento(
        nome=nome or "ALUNO SENAI", 
        tipo=t, 
        codigo=codigo, 
        status="aguardando"
    )
    db.add(db_atendimento)
    db.commit()
    db.refresh(db_atendimento)
    return db_atendimento

def get_metricas(db: Session):
    total_geral = db.query(models.Atendimento).count()
    
    # Conta os chamados pela letra inicial do código (N, P, F)
    # Isso é o jeito mais seguro de não errar a conta
    norm = db.query(models.Atendimento).filter(models.Atendimento.codigo.like('N%'), models.Atendimento.status == "chamado").count()
    pref = db.query(models.Atendimento).filter(models.Atendimento.codigo.like('P%'), models.Atendimento.status == "chamado").count()
    fina = db.query(models.Atendimento).filter(models.Atendimento.codigo.like('F%'), models.Atendimento.status == "chamado").count()

    return {
        "norm": norm,
        "pref": pref,
        "fina": fina,
        "total": total_geral
    }

# --- Mantenha as outras funções do crud.py (listar-fila, chamar_por_id, etc) ---
def get_fila_espera(db: Session):
    return db.query(models.Atendimento).filter(models.Atendimento.status == "aguardando").all()

def chamar_por_id(db: Session, senha_id: int, guiche: str):
    p = db.query(models.Atendimento).filter(models.Atendimento.id == senha_id).first()
    if p:
        p.status = "chamado"
        p.guiche = guiche
        db.commit()
        db.refresh(p)
    return p

def chamar_proxima_senha(db: Session, guiche: str):
    p = db.query(models.Atendimento).filter(models.Atendimento.status == "aguardando").order_by(models.Atendimento.id.asc()).first()
    if p:
        p.status = "chamado"
        p.guiche = guiche
        db.commit()
        db.refresh(p)
    return p

def get_ultimas_chamadas(db: Session, limit: int = 6):
    return db.query(models.Atendimento).filter(models.Atendimento.status == "chamado").order_by(models.Atendimento.id.desc()).limit(limit).all()

def get_historico_atendente(db: Session, limit: int = 10):
    return db.query(models.Atendimento).filter(models.Atendimento.status == "chamado").order_by(models.Atendimento.id.desc()).limit(limit).all()

def buscar_senha_por_id(db: Session, senha_id: int):
    return db.query(models.Atendimento).filter(models.Atendimento.id == senha_id).first()

def resetar_fila_total(db: Session):
    db.query(models.Atendimento).delete()
    db.commit()
    return True
from sqlalchemy.orm import Session
from . import models

def criar_atendimento(db: Session, nome: str, tipo: str):
    prefixo = "P" if tipo.upper() == "PREFERENCIAL" else "N"
    count = db.query(models.Atendimento).count() + 1
    codigo = f"{prefixo}{count:03d}"
    db_atendimento = models.Atendimento(nome=nome or "ALUNO SENAI", tipo=tipo, codigo=codigo, status="aguardando")
    db.add(db_atendimento)
    db.commit()
    db.refresh(db_atendimento)
    return db_atendimento

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

def get_ultimas_chamadas(db: Session, limit: int = 5):
    return db.query(models.Atendimento).filter(models.Atendimento.status == "chamado").order_by(models.Atendimento.id.desc()).limit(limit).all()

def get_historico_atendente(db: Session, limit: int = 10):
    return db.query(models.Atendimento).filter(models.Atendimento.status == "chamado").order_by(models.Atendimento.id.desc()).limit(limit).all()

def buscar_senha_por_id(db: Session, senha_id: int):
    return db.query(models.Atendimento).filter(models.Atendimento.id == senha_id).first()
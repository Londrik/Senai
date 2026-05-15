from fastapi import FastAPI, Request, Depends, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
import uvicorn
import json
import os

from atendente import models, schemas, crud
from atendente.database import SessionLocal, engine, get_db

# Inicialização do Banco de Dados
models.Base.metadata.create_all(bind=engine)

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in list(self.active_connections):
            try:
                await connection.send_text(json.dumps(message))
            except Exception:
                self.disconnect(connection)

manager = ConnectionManager()
app = FastAPI(title="Sistema de Atendimento SENAI")

# --- CONFIGURAÇÃO DE DIRETÓRIOS ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
static_path = os.path.join(BASE_DIR, "atendente", "static")
templates_path = os.path.join(BASE_DIR, "atendente", "templates")

app.mount("/static", StaticFiles(directory=static_path), name="static")
templates = Jinja2Templates(directory=templates_path)

app.add_middleware(
    CORSMiddleware, 
    allow_origins=["*"], 
    allow_methods=["*"], 
    allow_headers=["*"]
)

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

# --- ROTAS DE NAVEGAÇÃO (CORRIGIDAS) ---

@app.get("/", response_class=HTMLResponse)
async def read_index(request: Request):
    return templates.TemplateResponse(request, "totem.html")

@app.get("/totem", response_class=HTMLResponse)
async def exibir_totem(request: Request):
    return templates.TemplateResponse(request, "totem.html")

@app.get("/painel", response_class=HTMLResponse)
async def exibir_painel(request: Request):
    return templates.TemplateResponse(request, "painel.html")

@app.get("/atendente", response_class=HTMLResponse)
async def exibir_atendente(request: Request):
    return templates.TemplateResponse(request, "atendente.html")

# --- ROTAS DE API ---

@app.get("/listar-fila")
def listar_fila(db: Session = Depends(get_db)):
    return crud.get_fila_espera(db)

@app.post("/gerar-senha", response_model=schemas.Atendimento)
async def gerar_senha(senha: schemas.AtendimentoCreate, db: Session = Depends(get_db)):
    nova_senha = crud.criar_atendimento(db=db, nome=senha.nome, tipo=senha.tipo)
    await manager.broadcast({"tipo": "atualizar_lista"})
    return nova_senha

@app.post("/chamar-proxima", response_model=schemas.Atendimento)
async def chamar_proxima(dados: schemas.ChamadaRequest, db: Session = Depends(get_db)):
    proximo = crud.chamar_proximo(db, guiche=dados.guiche)
    if not proximo:
        raise HTTPException(status_code=404, detail="Fila de espera vazia.")
    
    await manager.broadcast({
        "tipo": "atualizar_painel",
        "senha": proximo.codigo,
        "nome": proximo.nome,
        "guiche": proximo.guiche
    })
    await manager.broadcast({"tipo": "atualizar_lista"})
    return proximo

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
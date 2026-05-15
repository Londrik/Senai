from fastapi import FastAPI, Request, Depends, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session
import json, os
from atendente import models, schemas, crud
from atendente.database import SessionLocal, engine, get_db

models.Base.metadata.create_all(bind=engine)

class ConnectionManager:
    def __init__(self): self.active_connections = []
    async def connect(self, ws: WebSocket): await ws.accept(); self.active_connections.append(ws)
    def disconnect(self, ws: WebSocket): 
        if ws in self.active_connections: self.active_connections.remove(ws)
    async def broadcast(self, msg: dict):
        for c in list(self.active_connections):
            try: await c.send_text(json.dumps(msg))
            except: self.disconnect(c)

manager = ConnectionManager()
app = FastAPI()
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
app.mount("/static", StaticFiles(directory=os.path.join(BASE_DIR, "atendente/static")), name="static")
templates = Jinja2Templates(directory=os.path.join(BASE_DIR, "atendente/templates"))

@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await manager.connect(ws)
    try:
        while True: await ws.receive_text()
    except WebSocketDisconnect: manager.disconnect(ws)

@app.get("/", response_class=HTMLResponse)
async def totem(request: Request): return templates.TemplateResponse(request=request, name="totem.html")

@app.get("/painel", response_class=HTMLResponse)
async def painel(request: Request, db: Session = Depends(get_db)):
    historico = crud.get_ultimas_chamadas(db)
    return templates.TemplateResponse(request=request, name="painel.html", context={"historico": historico})

@app.get("/atendente", response_class=HTMLResponse)
async def atendente(request: Request): return templates.TemplateResponse(request=request, name="atendente.html")

@app.get("/dashboard", response_class=HTMLResponse)
async def dashboard(request: Request): return templates.TemplateResponse(request=request, name="dashboard.html")

@app.get("/listar-fila")
def listar(db: Session = Depends(get_db)): return crud.get_fila_espera(db)

@app.get("/atendente-historico")
def hist(db: Session = Depends(get_db)): return crud.get_historico_atendente(db)

@app.get("/api/v1/metrics")
def metrics(db: Session = Depends(get_db)): return crud.get_metricas(db)

@app.post("/gerar-senha")
async def gerar(senha: schemas.AtendimentoCreate, db: Session = Depends(get_db)):
    nova = crud.criar_atendimento(db, senha.nome, senha.tipo)
    await manager.broadcast({"tipo": "atualizar_lista"})
    return nova

@app.post("/chamar-proxima")
async def proxima(dados: schemas.ChamadaRequest, db: Session = Depends(get_db)):
    p = crud.chamar_proxima_senha(db, dados.guiche)
    if not p: raise HTTPException(404)
    payload = {"tipo": "atualizar_painel", "senha": p.codigo, "nome": p.nome, "guiche": p.guiche}
    await manager.broadcast(payload); await manager.broadcast({"tipo": "atualizar_lista"})
    return p

@app.post("/chamar-especifica/{sid}")
async def especifica(sid: int, dados: schemas.ChamadaRequest, db: Session = Depends(get_db)):
    p = crud.chamar_por_id(db, sid, dados.guiche)
    if not p: raise HTTPException(404)
    payload = {"tipo": "atualizar_painel", "senha": p.codigo, "nome": p.nome, "guiche": p.guiche}
    await manager.broadcast(payload); await manager.broadcast({"tipo": "atualizar_lista"})
    return p

@app.post("/chamar-novamente/{sid}")
async def de_novo(sid: int, db: Session = Depends(get_db)):
    p = crud.buscar_senha_por_id(db, sid)
    if not p: raise HTTPException(404)
    payload = {"tipo": "atualizar_painel", "senha": p.codigo, "nome": p.nome, "guiche": p.guiche}
    await manager.broadcast(payload)
    return {"status": "ok"}

@app.post("/limpar-fila-seguro")
async def limpar(request: Request, db: Session = Depends(get_db)):
    dados = await request.json()
    if dados.get("token") == "senai123":
        crud.resetar_fila_total(db)
        await manager.broadcast({"tipo": "atualizar_lista"})
        return {"status": "ok"}
    raise HTTPException(403)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
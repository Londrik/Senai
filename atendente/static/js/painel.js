let ultimaSenha = ""; 

const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const socket = new WebSocket(`${protocol}//${window.location.host}/ws`);

socket.onmessage = function(event) {
    try {
        const data = JSON.parse(event.data);
        if (data.tipo === "atualizar_painel") {
            processarChamada(data);
        }
    } catch (e) {
        if (event.data === "atualizar_painel") fetchFila();
    }
};

function tocarAlertaSonoro() {
    const audio = document.getElementById('audioChamada');
    if (audio) {
        audio.currentTime = 0; 
        audio.play().catch(e => console.log("Áudio bloqueado. Clique na tela!"));
    }
}

function falarSenha(codigo, nome, guiche) {
    window.speechSynthesis.cancel(); 
    const codigoSoletrado = codigo.split('').join(', ');
    
    // A PAUSA (.) e a vírgula impedem o som de "quiquiche"
    const frase = `Senha, ${codigoSoletrado}. . ${nome}. . Favor dirigir-se ao ${guiche}`;
    
    const mensagem = new SpeechSynthesisUtterance(frase);
    mensagem.lang = 'pt-BR';
    mensagem.rate = 0.9; // Velocidade natural
    window.speechSynthesis.speak(mensagem);
}

function processarChamada(atendimento) {
    const ticketElement = document.getElementById('current-ticket');
    const nameElement = document.getElementById('current-name');
    const guicheElement = document.getElementById('current-guiche');

    if (atendimento.senha !== ultimaSenha) {
        ultimaSenha = atendimento.senha;
        
        tocarAlertaSonoro();
        
        const card = document.getElementById('card-principal');
        if (card) {
            card.classList.add('flash-effect');
            setTimeout(() => card.classList.remove('flash-effect'), 5000);
        }

        setTimeout(() => {
            falarSenha(atendimento.senha, atendimento.nome, atendimento.guiche);
        }, 1200);

        if (ticketElement) ticketElement.textContent = atendimento.senha;
        if (nameElement) nameElement.textContent = atendimento.nome.toUpperCase();
        if (guicheElement) guicheElement.textContent = atendimento.guiche;

        fetchFila();
    }
}

async function fetchFila() {
    try {
        const response = await fetch('/atendente-historico');
        const chamados = await response.json();
        const historyList = document.getElementById('history-list');

        if (historyList && chamados) {
            historyList.innerHTML = chamados.slice(0, 6).map(item => `
                <div class="flex justify-between items-center p-4 bg-gray-50 rounded-2xl border-l-8 border-[#005ca9] mb-3">
                    <div class="flex flex-col">
                        <span class="text-4xl font-black text-[#005ca9]">${item.codigo}</span>
                        <span class="text-xs font-bold text-gray-400 uppercase">${item.guiche}</span>
                    </div>
                    <span class="text-xl font-bold text-gray-500 uppercase">${item.nome}</span>
                </div>
            `).join('');
        }
    } catch (error) { console.error("Erro ao buscar histórico:", error); }
}

// Relógio
function updateClock() {
    const agora = new Date();
    const cl = document.getElementById('clock');
    const dt = document.getElementById('date');
    if (cl) cl.textContent = agora.toLocaleTimeString('pt-BR');
    if (dt) dt.textContent = agora.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
}
setInterval(updateClock, 1000);
updateClock();

document.addEventListener('click', () => {
    tocarAlertaSonoro();
    if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(e => {});
}, { once: true });
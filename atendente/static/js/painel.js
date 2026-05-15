let ultimaSenha = ""; 

// Conexão WebSocket
const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const socket = new WebSocket(`${protocol}//${window.location.host}/ws`);

socket.onmessage = function(event) {
    try {
        const data = JSON.parse(event.data);
        
        // Se receber o sinal de atualizar painel, usamos os dados enviados
        if (data.tipo === "atualizar_painel") {
            console.log("🔔 Nova senha recebida via WebSocket:", data.senha);
            processarChamada(data);
        }
    } catch (e) {
        // Caso o servidor envie apenas a string "atualizar_painel" (compatibilidade)
        if (event.data === "atualizar_painel") {
            fetchFila();
        }
    }
};

socket.onclose = function() {
    console.error("❌ Conexão perdida. Reconectando...");
    setTimeout(() => location.reload(), 5000);
};

// --- ÁUDIO E VOZ ---
function tocarAlertaSonoro() {
    const audio = document.getElementById('audioChamada');
    if (audio) {
        audio.currentTime = 0; 
        audio.play().catch(e => console.log("Áudio bloqueado. Clique na tela!"));
    }
}

function falarSenha(codigo, nome, guiche) {
    window.speechSynthesis.cancel(); 

    // Soletrar o código: A001 -> A, 0, 0, 1
    const codigoSoletrado = codigo.split('').join(', ');
    
    // CORREÇÃO DO QUIQUICHE: Usamos "Guichê número" com vírgulas para dar pausa
    const frase = `Senha, ${codigoSoletrado}. . Aluno, ${nome}. . Guichê, , ${guiche}`;
    
    const mensagem = new SpeechSynthesisUtterance(frase);
    mensagem.lang = 'pt-BR';
    mensagem.rate = 0.8; // Velocidade natural
    
    window.speechSynthesis.speak(mensagem);
}

// --- LÓGICA DE ATUALIZAÇÃO ---
function processarChamada(atendimento) {
    const ticketElement = document.getElementById('current-ticket');
    const nameElement = document.getElementById('current-name');
    const guicheElement = document.getElementById('current-guiche');

    // SÓ CHAMA SE A SENHA MUDOU (Sua trava de segurança)
    if (atendimento.senha !== ultimaSenha) {
        ultimaSenha = atendimento.senha;
        
        // 1º Toca o Som
        tocarAlertaSonoro();
        
        // 2º Brilho (Flash)
        const card = document.getElementById('card-principal');
        if (card) {
            card.classList.add('flash-effect');
            setTimeout(() => card.classList.remove('flash-effect'), 5000);
        }

        // 3º Fala a senha (com atraso para o som terminar)
        setTimeout(() => {
            falarSenha(atendimento.senha, atendimento.nome, atendimento.guiche);
        }, 1200);

        // Atualiza a tela principal
        ticketElement.textContent = atendimento.senha;
        nameElement.textContent = atendimento.nome.toUpperCase();
        guicheElement.textContent = atendimento.guiche;

        // Atualiza o histórico lateral buscando os dados atualizados do banco
        fetchFila();
    }
}

// Busca o histórico do banco para preencher a lateral
async function fetchFila() {
    try {
        const response = await fetch('/listar-fila'); // Pode ser também '/atendente-historico'
        const fila = await response.json();
        const historyList = document.getElementById('history-list');

        if (historyList) {
            // Pegamos as senhas que já foram chamadas (excluindo a atual se quiser)
            const chamados = fila.filter(item => item.status === "chamado");
            
            historyList.innerHTML = chamados.slice(0, 5).map(item => `
                <div class="flex justify-between items-center p-4 bg-gray-50 rounded-2xl border-l-8 border-[#005ca9] mb-3">
                    <div class="flex flex-col">
                        <span class="text-4xl font-black text-[#005ca9]">${item.codigo}</span>
                        <span class="text-xs font-bold text-gray-400 uppercase">${item.guiche}</span>
                    </div>
                    <span class="text-xl font-bold text-gray-500 uppercase">${item.nome.split(' ')[0]}</span>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error("Erro ao buscar histórico:", error);
    }
}

// --- RELÓGIO ---
function updateClock() {
    const agora = new Date();
    const clockEl = document.getElementById('clock');
    const dateEl = document.getElementById('date');
    if (clockEl) clockEl.textContent = agora.toLocaleTimeString('pt-BR');
    if (dateEl) {
        const opcoes = { weekday: 'long', day: 'numeric', month: 'long' };
        dateEl.textContent = agora.toLocaleDateString('pt-BR', opcoes);
    }
}
setInterval(updateClock, 1000);
updateClock();

// OBRIGATÓRIO: Desbloqueia som e entra em tela cheia no clique
document.addEventListener('click', () => {
    console.log("Sistema de áudio liberado!");
    tocarAlertaSonoro(); // Toca uma vez silencioso para liberar
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(e => {});
    }
}, { once: true });
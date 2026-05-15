let idAtual = null;

// Conexão WebSocket para ouvir atualizações em tempo real
const socket = new WebSocket(`ws://${window.location.host}/ws`);

// Sempre que o servidor avisar algo (nova senha ou chamada), atualizamos as listas
socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    carregarTudo();
};

async function carregarTudo() {
    console.log("Atualizando listas do atendente...");
    await carregarFila();
    await carregarHistorico();
}

// 1. CARREGA A FILA DE ESPERA (PARTE DE BAIXO)
async function carregarFila() {
    try {
        const res = await fetch('/listar-fila');
        const fila = await res.json();
        const listaEspera = document.getElementById('lista-espera');
        const contador = document.getElementById('contador-fila');

        // Atualiza o texto do contador (ex: 3 na fila)
        if (contador) contador.innerText = `( ${fila.length} na fila )`;
        
        if (!listaEspera) return;
        listaEspera.innerHTML = fila.length ? '' : '<p class="text-center py-4 text-gray-400 font-bold uppercase text-xs">Fila Vazia</p>';

        fila.forEach(item => {
            const div = document.createElement('div');
            div.className = "flex justify-between items-center p-4 bg-gray-50 rounded-xl border-l-4 border-gray-300 mb-2 shadow-sm";
            div.innerHTML = `
                <div>
                    <b class="text-[#005ca9] text-xl">${item.codigo}</b> 
                    <span class="ml-2 font-bold text-gray-600">${item.nome}</span>
                </div>
                <button onclick="chamarID(${item.id})" class="bg-[#005ca9] hover:bg-blue-800 text-white px-6 py-2 rounded-lg text-sm font-black transition-all">
                    CHAMAR
                </button>
            `;
            listaEspera.appendChild(div);
        });
    } catch (err) {
        console.error("Erro ao carregar fila:", err);
    }
}

// 2. CARREGA O HISTÓRICO LATERAL (DIREITA)
async function carregarHistorico() {
    try {
        const res = await fetch('/atendente-historico');
        const historico = await res.json();
        const listaHist = document.getElementById('history-list-atendente');
        
        if (!listaHist) return;
        listaHist.innerHTML = '';

        historico.forEach(item => {
            const div = document.createElement('div');
            div.className = "p-4 bg-white rounded-xl border-l-4 border-orange-500 flex justify-between items-center mb-3 shadow-sm border border-gray-100";
            div.innerHTML = `
                <div>
                    <div class="font-black text-gray-800 text-lg">${item.codigo}</div>
                    <div class="text-xs text-gray-400 uppercase font-bold">${item.nome}</div>
                </div>
                <button onclick="rechamar(${item.id})" class="text-orange-500 hover:bg-orange-50 p-2 rounded-full transition-colors">
                    <i data-lucide="refresh-cw" class="w-5 h-5"></i>
                </button>
            `;
            listaHist.appendChild(div);
        });
        
        // Reinicializa os ícones do Lucide (importante para o ícone de girar aparecer)
        if (window.lucide) lucide.createIcons();
    } catch (err) {
        console.error("Erro ao carregar histórico:", err);
    }
}

// 3. FUNÇÃO DO BOTÃO "CHAMAR PRÓXIMO"
async function chamarProximo() {
    const guiche = document.getElementById('select-guiche').value;
    try {
        const res = await fetch('/chamar-proxima', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ guiche: guiche })
        });
        
        if (res.ok) {
            const p = await res.json();
            atualizarDisplay(p);
        } else {
            alert("Não há ninguém na fila!");
        }
    } catch (err) {
        console.error("Erro ao chamar próximo:", err);
    }
}

// 4. FUNÇÃO DE CHAMAR UMA SENHA ESPECÍFICA DA LISTA
async function chamarID(id) {
    const guiche = document.getElementById('select-guiche').value;
    try {
        const res = await fetch(`/chamar-especifica/${id}`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ guiche: guiche })
        });
        if (res.ok) {
            const p = await res.json();
            atualizarDisplay(p);
        }
    } catch (err) {
        console.error("Erro ao chamar senha específica:", err);
    }
}

// 5. ATUALIZA OS TEXTOS NO DISPLAY CENTRAL DO ATENDENTE
function atualizarDisplay(p) {
    idAtual = p.id; // Guarda o ID para o botão "Repetir"
    document.getElementById('atendente-codigo').innerText = p.codigo;
    document.getElementById('atendente-nome').innerText = p.nome;
    
    // Ativa o botão REPETIR CHAMADA (tira a transparência)
    const btn = document.getElementById('btn-repetir');
    if (btn) {
        btn.disabled = false;
        btn.classList.remove('opacity-50', 'cursor-not-allowed', 'bg-gray-200');
        btn.classList.add('bg-white', 'text-gray-700', 'hover:bg-gray-100', 'shadow-md');
    }
    
    // Força a atualização das listas
    carregarTudo();
}

// 6. FUNÇÕES DE REPETIÇÃO
function repetirChamadaAtual() { 
    if (idAtual) {
        rechamar(idAtual); 
    } else {
        console.warn("Nenhum atendimento ativo para repetir.");
    }
}

async function rechamar(id) { 
    try {
        // Rota que avisa o painel via WebSocket
        await fetch(`/chamar-novamente/${id}`, { method: 'POST' });
        console.log("Chamada repetida para o ID:", id);
    } catch (err) {
        console.error("Erro ao rechamar senha:", err);
    }
}

// Carrega tudo ao abrir a página
carregarTudo();
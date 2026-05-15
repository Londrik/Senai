let idAtual = null;

// Conexão WebSocket
const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const socket = new WebSocket(`${protocol}//${window.location.host}/ws`);

socket.onmessage = function(event) {
    const data = JSON.parse(event.data);
    // Sempre que houver mudança na lista ou nova senha, o atendente recarrega as listas
    if (data.tipo === "atualizar_lista") {
        carregarTudo();
    }
};

async function carregarTudo() {
    console.log("Atualizando dados do atendente...");
    await carregarFila();
    await carregarHistorico();
}

async function carregarFila() {
    const res = await fetch('/listar-fila');
    const fila = await res.json();
    const div = document.getElementById('lista-espera');
    const cont = document.getElementById('contador-fila');
    
    if (cont) cont.innerText = `${fila.length} na fila`;
    if (!div) return;

    div.innerHTML = fila.length ? '' : '<p class="text-center py-4 text-gray-400 font-bold uppercase text-[10px]">Fila Vazia</p>';
    
    fila.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.className = "flex justify-between items-center p-4 bg-gray-50 rounded-xl border-l-4 border-gray-300 shadow-sm mb-2";
        itemDiv.innerHTML = `
            <div><b class="text-blue-700 text-lg">${item.codigo}</b> <span class="ml-2 font-bold text-gray-600">${item.nome}</span></div>
            <button onclick="chamarID(${item.id})" class="bg-[#005ca9] text-white px-6 py-2 rounded-lg text-sm font-black hover:bg-blue-800 transition">CHAMAR</button>
        `;
        div.appendChild(itemDiv);
    });
}

async function carregarHistorico() {
    const res = await fetch('/atendente-historico');
    const hist = await res.json();
    const div = document.getElementById('history-list-atendente');
    if (!div) return;

    div.innerHTML = '';
    hist.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.className = "p-4 bg-white rounded-xl border-l-4 border-orange-500 flex justify-between items-center shadow-sm mb-2 border border-gray-100";
        itemDiv.innerHTML = `
            <div>
                <div class="font-black text-gray-700">${item.codigo}</div>
                <div class="text-[10px] text-gray-400 font-bold uppercase">${item.nome}</div>
            </div>
            <button onclick="rechamar(${item.id})" class="text-orange-500 p-2 hover:bg-orange-50 rounded-full transition">
                <i data-lucide="refresh-cw" class="w-5 h-5"></i>
            </button>
        `;
        div.appendChild(itemDiv);
    });
    if (window.lucide) lucide.createIcons(); // Recarrega os ícones nos novos elementos
}

async function chamarProximo() {
    const g = document.getElementById('select-guiche').value;
    const res = await fetch('/chamar-proxima', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ guiche: g })
    });
    if (res.ok) {
        const p = await res.json();
        atualizarDisplay(p);
    }
}

async function chamarID(id) {
    const g = document.getElementById('select-guiche').value;
    const res = await fetch(`/chamar-especifica/${id}`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ guiche: g })
    });
    if (res.ok) {
        const p = await res.json();
        atualizarDisplay(p);
    }
}

function atualizarDisplay(p) {
    idAtual = p.id;
    document.getElementById('atendente-codigo').innerText = p.codigo;
    document.getElementById('atendente-nome').innerText = p.nome;
    
    const btn = document.getElementById('btn-repetir');
    if (btn) {
        btn.disabled = false;
        btn.classList.remove('opacity-50', 'cursor-not-allowed');
    }
    carregarTudo();
}

function repetirChamadaAtual() { if (idAtual) rechamar(idAtual); }
async function rechamar(id) { await fetch(`/chamar-novamente/${id}`, { method: 'POST' }); }

// Inicializa
carregarTudo();
let idAtual = null;
const socket = new WebSocket(`ws://${window.location.host}/ws`);

socket.onmessage = () => carregarTudo();

async function carregarTudo() {
    // Fila de Espera
    const resF = await fetch('/listar-fila');
    const fila = await resF.json();
    const divF = document.getElementById('lista-espera');
    const cont = document.getElementById('contador-fila');
    if (cont) cont.innerText = `${fila.length} na fila`;
    if (divF) {
        divF.innerHTML = fila.length ? '' : '<p class="text-center py-4 text-gray-400">FILA VAZIA</p>';
        fila.forEach(i => {
            const d = document.createElement('div');
            d.className = "flex justify-between p-4 bg-gray-50 mb-2 rounded-xl border-l-4 border-blue-500 shadow-sm";
            d.innerHTML = `<span><b>${i.codigo}</b> - ${i.nome}</span>
                           <button onclick="chamarID(${i.id})" class="bg-[#005ca9] text-white px-4 py-1 rounded font-bold">CHAMAR</button>`;
            divF.appendChild(d);
        });
    }

    // Histórico Lateral Atendente
    const resH = await fetch('/atendente-historico');
    const hist = await resH.json();
    const divH = document.getElementById('history-list-atendente');
    if (divH) {
        divH.innerHTML = '';
        hist.forEach(i => {
            const d = document.createElement('div');
            d.className = "p-3 bg-white mb-2 rounded shadow-sm border-l-4 border-orange-500 flex justify-between items-center";
            d.innerHTML = `<div><b>${i.codigo}</b><br><small class="uppercase">${i.nome}</small></div>
                           <button onclick="rechamar(${i.id})" class="text-orange-500"><i data-lucide="refresh-cw" class="w-5 h-5"></i></button>`;
            divH.appendChild(d);
        });
        if (window.lucide) lucide.createIcons();
    }
}

async function chamarProximo() {
    const g = document.getElementById('select-guiche').value;
    const res = await fetch('/chamar-proxima', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ guiche: g }) });
    if (res.ok) {
        const p = await res.json();
        idAtual = p.id;
        document.getElementById('atendente-codigo').innerText = p.codigo;
        document.getElementById('atendente-nome').innerText = p.nome;
        document.getElementById('btn-repetir').disabled = false;
        document.getElementById('btn-repetir').classList.remove('opacity-50');
        carregarTudo();
    }
}

async function chamarID(id) {
    const g = document.getElementById('select-guiche').value;
    const res = await fetch(`/chamar-especifica/${id}`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ guiche: g }) });
    if (res.ok) {
        const p = await res.json();
        idAtual = p.id;
        document.getElementById('atendente-codigo').innerText = p.codigo;
        document.getElementById('atendente-nome').innerText = p.nome;
        document.getElementById('btn-repetir').disabled = false;
        document.getElementById('btn-repetir').classList.remove('opacity-50');
        carregarTudo();
    }
}

function repetirChamadaAtual() { if (idAtual) rechamar(idAtual); }
async function rechamar(id) { await fetch(`/chamar-novamente/${id}`, { method: 'POST' }); }

carregarTudo();
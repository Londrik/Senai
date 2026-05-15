/**
 * SISTEMA DE ATENDIMENTO SENAI - JS DO ATENDENTE
 */

// Inicialização segura de ícones
if (typeof lucide !== 'undefined') {
    lucide.createIcons();
}

let atendimentoAtual = null;

// --- CONEXÃO WEBSOCKET ---
const protocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
const socket = new WebSocket(`${protocol}${window.location.host}/ws`);

socket.onmessage = function(event) {
    try {
        const data = JSON.parse(event.data);
        if (data.tipo === "atualizar_lista") {
            console.log("🔄 Fila atualizada via WebSocket");
            atualizarFila();
        }
    } catch (e) {
        if (event.data === "atualizar_lista") {
            atualizarFila();
        }
    }
};

socket.onclose = () => console.warn("⚠️ WebSocket do atendente desconectado.");

// --- FUNÇÕES DE ATENDIMENTO ---

async function chamarEspecifica(id) {
    const guicheEl = document.getElementById("select-guiche");
    const guicheSelecionado = guicheEl ? guicheEl.value : "Guichê 01";
    
    try {
        // Usando window.location.origin para evitar erro 404 de rota
        const response = await fetch(`${window.location.origin}/chamar-especifica/${id}`, { 
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ guiche: guicheSelecionado })
        });

        if (response.ok) {
            atendimentoAtual = await response.json();
            exibirAtendimentoNaTela(atendimentoAtual);
            atualizarFila();
        } else {
            console.error("Erro ao chamar específica:", response.status);
        }
    } catch (error) {
        console.error("Erro na requisição específica:", error);
    }
}

async function chamarProximo() {
    const guicheEl = document.getElementById("select-guiche");
    const guicheSelecionado = guicheEl ? guicheEl.value : "Guichê 01";

    try {
        const response = await fetch(`${window.location.origin}/chamar-proxima`, { 
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ guiche: guicheSelecionado })
        });

        if (response.ok) {
            atendimentoAtual = await response.json();
            exibirAtendimentoNaTela(atendimentoAtual);
            atualizarFila();
        } else if (response.status === 404) {
            alert("Não há ninguém na fila de espera.");
        }
    } catch (error) {
        console.error("Erro ao chamar próximo:", error);
    }
}

// Função para atualizar os textos na tela do atendente
function exibirAtendimentoNaTela(dados) {
    const codEl = document.getElementById("atendente-codigo");
    const nomeEl = document.getElementById("atendente-nome");
    if (codEl) codEl.textContent = dados.codigo;
    if (nomeEl) nomeEl.textContent = dados.nome || "---";
}

// Função para buscar e renderizar a fila lateral
async function atualizarFila() {
    try {
        // Timestamp para evitar cache (problema comum no Chrome/Edge)
        const response = await fetch(`${window.location.origin}/listar-fila?t=${new Date().getTime()}`);
        const fila = await response.json();
        
        const lista = document.getElementById("lista-espera");
        const contador = document.getElementById("contador-fila");
        
        // Filtra apenas quem ainda NÃO tem guichê (está esperando)
        const aguardando = fila.filter(item => item.guiche === null);

        if (contador) contador.textContent = `${aguardando.length} na fila`;

        if (!lista) return;

        if (aguardando.length === 0) {
            lista.innerHTML = `<p class="text-center text-gray-400 py-4 font-bold uppercase text-[10px]">Fila vazia</p>`;
            return;
        }

        lista.innerHTML = aguardando.map(item => `
            <div onclick="chamarEspecifica(${item.id})" 
                class="flex justify-between items-center p-4 bg-white hover:bg-blue-50 cursor-pointer transition-all duration-200 rounded-xl border-l-4 shadow-sm mb-2 group ${item.tipo === "Prioritário" || item.tipo === "Preferencial" ? "border-red-500" : "border-blue-600"}">
                <div class="flex flex-col">
                    <span class="font-black text-lg group-hover:text-blue-700">${item.codigo}</span>
                    <span class="text-gray-600 font-medium text-sm">${item.nome || "Anônimo"}</span>
                </div>
                <div class="flex flex-col items-end gap-1">
                    <span class="text-[9px] font-bold uppercase px-2 py-1 rounded ${item.tipo === "Prioritário" || item.tipo === "Preferencial" ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"}">
                        ${item.tipo}
                    </span>
                    <span class="text-[8px] text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">Clique para chamar</span>
                </div>
            </div>
        `).join("");
    } catch (error) {
        console.error("Erro ao atualizar fila:", error);
    }
}

// Intervalo de segurança caso o WebSocket caia
setInterval(atualizarFila, 15000);
atualizarFila();
/**
 * SISTEMA DE MÉTRICAS E ADMINISTRAÇÃO - DASHBOARD
 * Responsável por renderizar KPIs e gerenciar o estado global da fila.
 */

let chartBarras = null;
let chartPizza = null;

/**
 * Consome a API de métricas e atualiza a interface do usuário.
 */
async function carregarDados() {
    try {
        const response = await fetch('/api/v1/metrics');
        const data = await response.json();

        // Atualização dos indicadores quantitativos
        document.getElementById('card-total').textContent = data.resumo.total;
        document.getElementById('card-media').innerHTML = `${data.resumo.media_espera} <span class="text-lg font-light">min</span>`;

        renderizarGraficoBarras(data.grafico_hora);
        renderizarGraficoPizza(data.resumo.distribuicao);

    } catch (error) {
        console.error("Falha ao recuperar métricas do servidor:", error);
    }
}

/**
 * Função Administrativa: Reseta a fila ativa mediante autenticação.
 */
async function solicitarResetFila() {
    const token = prompt("Ação Restrita: Digite a chave de segurança para zerar a fila ativa:");
    
    if (!token) return;

    try {
        const response = await fetch("/limpar-fila-seguro", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token: token })
        });

        if (response.ok) {
            alert("Sucesso: Fila ativa removida. Histórico preservado.");
            carregarDados();
        } else {
            const erro = await response.json();
            alert("Erro de Autenticação: " + erro.detail);
        }
    } catch (error) {
        alert("Erro de conexão ao tentar resetar fila.");
    }
}

function renderizarGraficoBarras(dadosHora) {
    const ctx = document.getElementById('graficoBarras').getContext('2d');
    if (chartBarras) chartBarras.destroy();

    chartBarras = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: dadosHora.map(d => d.hora),
            datasets: [{
                label: 'Atendimentos',
                data: dadosHora.map(d => d.quantidade),
                backgroundColor: '#005DA5',
                borderRadius: 8
            }]
        },
        options: { responsive: true, scales: { y: { beginAtZero: true } } }
    });
}

function renderizarGraficoPizza(distribuicao) {
    const ctx = document.getElementById('graficoPizza').getContext('2d');
    if (chartPizza) chartPizza.destroy();

    chartPizza = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(distribuicao),
            datasets: [{
                data: Object.values(distribuicao),
                backgroundColor: ['#ef4444', '#22c55e', '#3b82f6'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { position: 'bottom' } }
        }
    });
}

window.onload = carregarDados;
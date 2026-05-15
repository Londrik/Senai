let chartPizza = null;

// Função para pegar cor do CSS
function getStyleColor(variable) {
    return getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
}

async function carregarDados() {
    try {
        const response = await fetch('/api/v1/metrics');
        const data = await response.json();

        // Injeta valores nos cards
        document.getElementById('card-norm').innerText = data.norm;
        document.getElementById('card-pref').innerText = data.pref;
        document.getElementById('card-fin').innerText = data.fina;
        document.getElementById('card-total').innerText = data.total;

        renderizarGrafico(data.norm, data.pref, data.fina);
    } catch (error) {
        console.error("Erro ao carregar métricas:", error);
    }
}

function renderizarGrafico(n, p, f) {
    const ctx = document.getElementById('graficoPizza').getContext('2d');
    if (chartPizza) chartPizza.destroy();

    const total = n + p + f;

    // Puxa as cores do seu arquivo dashboard.css
    const corNorm = getStyleColor('--cinza-normal');
    const corPref = getStyleColor('--azul-senai');
    const corFina = getStyleColor('--vermelho-senai');
    const corVazio = '#f3f4f6';

    const temDados = total > 0;

    chartPizza = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Normal', 'Preferencial', 'Financeiro'],
            datasets: [{
                // Se não tiver dados, o gráfico não aparece "fatiado"
                data: temDados ? [n, p, f] : [0, 0, 0], 
                backgroundColor: [corNorm, corPref, corFina],
                borderWidth: temDados ? 5 : 0,
                borderColor: '#ffffff',
                hoverOffset: 20
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '75%',
            plugins: {
                legend: { position: 'bottom', labels: { padding: 30, font: { size: 14, weight: 'bold' } } }
            }
        }
    });
}

async function solicitarResetFila() {
    const token = prompt("Senha Master:");
    if (token === "senai123") {
        await fetch("/limpar-fila-seguro", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token: token })
        });
        alert("Sistema Limpo!");
        carregarDados();
    }
}

window.onload = carregarDados;
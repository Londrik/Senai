(function() {
    let ultimaSenha = "";

    async function atualizarPainel() {
        try {
            const response = await fetch(`/listar-fila?t=${Date.now()}`);
            const fila = await response.json();

            // Pega apenas quem já tem guichê definido
            const chamados = fila.filter(i => i.guiche).sort((a, b) => b.id - a.id);

            if (chamados.length > 0) {
                const atual = chamados[0];
                
                // Atualiza a tela independente de qualquer erro anterior
                const ticket = document.getElementById('current-ticket');
                const nome = document.getElementById('current-name');
                const guiche = document.getElementById('current-guiche');

                if (ticket) ticket.textContent = atual.codigo;
                if (nome) nome.textContent = atual.nome || "ALUNO";
                if (guiche) guiche.textContent = atual.guiche;

                // Toca o áudio apenas se o arquivo existir, sem travar o código
                if (atual.codigo !== ultimaSenha) {
                    ultimaSenha = atual.codigo;
                    const audio = document.getElementById('audioChamada');
                    if (audio) {
                        audio.play().catch(() => console.log("Áudio aguardando interação do usuário."));
                    }
                    
                    // Voz (SpeechSynthesis não depende de arquivo externo)
                    const fala = new SpeechSynthesisUtterance(`Senha ${atual.codigo}, dirija-se ao ${atual.guiche}`);
                    fala.lang = 'pt-BR';
                    window.speechSynthesis.speak(fala);
                }
            }
        } catch (e) {
            console.error("Erro ao processar dados:", e);
        }
    }

    // WebSocket + Intervalo de backup
    const ws = new WebSocket(`${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/ws`);
    ws.onmessage = () => atualizarPainel();
    
    // Força atualização a cada 3 segundos se o WebSocket falhar
    setInterval(atualizarPainel, 3000);
    atualizarPainel();
})();
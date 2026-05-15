const socket = new WebSocket(`ws://${window.location.host}/ws`);
const audio = document.getElementById('audioChamada');

// Desbloqueia áudio no primeiro clique
document.addEventListener('click', () => {
    if (audio) { audio.play().then(() => { audio.pause(); audio.currentTime = 0; }); }
}, { once: true });

socket.onmessage = function(event) {
    const data = JSON.parse(event.data);
    if (data.tipo === "atualizar_painel") {
        // 1. Tela
        document.getElementById('current-ticket').innerText = data.senha;
        document.getElementById('current-name').innerText = data.nome.toUpperCase();
        document.getElementById('current-guiche').innerText = data.guiche;

        // 2. Brilho
        const card = document.getElementById('card-principal');
        if (card) {
            card.classList.add('flash-effect');
            setTimeout(() => card.classList.remove('flash-effect'), 5000);
        }

        // 3. Som MP3 Local
        if (audio) { audio.currentTime = 0; audio.play().catch(() => {}); }

        // 4. Voz (Pausas com pontos resolvem o quiquiche)
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const frase = `Senha. ${data.senha.split('').join(' ')}. . ${data.nome}. . Guichê. . ${data.guiche}`;
            const msg = new SpeechSynthesisUtterance(frase);
            msg.lang = 'pt-BR';
            msg.rate = 0.8;
            window.speechSynthesis.speak(msg);
        }

        // 5. Histórico Lateral do Painel
        const lista = document.getElementById('history-list');
        if (lista) {
            const item = document.createElement('div');
            item.className = "flex justify-between items-center bg-gray-50 p-4 rounded-xl border-l-4 border-[#005ca9] mb-4 shadow-sm";
            item.innerHTML = `<div><div class="text-3xl font-black text-[#005ca9]">${data.senha}</div><div class="text-sm font-bold text-gray-400 uppercase">${data.guiche}</div></div><div class="text-xs font-bold text-gray-300 uppercase italic">Aluno</div>`;
            lista.prepend(item);
            if (lista.children.length > 5) lista.removeChild(lista.lastChild);
        }
    }
};

setInterval(() => {
    const cl = document.getElementById('clock');
    if (cl) cl.innerText = new Date().toLocaleTimeString('pt-BR');
}, 1000);
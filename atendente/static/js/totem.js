async function gerarSenha(tipo) {
    const inputNome = document.getElementById('input-nome');
    const nomeInformado = inputNome.value.trim() || "Aluno SENAI"; 

    try {
        const response = await fetch('/gerar-senha', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                nome: nomeInformado, 
                tipo: tipo 
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            inputNome.value = ""; // Limpa para o próximo
            exibirSucesso(data.codigo, tipo);
        } else {
            alert("❌ Erro ao gerar senha.");
        }
    } catch (error) {
        console.error("Erro:", error);
        alert("⚠️ Erro de conexão com o servidor.");
    }
}

function exibirSucesso(codigo, tipo) {
    document.getElementById('grid-servicos').classList.add('hidden');
    document.getElementById('display-senha').textContent = codigo;
    document.getElementById('info-servico').textContent = `SERVIÇO: ${tipo}`;
    
    const feedback = document.getElementById('feedback-sucesso');
    feedback.classList.remove('hidden');

    setTimeout(() => {
        feedback.classList.add('hidden');
        document.getElementById('grid-servicos').classList.remove('hidden');
    }, 5000);
}
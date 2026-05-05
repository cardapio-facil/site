// ============================================
// ===== PAINEL CONFIG MENSAGENS ===============
// ============================================

function abrirModalMensagens() {
    if (nivelAcesso !== 'master') {
        alert('Acesso restrito. Apenas Master pode configurar mensagens.');
        return;
    }

    const existente = document.getElementById('modalMensagens');
    if (existente) existente.remove();

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay active';
    overlay.id = 'modalMensagens';
    overlay.onclick = (e) => { if (e.target === overlay) fecharModalMensagens(); };

    // Gera campos para cada status
    let statusFields = '';
    const statusList = ['preparando', 'saiu_entrega', 'confirmado', 'entregue', 'cancelado'];
    statusList.forEach(status => {
        const config = CONFIG_PAINEL.mensagens[status] || { ativo: false, prefixo: '' };
        statusFields += `
            <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(128,0,32,0.3); border-radius:12px; padding:15px; margin-bottom:15px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                    <strong style="color:var(--border-color);">${getStatusLabel(status)}</strong>
                    <label style="cursor:pointer;">
                        <input type="checkbox" id="msg_${status}_ativo" ${config.ativo ? 'checked' : ''}> Ativar envio automático
                    </label>
                </div>
                <label style="font-size:0.8rem; color:#aaa;">Mensagem inicial (antes dos detalhes):</label>
                <textarea id="msg_${status}_prefixo" style="width:100%; padding:10px; background:rgba(255,255,255,0.08); border:2px solid #444; border-radius:8px; color:#fff; resize:vertical; min-height:60px;">${config.prefixo || ''}</textarea>
                <small style="color:#888;">Variáveis: {NOME_RESTAURANTE}, {NUMERO}</small>
            </div>
        `;
    });

    overlay.innerHTML = `
        <div class="modal-content" style="max-width: 700px;" onclick="event.stopPropagation()">
            <h2>📧 Configuração de Mensagens</h2>
            <p style="color:#aaa; margin-bottom:15px;">Configure os prefixos das mensagens enviadas automaticamente via WhatsApp.</p>
            
            ${statusFields}
            
            <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(128,0,32,0.3); border-radius:12px; padding:15px; margin-bottom:15px;">
                <strong style="color:var(--border-color);">Tempo Estimado</strong>
                <input type="text" id="msg_tempoEstimado" value="${CONFIG_PAINEL.tempoEstimado}" style="width:100%; padding:10px; background:rgba(255,255,255,0.08); border:2px solid #444; border-radius:8px; color:#fff; margin-top:8px;">
            </div>
            
            <button class="btn-fechar-modal" onclick="salvarConfigMensagens()" style="background:#4CAF50;">
                <i class="fas fa-save"></i> SALVAR CONFIGURAÇÕES
            </button>
            <button class="btn-fechar-modal" onclick="fecharModalMensagens()" style="margin-top:10px;">CANCELAR</button>
        </div>
    `;

    document.body.appendChild(overlay);
}

function fecharModalMensagens() {
    const modal = document.getElementById('modalMensagens');
    if (modal) modal.remove();
}

async function salvarConfigMensagens() {
    const statusList = ['preparando', 'saiu_entrega', 'confirmado', 'entregue', 'cancelado'];
    
    statusList.forEach(status => {
        const ativoCheck = document.getElementById(`msg_${status}_ativo`);
        const prefixoInput = document.getElementById(`msg_${status}_prefixo`);
        if (ativoCheck && prefixoInput) {
            CONFIG_PAINEL.mensagens[status] = {
                ativo: ativoCheck.checked,
                prefixo: prefixoInput.value
            };
        }
    });

    const tempoEl = document.getElementById('msg_tempoEstimado');
    if (tempoEl) CONFIG_PAINEL.tempoEstimado = tempoEl.value;

    // Salva no Firebase
    try {
        await dbRef.child('config/mensagens').set(CONFIG_PAINEL.mensagens);
        await dbRef.child('config/tempoEstimado').set(CONFIG_PAINEL.tempoEstimado);
        alert('Configurações salvas com sucesso!');
        fecharModalMensagens();
    } catch (error) {
        console.error('Erro ao salvar:', error);
        alert('Erro ao salvar configurações.');
    }
}

// ===== EXPOR =====
window.abrirModalMensagens = abrirModalMensagens;
window.fecharModalMensagens = fecharModalMensagens;
window.salvarConfigMensagens = salvarConfigMensagens;
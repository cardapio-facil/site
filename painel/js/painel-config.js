// ============================================
// ===== CONFIGURAÇÕES DO PAINEL ==============
// ============================================

const CONFIG_PAINEL = {
    restauranteId: 'deliverypro',
    nomeRestaurante: 'Delivery Pro',
    cidade: 'Conselheiro Lafaiete',  // ← ADICIONAR
    uf: 'MG', 
    logoUrl: 'https://png.pngtree.com/png-clipart/20200727/original/pngtree-pin-food-delivery-map-location-delivery-logo-concept-png-image_5137624.jpg',

    firebase: {
        apiKey: "AIzaSyDjJG3qD1OhPJ_N-mfzH-ChMvHAez6XsGc",
        authDomain: "graus-38cce.firebaseapp.com",
        databaseURL: "https://graus-38cce-default-rtdb.firebaseio.com",
        projectId: "graus-38cce",
        storageBucket: "graus-38cce.firebasestorage.app",
        messagingSenderId: "167323638749",
        appId: "1:167323638749:web:6675d3d1edec31096b7434"
    },

      senhaMasterPadrao: null,
      senhaViewPadrao: null,

    intervaloCronometro: 10,

  mensagens: {
    preparando: {
        ativo: true,
        prefixo: '{NOME_RESTAURANTE} - Seu pedido #{NUMERO} esta sendo preparado!\n\n'
    },
    saiu_entrega: {          // ← alterado de saiuEntrega para saiu_entrega
        ativo: true,
        prefixo: '{NOME_RESTAURANTE} - Pedido #{NUMERO} saiu para entrega!\n\n'
    },
    confirmado: {
        ativo: false,
        prefixo: '{NOME_RESTAURANTE} - Pedido #{NUMERO} confirmado!\n\n'
    },
    entregue: {
        ativo: false,
        prefixo: '{NOME_RESTAURANTE} - Pedido #{NUMERO} entregue!\n\n'
    },
    cancelado: {
        ativo: false,
        prefixo: '{NOME_RESTAURANTE} - Pedido #{NUMERO} cancelado.\n\n'
    }
},

    tempoEstimado: '60-120 min',

   fluxoStatus: ['novo', 'preparando', 'saiu_entrega', 'entregue'],

    coresStatus: {
        novo: '#4CAF50',
        confirmado: '#2196F3',
        preparando: '#FFC107',
        saiu_entrega: '#FF9800',
        entregue: '#9C27B0',
        cancelado: '#dc3545'
    }
};

// Funções auxiliares (já existentes, mantenha)
function formatarPrecoPainel(centavos) {
    if (centavos === null || centavos === undefined) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(centavos / 100);
}

function formatarDataHora(timestamp) {
    if (!timestamp) return '---';
    const data = new Date(timestamp);
    return data.toLocaleDateString('pt-BR') + ' ' + data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function formatarHora(timestamp) {
    if (!timestamp) return '---';
    const data = new Date(timestamp);
    return data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function formatarData(timestamp) {
    if (!timestamp) return '---';
    const data = new Date(timestamp);
    return data.toLocaleDateString('pt-BR');
}

function formatarTempoPreparo(minutos) {
    if (minutos < 1) return 'menos de 1 min';
    if (minutos < 10) return 'menos de 10 min';
    if (minutos < 60) return `${minutos} min`;
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    if (mins === 0) return `${horas}h`;
    return `${horas}h ${mins}min`;
}

function getStatusLabel(status) {
    const labels = {
        'novo': 'Novo',
        'confirmado': 'Confirmado',
        'preparando': 'Preparando',
        'saiu_entrega': 'Saiu para Entrega',
        'entregue': 'Entregue',
        'cancelado': 'Cancelado'
    };
    return labels[status] || status;
}

function getBadgeClass(status) {
    const classes = {
        'novo': 'badge-novo',
        'confirmado': 'badge-confirmado',
        'preparando': 'badge-preparando',
        'saiu_entrega': 'badge-saiu',
        'entregue': 'badge-entregue',
        'cancelado': 'badge-cancelado'
    };
    return classes[status] || '';
}

function getStatusClass(status) {
    const classes = {
        'novo': 'novo',
        'confirmado': 'confirmado',
        'preparando': 'preparando',
        'saiu_entrega': 'saiu',
        'entregue': 'entregue',
        'cancelado': 'cancelado'
    };
    return classes[status] || '';
}

// ============================================
// ===== CONVERSÃO DE CIDADE =================
// ============================================

function getCidadeKey() {
    return CONFIG_PAINEL.cidade
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');
}
// ============================================
// ===== SISTEMA DE BAIRROS ===================
// ============================================

let bairrosCache = {};
let atendimentoCache = {};
let bairrosAlterados = {};

// ===== CARREGAR BAIRROS DA CIDADE =====
async function carregarBairrosPainel() {
    const cidadeKey = getCidadeKey();
    
    try {
        const bairrosSnap = await database.ref(`bairros_globais/${cidadeKey}/bairros`).once('value');
        const atendimentoSnap = await dbRef.child('atendimento').once('value');
        
        bairrosCache = bairrosSnap.val() || {};
        atendimentoCache = atendimentoSnap.val() || {};
        bairrosAlterados = {};
        
        return { bairros: bairrosCache, atendimento: atendimentoCache };
    } catch (error) {
        console.error('Erro ao carregar bairros:', error);
        return { bairros: {}, atendimento: {} };
    }
}

// ===== MARCAR/ATIVAR BAIRRO (LOCAL) =====
function toggleBairroPainel(cidadeKey, bairroKey, ativo) {
    const chave = `${cidadeKey}_${bairroKey}`;
    
    if (!bairrosAlterados[chave]) {
        bairrosAlterados[chave] = {
            cidade: cidadeKey,
            bairro: bairroKey,
            ativo: ativo,
            frete: atendimentoCache[chave]?.frete || 0
        };
    } else {
        bairrosAlterados[chave].ativo = ativo;
    }
    
    const inputFrete = document.getElementById(`frete_${cidadeKey}_${bairroKey}`);
    if (inputFrete) {
        inputFrete.disabled = !ativo;
        if (ativo) inputFrete.focus();
    }
}

// ===== ALTERAR FRETE DO BAIRRO (LOCAL) =====
function alterarFretePainel(cidadeKey, bairroKey, valor) {
    const frete = parseFloat(valor) || 0;
    const chave = `${cidadeKey}_${bairroKey}`;
    
    if (!bairrosAlterados[chave]) {
        const checkbox = document.getElementById(`chk_${cidadeKey}_${bairroKey}`);
        bairrosAlterados[chave] = {
            cidade: cidadeKey,
            bairro: bairroKey,
            ativo: checkbox?.checked || false,
            frete: frete
        };
    } else {
        bairrosAlterados[chave].frete = frete;
    }
}

// ===== MARCAR TODOS OS BAIRROS =====
function marcarTodosBairrosPainel(cidadeKey) {
    Object.keys(bairrosCache).forEach(bairroKey => {
        const checkbox = document.getElementById(`chk_${cidadeKey}_${bairroKey}`);
        if (checkbox && !checkbox.checked) {
            checkbox.checked = true;
            toggleBairroPainel(cidadeKey, bairroKey, true);
        }
    });
}

// ===== DESMARCAR TODOS OS BAIRROS =====
function desmarcarTodosBairrosPainel(cidadeKey) {
    Object.keys(bairrosCache).forEach(bairroKey => {
        const checkbox = document.getElementById(`chk_${cidadeKey}_${bairroKey}`);
        if (checkbox && checkbox.checked) {
            checkbox.checked = false;
            toggleBairroPainel(cidadeKey, bairroKey, false);
        }
    });
}

// ===== APLICAR FRETE EM MARCADOS =====
function aplicarFreteMarcadosPainel(cidadeKey, valor) {
    if (!valor) return;
    const frete = parseFloat(valor);
    if (isNaN(frete) || frete < 0) return;
    
    Object.keys(bairrosCache).forEach(bairroKey => {
        const checkbox = document.getElementById(`chk_${cidadeKey}_${bairroKey}`);
        if (checkbox?.checked) {
            const inputFrete = document.getElementById(`frete_${cidadeKey}_${bairroKey}`);
            if (inputFrete) inputFrete.value = frete.toFixed(2);
            alterarFretePainel(cidadeKey, bairroKey, frete);
        }
    });
}

// ===== APLICAR FRETE EM DESMARCADOS =====
function aplicarFreteDesmarcadosPainel(cidadeKey, valor) {
    if (!valor) return;
    const frete = parseFloat(valor);
    if (isNaN(frete) || frete < 0) return;
    
    Object.keys(bairrosCache).forEach(bairroKey => {
        const checkbox = document.getElementById(`chk_${cidadeKey}_${bairroKey}`);
        if (checkbox && !checkbox.checked) {
            const inputFrete = document.getElementById(`frete_${cidadeKey}_${bairroKey}`);
            if (inputFrete) inputFrete.value = frete.toFixed(2);
            alterarFretePainel(cidadeKey, bairroKey, frete);
        }
    });
}

// ===== SALVAR TODAS AS ALTERAÇÕES =====
async function salvarBairrosPainel(cidadeKey) {
    const alteracoes = Object.values(bairrosAlterados);
    
    if (alteracoes.length === 0) {
        alert('Nenhuma alteração para salvar.');
        return false;
    }
    
    try {
        const updates = {};
        
        alteracoes.forEach(item => {
            const chave = `${item.cidade}_${item.bairro}`;
            
            if (item.ativo) {
                updates[`atendimento/${chave}`] = {
                    cidade: item.cidade,
                    bairro: item.bairro,
                    ativo: true,
                    frete: item.frete * 100  // ← CONVERTE REAIS PARA CENTAVOS
                };
            } else {
                updates[`atendimento/${chave}`] = null;
            }
        });
        
        await dbRef.update(updates);
        
        atendimentoCache = { ...atendimentoCache, ...bairrosAlterados };
        bairrosAlterados = {};
        
        return true;
    } catch (error) {
        console.error('Erro ao salvar bairros:', error);
        alert('Erro ao salvar. Tente novamente.');
        return false;
    }
}

// ===== RENDERIZAR LISTA DE BAIRROS =====
function renderizarBairrosPainel(container, bairros, atendimento, cidadeKey) {
    if (Object.keys(bairros).length === 0) {
        container.innerHTML = `
            <div style="text-align:center; padding:40px; color:#888;">
                <i class="fa-solid fa-map-location-dot" style="font-size:3rem; opacity:0.3; display:block; margin-bottom:15px;"></i>
                <p>Nenhum bairro cadastrado nesta cidade</p>
            </div>`;
        return;
    }
    
    let html = `
        <!-- EDIÇÃO EM MASSA -->
        <div style="background: rgba(128,0,32,0.08); border: 1px solid rgba(128,0,32,0.3); border-radius: 12px; padding: 18px; margin-bottom: 20px;">
            <h3 style="color:#800020; margin:0 0 15px 0; font-size:1rem;">
                <i class="fa-solid fa-bolt"></i> Edição em Massa
            </h3>
            
            <div style="display: flex; gap: 10px; margin-bottom: 15px;">
                <button onclick="marcarTodosBairrosPainel('${cidadeKey}')" 
                        style="flex:1; background:#2e7d32; border:none; padding:10px; border-radius:8px; color:#fff; font-weight:600; cursor:pointer; font-size:0.85rem;">
                    <i class="fa-solid fa-check-double"></i> Marcar Todos
                </button>
                <button onclick="desmarcarTodosBairrosPainel('${cidadeKey}')" 
                        style="flex:1; background:#c62828; border:none; padding:10px; border-radius:8px; color:#fff; font-weight:600; cursor:pointer; font-size:0.85rem;">
                    <i class="fa-solid fa-xmark"></i> Desmarcar Todos
                </button>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                <div>
                    <label style="color:#4CAF50; font-weight:600; display:block; margin-bottom:6px; font-size:0.8rem;">
                        <i class="fa-solid fa-circle-check"></i> MARCADOS
                    </label>
                    <div style="display:flex; align-items:center; gap:5px;">
                        <span style="color:#FFC107; font-weight:600;">R$</span>
                        <input type="number" id="freteMarcados" step="0.01" min="0" placeholder="0,00"
                               style="flex:1; padding:10px; background:rgba(255,255,255,0.06); border:1px solid #4CAF50; border-radius:8px; color:#fff; font-size:0.9rem;"
                               onchange="aplicarFreteMarcadosPainel('${cidadeKey}', this.value)">
                    </div>
                </div>
                
                <div>
                    <label style="color:#ef5350; font-weight:600; display:block; margin-bottom:6px; font-size:0.8rem;">
                        <i class="fa-solid fa-circle"></i> DESMARCADOS
                    </label>
                    <div style="display:flex; align-items:center; gap:5px;">
                        <span style="color:#FFC107; font-weight:600;">R$</span>
                        <input type="number" id="freteDesmarcados" step="0.01" min="0" placeholder="0,00"
                               style="flex:1; padding:10px; background:rgba(255,255,255,0.06); border:1px solid #ef5350; border-radius:8px; color:#fff; font-size:0.9rem;"
                               onchange="aplicarFreteDesmarcadosPainel('${cidadeKey}', this.value)">
                    </div>
                </div>
            </div>
        </div>
        
        <!-- LISTA DE BAIRROS -->
        <h3 style="color:#800020; margin:20px 0 15px; font-size:1rem;">
            <i class="fa-solid fa-list-ul"></i> Bairros (${Object.keys(bairros).length})
        </h3>
    `;
    
    // Ordena bairros por nome
    const bairrosOrdenados = Object.entries(bairros).sort((a, b) => 
        (a[1].nome || '').localeCompare(b[1].nome || '')
    );
    
    bairrosOrdenados.forEach(([key, bairro]) => {
        const chave = `${cidadeKey}_${key}`;
        const config = atendimento[chave] || { ativo: false, frete: 0 };
        const ativo = config.ativo;
        const frete = config.frete || '';
        
        html += `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 12px; 
                        background: rgba(255,255,255,0.03); border: 1px solid rgba(128,0,32,0.25); border-radius: 10px; 
                        margin-bottom: 6px; transition: all 0.2s;"
                 onmouseover="this.style.borderColor='#800020'; this.style.background='rgba(128,0,32,0.08)'"
                 onmouseout="this.style.borderColor='rgba(128,0,32,0.25)'; this.style.background='rgba(255,255,255,0.03)'">
                
                <!-- Lado esquerdo: checkbox + ícone + nome + status -->
                <div style="display:flex; align-items:center; gap:10px; flex:1; min-width:0;">
                    <input type="checkbox" 
                           id="chk_${cidadeKey}_${key}" 
                           ${ativo ? 'checked' : ''} 
                           onchange="toggleBairroPainel('${cidadeKey}', '${key}', this.checked)" 
                           style="width:18px; height:18px; accent-color:#800020; cursor:pointer; flex-shrink:0;">
                    
                    <i class="fa-solid fa-location-dot" style="color:#800020; font-size:0.85rem; flex-shrink:0;"></i>
                    
                    <span style="color:#fff; font-weight:500; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                        ${bairro.nome}
                    </span>
                    
                    <span style="font-size:0.7rem; flex-shrink:0; 
                                 color:${ativo ? '#4CAF50' : '#888'}; 
                                 background:${ativo ? 'rgba(76,175,80,0.15)' : 'rgba(255,255,255,0.05)'}; 
                                 padding:2px 8px; border-radius:10px;">
                        <i class="fa-solid fa-${ativo ? 'circle-check' : 'circle'}"></i>
                        ${ativo ? 'Ativo' : 'Inativo'}
                    </span>
                </div>
                
                <!-- Lado direito: frete -->
                <div style="display:flex; align-items:center; gap:8px; flex-shrink:0; margin-left:10px;">
                    <i class="fa-solid fa-truck" style="color:#FFC107; font-size:0.8rem;"></i>
                    <span style="color:#FFC107; font-weight:600; font-size:0.8rem;">R$</span>
                    <input type="number" 
                           id="frete_${cidadeKey}_${key}" 
                           value="${frete}" 
                           step="0.01" 
                           min="0" 
                           placeholder="0,00" 
                           style="width:80px; padding:6px 8px; background:rgba(255,255,255,0.06); 
                                  border:1px solid ${ativo ? '#800020' : '#444'}; border-radius:8px; 
                                  color:${ativo ? '#fff' : '#666'}; text-align:right; font-size:0.85rem;"
                           ${!ativo ? 'disabled' : ''}
                           onchange="alterarFretePainel('${cidadeKey}', '${key}', this.value)">
                </div>
            </div>
        `;
    });
    
    // Botão salvar
    html += `
        <button onclick="confirmarSalvarBairros('${cidadeKey}')" 
                style="width:100%; margin-top:20px; background:#800020; border:none; padding:14px; border-radius:10px; 
                       color:#fff; font-weight:600; cursor:pointer; font-size:0.95rem; transition:all 0.3s;"
                onmouseover="this.style.background='#a00028'; this.style.transform='translateY(-2px)'"
                onmouseout="this.style.background='#800020'; this.style.transform='translateY(0)'">
            <i class="fa-solid fa-floppy-disk"></i> SALVAR ALTERAÇÕES
        </button>
    `;
    
    container.innerHTML = html;
}

// ===== CONFIRMAR SALVAMENTO =====
async function confirmarSalvarBairros(cidadeKey) {
    const alteracoes = Object.values(bairrosAlterados);
    if (alteracoes.length === 0) {
        alert('Nenhuma alteração para salvar.');
        return;
    }
    
    const count = alteracoes.length;
    if (confirm(`${count} bairro(s) alterado(s). Deseja salvar?`)) {
        const sucesso = await salvarBairrosPainel(cidadeKey);
        if (sucesso) {
            alert('✅ Bairros salvos com sucesso!');
            // Recarrega o modal para refletir alterações
            abrirModalBairros();
        }
    }
}

window.CONFIG_PAINEL = CONFIG_PAINEL;
window.formatarPrecoPainel = formatarPrecoPainel;
window.formatarDataHora = formatarDataHora;
window.formatarHora = formatarHora;
window.formatarData = formatarData;
window.formatarTempoPreparo = formatarTempoPreparo;
window.getStatusLabel = getStatusLabel;
window.getBadgeClass = getBadgeClass;
window.getStatusClass = getStatusClass;
window.carregarBairrosPainel = carregarBairrosPainel;
window.toggleBairroPainel = toggleBairroPainel;
window.alterarFretePainel = alterarFretePainel;
window.marcarTodosBairrosPainel = marcarTodosBairrosPainel;
window.desmarcarTodosBairrosPainel = desmarcarTodosBairrosPainel;
window.aplicarFreteMarcadosPainel = aplicarFreteMarcadosPainel;
window.aplicarFreteDesmarcadosPainel = aplicarFreteDesmarcadosPainel;
window.salvarBairrosPainel = salvarBairrosPainel;
window.renderizarBairrosPainel = renderizarBairrosPainel;
window.confirmarSalvarBairros = confirmarSalvarBairros;
window.getCidadeKey = getCidadeKey;

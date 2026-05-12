// ============================================
// ===== PAINEL PRINT - QZ TRAY v3.2 =========
// ============================================

let qzConectado = false;
let conectando = false;
let impressoraSelecionada = null;
let filaImpressao = [];
let imprimindoAgora = false;
let impressaoAutomatica = false;
let falhasConsecutivas = 0;
let heartbeatTimer = null;
let reconnectTimer = null;
let limpezaTimer = null;
const MAX_FALHAS = 10;
const MAX_TENTATIVAS = 5;
const MAX_CACHE = 5000;
const TIMEOUT_IMPRESSAO = 10000;

let pedidosImpressos;
let pedidosNaFila;

// ============================================
// ===== INICIALIZAÇÃO DOS CACHES ============
// ============================================

function inicializarCaches() {
    try {
        var salvo = localStorage.getItem('qz_pedidos_impressos');
        if (salvo) {
            var arr = JSON.parse(salvo);
            pedidosImpressos = new Map(arr);
            console.log('📦 Cache restaurado:', pedidosImpressos.size, 'pedidos');
        } else {
            pedidosImpressos = new Map();
        }
    } catch (e) {
        pedidosImpressos = new Map();
    }
    
    pedidosNaFila = new Set();
}

function salvarCacheImpressos() {
    try {
        if (pedidosImpressos.size > MAX_CACHE) {
            var arr = Array.from(pedidosImpressos.entries());
            arr.sort(function(a, b) { return b[1] - a[1]; });
            arr = arr.slice(0, MAX_CACHE);
            pedidosImpressos = new Map(arr);
        }
        
        var arr = Array.from(pedidosImpressos.entries());
        localStorage.setItem('qz_pedidos_impressos', JSON.stringify(arr));
    } catch (e) {}
}

// ============================================
// ===== LIMPEZA AUTOMÁTICA DO CACHE ==========
// ============================================

function iniciarLimpezaCache() {
    if (limpezaTimer) clearInterval(limpezaTimer);
    
    limpezaTimer = setInterval(function() {
        var agora = Date.now();
        var removidos = 0;
        
        pedidosImpressos.forEach(function(timestamp, id) {
            if (agora - timestamp > 86400000) {
                pedidosImpressos.delete(id);
                removidos++;
            }
        });
        
        if (removidos > 0) {
            console.log('🧹 Cache limpo:', removidos, 'registros removidos');
            salvarCacheImpressos();
        }
        
        if (pedidosImpressos.size > MAX_CACHE) {
            salvarCacheImpressos();
        }
    }, 3600000);
}

// ============================================
// ===== LOG DE IMPRESSÃO (SÓ ERROS) ==========
// ============================================

function logImpressao(pedidoId, status, erro) {
    erro = erro || null;
    
    var log = {
        pedidoId: pedidoId,
        status: status,
        horario: new Date().toISOString(),
        erro: erro ? erro.message : null
    };
    
    console.log('🖨️ LOG:', log);
    
    if (status === 'erro' && typeof dbRef !== 'undefined' && dbRef) {
        dbRef.child('logs_impressao').push(log).catch(function() {});
    }
}

// ============================================
// ===== CONFIGURAÇÃO QZ TRAY (SEGURANÇA) =====
// ============================================

function configurarSegurancaQZ() {
    if (typeof qz === 'undefined') {
        console.warn('⚠️ QZ Tray nao carregado');
        return;
    }
    
    qz.security.setCertificatePromise(function(resolve, reject) {
        resolve();
    });
    
    qz.security.setSignaturePromise(function(toSign) {
        return function(resolve, reject) {
            resolve();
        };
    });
    
    console.log('🔐 Seguranca QZ configurada');
}

// ============================================
// ===== LIMPAR TEXTO (REMOVE ACENTOS) ========
// ============================================

function limparTexto(texto) {
    if (!texto) return '';
    return String(texto)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
}

// ============================================
// ===== TOAST (SUBSTITUI ALERT) ==============
// ============================================

function mostrarToast(mensagem, tipo) {
    tipo = tipo || 'info';
    
    var existente = document.getElementById('qzToast');
    if (existente) existente.remove();
    
    var cores = {
        'sucesso': '#4CAF50',
        'erro': '#dc3545',
        'info': '#2196F3',
        'aviso': '#FFC107'
    };
    
    var toast = document.createElement('div');
    toast.id = 'qzToast';
    toast.style.cssText = 
        'position:fixed; bottom:30px; right:30px; z-index:99999;' +
        'background:' + (cores[tipo] || cores.info) + ';' +
        'color:#fff; padding:15px 25px; border-radius:12px;' +
        'font-weight:600; box-shadow:0 10px 30px rgba(0,0,0,0.5);' +
        'animation:slideIn 0.3s ease; max-width:400px;';
    
    toast.textContent = mensagem;
    document.body.appendChild(toast);
    
    setTimeout(function() {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s';
        setTimeout(function() { toast.remove(); }, 300);
    }, 4000);
}

// ============================================
// ===== CONECTAR AO QZ TRAY =================
// ============================================

async function conectarQZ() {
    if (conectando) {
        console.log('⏳ Conexao ja em andamento...');
        return qzConectado;
    }
    
    if (typeof qz === 'undefined') {
        atualizarStatusQZ('indisponivel', 'QZ Tray nao instalado');
        return false;
    }
    
    conectando = true;
    
    try {
        if (!qz.websocket.isActive()) {
            configurarSegurancaQZ();
            await qz.websocket.connect();
            console.log('✅ QZ Tray conectado');
            qzConectado = true;
            falhasConsecutivas = 0;
            
            var salva = localStorage.getItem('qz_impressora');
            if (salva) {
                impressoraSelecionada = salva;
            }
            
            atualizarStatusQZ('conectado', 'Conectado');
            iniciarHeartbeat();
            restaurarFilaSalva();
            conectando = false;
            return true;
        } else {
            qzConectado = true;
            falhasConsecutivas = 0;
            atualizarStatusQZ('conectado', 'Conectado');
            iniciarHeartbeat();
            conectando = false;
            return true;
        }
    } catch (err) {
        console.error('❌ Erro conectar QZ:', err);
        qzConectado = false;
        falhasConsecutivas++;
        atualizarStatusQZ('desconectado', 'Erro ao conectar');
        conectando = false;
        
        if (falhasConsecutivas >= MAX_FALHAS) {
            alertarOperador();
        }
        
        return false;
    }
}

// ============================================
// ===== RECONEXÃO AUTOMÁTICA =================
// ============================================

function iniciarReconexaoAutomatica() {
    if (reconnectTimer) clearInterval(reconnectTimer);
    
    reconnectTimer = setInterval(async function() {
        if (conectando) return;
        
        if (typeof qz !== 'undefined' && !qz.websocket.isActive()) {
            console.log('🔄 Tentando reconectar QZ...');
            atualizarStatusQZ('desconectado', 'Reconectando...');
            
            conectando = true;
            configurarSegurancaQZ();
            
            try {
                await qz.websocket.connect();
                qzConectado = true;
                falhasConsecutivas = 0;
                console.log('✅ QZ reconectado');
                atualizarStatusQZ('conectado', 'Conectado');
                conectando = false;
                
                if (filaImpressao.length > 0) {
                    console.log('📋 Processando fila acumulada:', filaImpressao.length, 'pedidos');
                    processarFila();
                }
            } catch (e) {
                falhasConsecutivas++;
                conectando = false;
                console.log('🔄 QZ offline, tentativa:', falhasConsecutivas);
                
                if (falhasConsecutivas >= MAX_FALHAS) {
                    alertarOperador();
                }
            }
        }
    }, 5000);
}

// ============================================
// ===== ALERTAR OPERADOR =====================
// ============================================

function alertarOperador() {
    console.error('🚨 ALERTA: QZ Tray offline apos', MAX_FALHAS, 'tentativas');
    mostrarToast('⚠️ Impressora offline! Verifique o QZ Tray.', 'erro');
    
    try {
        qz.websocket.disconnect();
        setTimeout(function() {
            qz.websocket.connect().catch(function() {});
        }, 2000);
    } catch (e) {}
}

// ============================================
// ===== HEARTBEAT MELHORADO ==================
// ============================================

function iniciarHeartbeat() {
    if (heartbeatTimer) clearInterval(heartbeatTimer);
    
    heartbeatTimer = setInterval(async function() {
        if (typeof qz === 'undefined') return;
        
        try {
            if (qz.websocket.isActive()) {
                await qz.printers.find();
                console.log('💓 QZ Heartbeat OK');
                falhasConsecutivas = 0;
            } else {
                console.log('💔 QZ Heartbeat FALHOU');
                qzConectado = false;
                atualizarStatusQZ('desconectado', 'Offline');
            }
        } catch (e) {
            console.log('💔 QZ Heartbeat erro');
            qzConectado = false;
            falhasConsecutivas++;
            atualizarStatusQZ('desconectado', 'Offline');
        }
    }, 120000); // 2 minutos (reduzido spam)
}

// ============================================
// ===== ATUALIZAR STATUS NA TELA =============
// ============================================

function atualizarStatusQZ(status, mensagem) {
    var el = document.getElementById('qzStatus');
    if (!el) return;
    
    var cores = {
        'conectado': '#4CAF50',
        'desconectado': '#FFC107',
        'indisponivel': '#dc3545',
        'imprimindo': '#2196F3'
    };
    
    el.innerHTML = '<span style="color:' + (cores[status] || '#888') + '">●</span> ' + mensagem;
}

// ============================================
// ===== LISTAR IMPRESSORAS ===================
// ============================================

async function listarImpressoras() {
    if (!qzConectado) {
        var conectou = await conectarQZ();
        if (!conectou) return [];
    }
    
    try {
        var printers = await qz.printers.find();
        console.log('🖨️ Impressoras encontradas:', printers);
        return printers;
    } catch (err) {
        console.error('❌ Erro listar impressoras:', err);
        return [];
    }
}

// ============================================
// ===== VERIFICAR IMPRESSORA ONLINE ==========
// ============================================

async function verificarImpressoraOnline() {
    try {
        var impressoras = await qz.printers.find();
        if (!impressoras.includes(impressoraSelecionada)) {
            throw new Error('Impressora offline: ' + impressoraSelecionada);
        }
        return true;
    } catch (e) {
        throw new Error('Impressora nao encontrada');
    }
}

// ============================================
// ===== MODAL IMPRESSORA =====================
// ============================================

async function abrirModalImpressora() {
    var existente = document.getElementById('modalImpressora');
    if (existente) existente.remove();

    var overlay = document.createElement('div');
    overlay.className = 'modal-overlay active';
    overlay.id = 'modalImpressora';
    overlay.onclick = function(e) { if (e.target === overlay) fecharModalImpressora(); };

    overlay.innerHTML = 
        '<div class="modal-content" style="max-width: 550px;" onclick="event.stopPropagation()">' +
            '<h2>🖨️ Configuracao da Impressora</h2>' +
            
            '<div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 15px; margin: 15px 0;">' +
                '<strong>Status:</strong> <span id="qzStatus">🔍 Verificando...</span>' +
            '</div>' +
            
            '<div style="margin: 15px 0;">' +
                '<label style="display:block; color:#aaa; font-size:0.85rem; margin-bottom:8px;">Impressora:</label>' +
                '<select id="qzListaImpressoras" style="width:100%; padding:12px; background:rgba(255,255,255,0.08); border:2px solid #444; border-radius:10px; color:#fff; font-size:0.95rem;">' +
                    '<option value="">Carregando...</option>' +
                '</select>' +
                '<button onclick="atualizarListaImpressoras()" style="margin-top:8px; background:rgba(255,255,255,0.05); border:1px solid #555; padding:8px 15px; border-radius:8px; color:#fff; cursor:pointer; font-size:0.8rem;">' +
                    '<i class="fas fa-sync-alt"></i> Atualizar Lista' +
                '</button>' +
            '</div>' +
            
            '<div style="display:flex; gap:10px; margin-top:20px;">' +
                '<button onclick="testarImpressao()" style="flex:1; background:#FF9800; border:none; padding:14px; border-radius:10px; color:#fff; font-weight:600; cursor:pointer;">' +
                    '<i class="fas fa-print"></i> TESTAR IMPRESSAO' +
                '</button>' +
                '<button onclick="salvarConfigImpressora()" style="flex:1; background:#4CAF50; border:none; padding:14px; border-radius:10px; color:#fff; font-weight:600; cursor:pointer;">' +
                    '<i class="fas fa-save"></i> SALVAR' +
                '</button>' +
            '</div>' +
            
            '<button class="btn-fechar-modal" onclick="fecharModalImpressora()" style="margin-top:10px;">FECHAR</button>' +
        '</div>';

    document.body.appendChild(overlay);
    
    await conectarQZ();
    await atualizarListaImpressoras();
}

function fecharModalImpressora() {
    var modal = document.getElementById('modalImpressora');
    if (modal) modal.remove();
}

// ============================================
// ===== ATUALIZAR LISTA DE IMPRESSORAS =======
// ============================================

async function atualizarListaImpressoras() {
    var select = document.getElementById('qzListaImpressoras');
    if (!select) return;
    
    select.innerHTML = '<option value="">🔍 Buscando...</option>';
    
    var impressoras = await listarImpressoras();
    
    if (impressoras.length === 0) {
        select.innerHTML = '<option value="">⚠️ Nenhuma impressora encontrada</option>';
        return;
    }
    
    select.innerHTML = '';
    impressoras.forEach(function(imp) {
        var option = document.createElement('option');
        option.value = imp;
        option.textContent = imp;
        if (imp === impressoraSelecionada) option.selected = true;
        select.appendChild(option);
    });
}

// ============================================
// ===== SALVAR CONFIGURAÇÃO ==================
// ============================================

function salvarConfigImpressora() {
    var select = document.getElementById('qzListaImpressoras');
    if (!select || !select.value) {
        mostrarToast('Selecione uma impressora primeiro', 'aviso');
        return;
    }
    
    impressoraSelecionada = select.value;
    localStorage.setItem('qz_impressora', impressoraSelecionada);
    mostrarToast('✅ Impressora salva: ' + impressoraSelecionada, 'sucesso');
}

// ============================================
// ===== IMPRESSÃO RAW ESC/POS ================
// ============================================

async function imprimirPedidoQZ(pedido) {
    if (pedidosImpressos.has(pedido.id)) {
        console.log('⚠️ Pedido ja impresso, ignorando:', pedido.id);
        return true;
    }
    
    if (!qzConectado) {
        var conectou = await conectarQZ();
        if (!conectou) {
            console.warn('⚠️ QZ Tray offline. Pedido na fila.');
            return false;
        }
    }
    
    if (!impressoraSelecionada) {
        console.warn('⚠️ Nenhuma impressora selecionada');
        return false;
    }
    
    try {
        await verificarImpressoraOnline();
    } catch (e) {
        console.warn('⚠️ Impressora offline:', e.message);
        return false;
    }
    
    logImpressao(pedido.id || pedido.numero, 'iniciado');
    
    try {
        atualizarStatusQZ('imprimindo', 'Imprimindo...');
        
        var config = qz.configs.create(impressoraSelecionada, {
            encoding: 'CP860',
            copies: 1
        });
        
        var data = gerarComandosESCPOS(pedido);
        
        await Promise.race([
            qz.print(config, data),
            new Promise(function(_, reject) {
                setTimeout(function() { reject(new Error('Timeout impressao')); }, TIMEOUT_IMPRESSAO);
            })
        ]);
        
        pedidosImpressos.set(pedido.id, Date.now());
        pedidosNaFila.delete(pedido.id);
        salvarCacheImpressos();
        console.log('✅ Pedido impresso:', pedido.numero || pedido.id);
        atualizarStatusQZ('conectado', 'Conectado');
        logImpressao(pedido.id || pedido.numero, 'concluido');
        return true;
        
    } catch (err) {
        console.error('❌ Erro ao imprimir:', err);
        atualizarStatusQZ('desconectado', 'Erro: ' + err.message);
        logImpressao(pedido.id || pedido.numero, 'erro', err);
        
        try {
            await qz.websocket.disconnect();
            await qz.websocket.connect();
        } catch (e2) {}
        
        return false;
    }
}

// ============================================
// ===== GERAR COMANDOS ESC/POS ===============
// ============================================

function gerarComandosESCPOS(pedido) {
    var p = pedido;
    var linhas = [];
    
    linhas.push('\x1B\x40');
    
    linhas.push('\x1D\x21\x11');
    linhas.push('\x1B\x61\x01');
    linhas.push(limparTexto(CONFIG_PAINEL.nomeRestaurante.toUpperCase()) + '\n');
    linhas.push('PEDIDO #' + (p.numero || p.id) + '\n');
    linhas.push('------------------------------\n');
    
    linhas.push('\x1D\x21\x00');
    linhas.push('\x1B\x61\x00');
    linhas.push('Cliente: ' + limparTexto(p.cliente?.nome || '---') + '\n');
    linhas.push('Data: ' + formatarDataHora(p.criadoEm) + '\n');
    
    if (p.tipoEntrega === 'entrega' && p.endereco) {
        linhas.push('End: ' + limparTexto(p.endereco.rua || '') + ', ' + (p.endereco.numero || '') + '\n');
        linhas.push('Bairro: ' + limparTexto(p.endereco.bairro || '') + '\n');
    } else {
        linhas.push('RETIRADA NO LOCAL\n');
    }
    
    linhas.push('------------------------------\n');
    
    if (p.itens && p.itens.length > 0) {
        p.itens.forEach(function(item) {
            var nome = item.snapshot?.nome || item.nome || 'Item';
            var qtd = item.quantidade || 1;
            linhas.push(qtd + 'x ' + limparTexto(nome) + '\n');
        });
    }
    
    linhas.push('------------------------------\n');
    
    linhas.push('\x1B\x45\x01');
    linhas.push('TOTAL: ' + formatarPrecoPainel(p.total) + '\n');
    linhas.push('\x1B\x45\x00');
    
    if (p.pagamento?.tipo) {
        linhas.push('Pagamento: ' + limparTexto(p.pagamento.tipo) + '\n');
    }
    
    linhas.push('\n');
    linhas.push('Obrigado pela preferencia!\n');
    linhas.push('\n\n');
    
    linhas.push('\x1D\x56\x00');
    
    return linhas;
}

// ============================================
// ===== TESTAR IMPRESSÃO =====================
// ============================================

async function testarImpressao() {
    var select = document.getElementById('qzListaImpressoras');
    if (select && select.value) {
        impressoraSelecionada = select.value;
        localStorage.setItem('qz_impressora', impressoraSelecionada);
    }
    
    if (!impressoraSelecionada) {
        mostrarToast('⚠️ Selecione uma impressora primeiro', 'aviso');
        return;
    }
    
    var conectou = await conectarQZ();
    if (!conectou) {
        mostrarToast('❌ QZ Tray nao esta rodando', 'erro');
        return;
    }
    
    var pedidoTeste = {
        id: 'TESTE_' + Date.now(),
        numero: 9999,
        cliente: { nome: 'CLIENTE TESTE' },
        criadoEm: Date.now(),
        tipoEntrega: 'entrega',
        endereco: { rua: 'Rua do Teste', numero: '123', bairro: 'Centro' },
        itens: [
            { quantidade: 1, snapshot: { nome: 'X-Burguer Teste' } },
            { quantidade: 2, snapshot: { nome: 'Coca-Cola Lata' } }
        ],
        total: 3990,
        pagamento: { tipo: 'Dinheiro' }
    };
    
    var ok = await imprimirPedidoQZ(pedidoTeste);
    
    if (ok) {
        mostrarToast('✅ Impressao de teste enviada!', 'sucesso');
    } else {
        mostrarToast('❌ Falha na impressao. Verifique o console (F12).', 'erro');
    }
}

// ============================================
// ===== FILA DE IMPRESSÃO ====================
// ============================================

function adicionarFila(pedido) {
    if (pedidosImpressos.has(pedido.id)) {
        console.log('⚠️ Pedido ja impresso:', pedido.id);
        return;
    }
    
    if (pedidosNaFila.has(pedido.id)) {
        console.log('⚠️ Pedido ja na fila:', pedido.id);
        return;
    }
    
    // Inicializa tentativas
    pedido._tentativas = 0;
    
    pedidosNaFila.add(pedido.id);
    filaImpressao.push(pedido);
    
    salvarFila();
    
    console.log('📋 Pedido na fila:', pedido.numero || pedido.id, '| Fila:', filaImpressao.length);
    processarFila();
}

async function processarFila() {
    if (imprimindoAgora) return;
    if (filaImpressao.length === 0) return;
    
    imprimindoAgora = true;
    
    var pedido = filaImpressao.shift();
    salvarFila();
    
    var ok = await imprimirPedidoQZ(pedido);
    
    if (!ok) {
        // Incrementa tentativas
        pedido._tentativas = (pedido._tentativas || 0) + 1;
        console.log('🔁 Tentativa:', pedido._tentativas, '/', MAX_TENTATIVAS);
        
        if (pedido._tentativas < MAX_TENTATIVAS) {
            // Recoloca no INÍCIO da fila para reimprimir
            filaImpressao.unshift(pedido);
            salvarFila();
            console.log('🔁 Pedido recolocado na fila para retry');
        } else {
            // Desiste após máximo de tentativas
            pedidosNaFila.delete(pedido.id);
            console.error('❌ Pedido ABANDONADO apos', MAX_TENTATIVAS, 'tentativas:', pedido.id);
            logImpressao(pedido.id || pedido.numero, 'abandonado', new Error('Max tentativas: ' + MAX_TENTATIVAS));
            mostrarToast('⚠️ Falha ao imprimir pedido #' + (pedido.numero || pedido.id), 'erro');
        }
    }
    // Se ok = true, pedido já foi removido do pedidosNaFila dentro de imprimirPedidoQZ
    
    imprimindoAgora = false;
    
    if (filaImpressao.length > 0) {
        setTimeout(function() { processarFila(); }, 500);
    }
}

// ============================================
// ===== SALVAR / RESTAURAR FILA ==============
// ============================================

function salvarFila() {
    try {
        var filaParaSalvar = filaImpressao.map(function(p) {
            return {
                id: p.id,
                numero: p.numero,
                cliente: { nome: p.cliente?.nome },
                criadoEm: p.criadoEm,
                tipoEntrega: p.tipoEntrega,
                endereco: p.endereco,
                itens: p.itens,
                total: p.total,
                pagamento: p.pagamento,
                _tentativas: p._tentativas || 0
            };
        });
        localStorage.setItem('qz_fila_impressao', JSON.stringify(filaParaSalvar));
    } catch (e) {}
}

function restaurarFilaSalva() {
    try {
        var salva = localStorage.getItem('qz_fila_impressao');
        if (salva) {
            var filaSalva = JSON.parse(salva);
            if (filaSalva.length > 0) {
                console.log('📋 Restaurando fila salva:', filaSalva.length, 'pedidos');
                filaSalva.forEach(function(p) {
                    if (!pedidosNaFila.has(p.id) && !pedidosImpressos.has(p.id)) {
                        pedidosNaFila.add(p.id);
                        filaImpressao.push(p);
                    }
                });
                processarFila();
            }
        }
    } catch (e) {}
}

// ============================================
// ===== ESCUTAR PEDIDOS NOVOS ================
// ============================================

function aoReceberNovoPedido(pedido) {
    if (typeof tocarSomNovoPedido === 'function') {
        tocarSomNovoPedido();
    }
    
    if (impressaoAutomatica) {
        adicionarFila(pedido);
    } else {
        console.log('🔇 Impressao automatica DESATIVADA. Pedido:', pedido.numero);
    }
}

// ============================================
// ===== ATIVAR IMPRESSÃO AUTOMÁTICA ==========
// ============================================

function ativarImpressaoAutomatica() {
    impressaoAutomatica = true;
    console.log('✅ Impressao automatica ATIVADA');
    localStorage.setItem('qz_impressao_automatica', 'true');
    mostrarToast('✅ Impressao automatica ATIVADA', 'sucesso');
}

// ============================================
// ===== INICIALIZAÇÃO =========================
// ============================================

(function iniciarPrintModule() {
    inicializarCaches();
    iniciarLimpezaCache();
    iniciarReconexaoAutomatica();
    
    conectarQZ().then(function(ok) {
        if (ok) console.log('✅ QZ Tray pronto');
    });
})();

// ============================================
// ===== EXPOR FUNÇÕES ========================
// ============================================

window.abrirModalImpressora = abrirModalImpressora;
window.fecharModalImpressora = fecharModalImpressora;
window.testarImpressao = testarImpressao;
window.atualizarListaImpressoras = atualizarListaImpressoras;
window.salvarConfigImpressora = salvarConfigImpressora;
window.imprimirPedidoQZ = imprimirPedidoQZ;
window.conectarQZ = conectarQZ;
window.aoReceberNovoPedido = aoReceberNovoPedido;
window.ativarImpressaoAutomatica = ativarImpressaoAutomatica;
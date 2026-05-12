// ============================================
// ===== PAINEL PRINT - QZ TRAY v4.1 =========
// ============================================

if (window.PAINEL_PRINT_QZ_CARREGADO) {
    console.warn('QZ Print ja carregado');
} else {

window.PAINEL_PRINT_QZ_CARREGADO = true;

let qzConectado = false;
let conectando = false;
let impressoraSelecionada = null;
let filaImpressao = [];
let imprimindoAgora = false;
let impressaoAutomatica = true;
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

function inicializarCaches() {
    try {
        var salvo = localStorage.getItem('qz_pedidos_impressos');
        if (salvo) {
            var arr = JSON.parse(salvo);
            pedidosImpressos = new Map(arr);
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

function iniciarLimpezaCache() {
    if (limpezaTimer) clearInterval(limpezaTimer);
    limpezaTimer = setInterval(function() {
        var agora = Date.now();
        var removidos = 0;
        pedidosImpressos.forEach(function(timestamp, id) {
            if (agora - timestamp > 86400000) {
                pedidosImpressos.delete(id);
                pedidosNaFila.delete(id);
                removidos++;
            }
        });
        if (removidos > 0) {
            console.log('Cache limpo:', removidos);
            salvarCacheImpressos();
        }
        if (pedidosImpressos.size > MAX_CACHE) {
            salvarCacheImpressos();
        }
    }, 3600000);
}

function logImpressao(pedidoId, status, erro) {
    erro = erro || null;
    var log = {
        pedidoId: pedidoId,
        status: status,
        horario: new Date().toISOString(),
        erro: erro ? erro.message : null
    };
    console.log('LOG:', log);
    if (status === 'erro' && typeof dbRef !== 'undefined' && dbRef) {
        dbRef.child('logs_impressao').push(log).catch(function() {});
    }
}


function configurarSegurancaQZ() {
    if (typeof qz === 'undefined') return;

    // Certificado público
    qz.security.setCertificatePromise(function(resolve, reject) {
        fetch('./certificate.txt')
            .then(function(response) { return response.text(); })
            .then(resolve)
            .catch(reject);
    });

    // SHA512
    qz.security.setSignatureAlgorithm("SHA512");

    // ASSINATURA REAL (backend no Vercel)
    qz.security.setSignaturePromise(function(toSign) {
        return function(resolve, reject) {
            fetch('https://backend-woad-nine-25.vercel.app/sign-message', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ request: toSign })
            })
            .then(function(response) { return response.text(); })
            .then(resolve)
            .catch(reject);
        };
    });
}

function limparTexto(texto) {
    if (!texto) return '';
    return String(texto).normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

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
    toast.style.cssText = 'position:fixed;bottom:30px;right:30px;z-index:99999;background:' + (cores[tipo] || cores.info) + ';color:#fff;padding:15px 25px;border-radius:12px;font-weight:600;box-shadow:0 10px 30px rgba(0,0,0,0.5);max-width:400px;';
    toast.textContent = mensagem;
    document.body.appendChild(toast);
    setTimeout(function() {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s';
        setTimeout(function() { toast.remove(); }, 300);
    }, 4000);
}

async function conectarQZ() {
    if (conectando) return qzConectado;
    if (typeof qz === 'undefined') {
        atualizarStatusQZ('indisponivel', 'QZ Tray nao instalado');
        return false;
    }
    conectando = true;
    try {
        if (!qz.websocket.isActive()) {
            configurarSegurancaQZ();
            await qz.websocket.connect();
        }
        qzConectado = true;
        falhasConsecutivas = 0;
        var salva = localStorage.getItem('qz_impressora');
        if (salva) impressoraSelecionada = salva;
        atualizarStatusQZ('conectado', 'Conectado');
        iniciarHeartbeat();
        restaurarFilaSalva();
        conectando = false;
        return true;
    } catch (err) {
        qzConectado = false;
        falhasConsecutivas++;
        atualizarStatusQZ('desconectado', 'Erro');
        conectando = false;
        if (falhasConsecutivas >= MAX_FALHAS) alertarOperador();
        return false;
    }
}

function iniciarReconexaoAutomatica() {
    if (reconnectTimer) clearInterval(reconnectTimer);
    reconnectTimer = setInterval(async function() {
        if (conectando) return;
        if (typeof qz !== 'undefined' && !qz.websocket.isActive()) {
            conectando = true;
            configurarSegurancaQZ();
            try {
                if (!qz.websocket.isActive()) {
                    await qz.websocket.connect();
                }
                qzConectado = true;
                falhasConsecutivas = 0;
                atualizarStatusQZ('conectado', 'Conectado');
                iniciarHeartbeat();
                conectando = false;
                if (filaImpressao.length > 0) processarFila();
            } catch (e) {
                falhasConsecutivas++;
                conectando = false;
                if (falhasConsecutivas >= MAX_FALHAS) alertarOperador();
            }
        }
    }, 5000);
}

function alertarOperador() {
    console.error('ALERTA: QZ Tray offline');
    mostrarToast('Impressora offline! Verifique o QZ Tray.', 'erro');
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
    qzConectado = false;
}

function iniciarHeartbeat() {
    if (heartbeatTimer) return;
    heartbeatTimer = setInterval(function() {
        if (typeof qz === 'undefined') return;
        if (qz.websocket.isActive()) {
            falhasConsecutivas = 0;
        } else {
            qzConectado = false;
            clearInterval(heartbeatTimer);
            heartbeatTimer = null;
            atualizarStatusQZ('desconectado', 'Offline');
        }
    }, 120000);
}

function atualizarStatusQZ(status, mensagem) {
    var el = document.getElementById('qzStatus');
    if (!el) return;
    var cores = { 'conectado': '#4CAF50', 'desconectado': '#FFC107', 'indisponivel': '#dc3545', 'imprimindo': '#2196F3' };
    el.innerHTML = '<span style="color:' + (cores[status] || '#888') + '">●</span> ' + mensagem;
}

async function listarImpressoras() {
    if (!qzConectado) { var c = await conectarQZ(); if (!c) return []; }
    try { return await qz.printers.find(); } catch (e) { return []; }
}

async function verificarImpressoraOnline() {
    var impressoras = await qz.printers.find();
    if (!impressoras.includes(impressoraSelecionada)) throw new Error('Impressora offline');
    return true;
}

async function abrirModalImpressora() {
    var existente = document.getElementById('modalImpressora');
    if (existente) existente.remove();
    var overlay = document.createElement('div');
    overlay.className = 'modal-overlay active';
    overlay.id = 'modalImpressora';
    overlay.onclick = function(e) { if (e.target === overlay) fecharModalImpressora(); };
    overlay.innerHTML = '<div class="modal-content" style="max-width:550px;" onclick="event.stopPropagation()"><h2>🖨️ Configuracao da Impressora</h2><div style="background:rgba(255,255,255,0.05);border-radius:12px;padding:15px;margin:15px 0;"><strong>Status:</strong> <span id="qzStatus">Verificando...</span></div><div style="margin:15px 0;"><label style="display:block;color:#aaa;font-size:0.85rem;margin-bottom:8px;">Impressora:</label><select id="qzListaImpressoras" style="width:100%;padding:12px;background:rgba(255,255,255,0.08);border:2px solid #444;border-radius:10px;color:#fff;"><option value="">Carregando...</option></select><button onclick="atualizarListaImpressoras()" style="margin-top:8px;background:rgba(255,255,255,0.05);border:1px solid #555;padding:8px 15px;border-radius:8px;color:#fff;cursor:pointer;"><i class="fas fa-sync-alt"></i> Atualizar</button></div><div style="display:flex;gap:10px;margin-top:20px;"><button onclick="testarImpressao()" style="flex:1;background:#FF9800;border:none;padding:14px;border-radius:10px;color:#fff;font-weight:600;cursor:pointer;"><i class="fas fa-print"></i> TESTAR</button><button onclick="salvarConfigImpressora()" style="flex:1;background:#4CAF50;border:none;padding:14px;border-radius:10px;color:#fff;font-weight:600;cursor:pointer;"><i class="fas fa-save"></i> SALVAR</button></div><button class="btn-fechar-modal" onclick="fecharModalImpressora()" style="margin-top:10px;">FECHAR</button></div>';
    document.body.appendChild(overlay);
    await conectarQZ();
    await atualizarListaImpressoras();
}

function fecharModalImpressora() {
    var modal = document.getElementById('modalImpressora');
    if (modal) modal.remove();
}

async function atualizarListaImpressoras() {
    var select = document.getElementById('qzListaImpressoras');
    if (!select) return;
    select.innerHTML = '<option value="">Buscando...</option>';
    var impressoras = await listarImpressoras();
    if (impressoras.length === 0) { select.innerHTML = '<option value="">Nenhuma encontrada</option>'; return; }
    select.innerHTML = '';
    impressoras.forEach(function(imp) {
        var opt = document.createElement('option');
        opt.value = imp;
        opt.textContent = imp;
        if (imp === impressoraSelecionada) opt.selected = true;
        select.appendChild(opt);
    });
}

function salvarConfigImpressora() {
    var select = document.getElementById('qzListaImpressoras');
    if (!select || !select.value) { mostrarToast('Selecione uma impressora', 'aviso'); return; }
    impressoraSelecionada = select.value;
    localStorage.setItem('qz_impressora', impressoraSelecionada);
    mostrarToast('Impressora salva: ' + impressoraSelecionada, 'sucesso');
}

async function imprimirPedidoQZ(pedido) {
    if (!pedido || !pedido.id) return false;
    if (pedidosImpressos.has(pedido.id)) return true;
    if (!qzConectado) { var c = await conectarQZ(); if (!c) return false; }
    if (!impressoraSelecionada) return false;
    try { await verificarImpressoraOnline(); } catch (e) { return false; }
    logImpressao(pedido.id || pedido.numero, 'iniciado');
    try {
        atualizarStatusQZ('imprimindo', 'Imprimindo...');
        var config = qz.configs.create(impressoraSelecionada, { encoding: 'CP1252', copies: 1 });
        var data = gerarComandosESCPOS(pedido);
        await Promise.race([
            qz.print(config, data),
            new Promise(function(_, reject) { setTimeout(function() { reject(new Error('Timeout')); }, TIMEOUT_IMPRESSAO); })
        ]);
        pedidosImpressos.set(pedido.id, Date.now());
        pedidosNaFila.delete(pedido.id);
        salvarCacheImpressos();
        atualizarStatusQZ('conectado', 'Conectado');
        logImpressao(pedido.id || pedido.numero, 'concluido');
        return true;
    } catch (err) {
        qzConectado = false;
        atualizarStatusQZ('desconectado', 'Erro');
        logImpressao(pedido.id || pedido.numero, 'erro', err);
        return false;
    }
}

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
            linhas.push((item.quantidade || 1) + 'x ' + limparTexto(item.snapshot?.nome || item.nome || 'Item') + '\n');
        });
    }
    linhas.push('------------------------------\n');
    linhas.push('\x1B\x45\x01');
    linhas.push('TOTAL: ' + formatarPrecoPainel(p.total) + '\n');
    linhas.push('\x1B\x45\x00');
    if (p.pagamento?.tipo) linhas.push('Pagamento: ' + limparTexto(p.pagamento.tipo) + '\n');
    linhas.push('\nObrigado pela preferencia!\n\n\n');
    linhas.push('\x1D\x56\x00');
    return linhas;
}

async function testarImpressao() {
    var select = document.getElementById('qzListaImpressoras');
    if (select && select.value) { impressoraSelecionada = select.value; localStorage.setItem('qz_impressora', impressoraSelecionada); }
    if (!impressoraSelecionada) { mostrarToast('Selecione uma impressora', 'aviso'); return; }
    var c = await conectarQZ();
    if (!c) { mostrarToast('QZ Tray nao esta rodando', 'erro'); return; }
    var pedidoTeste = { id: 'TESTE_' + Date.now(), numero: 9999, cliente: { nome: 'CLIENTE TESTE' }, criadoEm: Date.now(), tipoEntrega: 'entrega', endereco: { rua: 'Rua do Teste', numero: '123', bairro: 'Centro' }, itens: [{ quantidade: 1, snapshot: { nome: 'X-Burguer Teste' } }, { quantidade: 2, snapshot: { nome: 'Coca-Cola Lata' } }], total: 3990, pagamento: { tipo: 'Dinheiro' } };
    var ok = await imprimirPedidoQZ(pedidoTeste);
    mostrarToast(ok ? 'Impressao de teste enviada!' : 'Falha na impressao', ok ? 'sucesso' : 'erro');
}

function adicionarFila(pedido) {
    if (!pedido || !pedido.id) return;
    if (pedidosImpressos.has(pedido.id)) return;
    if (pedidosNaFila.has(pedido.id)) return;
    pedido._tentativas = 0;
    pedidosNaFila.add(pedido.id);
    filaImpressao.push(pedido);
    salvarFila();
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
        pedido._tentativas = (pedido._tentativas || 0) + 1;
        if (pedido._tentativas < MAX_TENTATIVAS) {
            filaImpressao.unshift(pedido);
            salvarFila();
        } else {
            pedidosNaFila.delete(pedido.id);
            mostrarToast('Falha ao imprimir pedido', 'erro');
        }
    }
    imprimindoAgora = false;
    if (filaImpressao.length > 0) setTimeout(function() { processarFila(); }, 500);
}

function salvarFila() {
    try {
        var f = filaImpressao.map(function(p) { return { id: p.id, numero: p.numero, cliente: { nome: p.cliente?.nome }, criadoEm: p.criadoEm, tipoEntrega: p.tipoEntrega, endereco: p.endereco, itens: p.itens, total: p.total, pagamento: p.pagamento, _tentativas: p._tentativas || 0 }; });
        localStorage.setItem('qz_fila_impressao', JSON.stringify(f));
    } catch (e) {}
}

function restaurarFilaSalva() {
    try {
        var s = localStorage.getItem('qz_fila_impressao');
        if (s) {
            var f = JSON.parse(s);
            if (f.length > 0) {
                f.forEach(function(p) {
                    pedidosNaFila.delete(p.id);
                    if (!pedidosImpressos.has(p.id)) {
                        var existe = filaImpressao.some(function(x) { return x.id === p.id; });
                        if (!existe) {
                            pedidosNaFila.add(p.id);
                            filaImpressao.push(p);
                        }
                    }
                });
                processarFila();
            }
        }
    } catch (e) {}
}

function aoReceberNovoPedido(pedido) {
    if (!pedido || !pedido.id) return;
    if (pedidosImpressos.has(pedido.id)) return;
    if (typeof tocarSomNovoPedido === 'function') tocarSomNovoPedido();
    if (impressaoAutomatica) adicionarFila(pedido);
}

function ativarImpressaoAutomatica() {
    impressaoAutomatica = true;
    localStorage.setItem('qz_impressao_automatica', 'true');
    mostrarToast('Impressao automatica ATIVADA', 'sucesso');
}

// ============================================
// ===== DETECÇÃO DE ABA INATIVA ==============
// ============================================

document.addEventListener('visibilitychange', function() {
    if (!document.hidden) {
        if (typeof qz !== 'undefined' && !qz.websocket.isActive()) {
            conectarQZ();
        }
        if (filaImpressao.length > 0) {
            processarFila();
        }
    }
});

// ============================================
// ===== LIMPEZA AO FECHAR ====================
// ============================================

window.addEventListener('beforeunload', function() {
    clearInterval(heartbeatTimer);
    clearInterval(reconnectTimer);
    clearInterval(limpezaTimer);
    try { qz.websocket.disconnect(); } catch(e) {}
});

// ============================================
// ===== INICIALIZAÇÃO =========================
// ============================================

(function iniciar() {
    inicializarCaches();
    iniciarLimpezaCache();
    iniciarReconexaoAutomatica();
    impressaoAutomatica = localStorage.getItem('qz_impressao_automatica') === 'true';
    conectarQZ();
})();

window.abrirModalImpressora = abrirModalImpressora;
window.fecharModalImpressora = fecharModalImpressora;
window.testarImpressao = testarImpressao;
window.atualizarListaImpressoras = atualizarListaImpressoras;
window.salvarConfigImpressora = salvarConfigImpressora;
window.imprimirPedidoQZ = imprimirPedidoQZ;
window.conectarQZ = conectarQZ;
window.aoReceberNovoPedido = aoReceberNovoPedido;
window.ativarImpressaoAutomatica = ativarImpressaoAutomatica;
window.impressaoAutomatica = impressaoAutomatica;  

} 

} 

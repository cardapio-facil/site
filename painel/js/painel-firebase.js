// ============================================
// ===== CONEXÃO FIREBASE DO PAINEL ===========
// ============================================

firebase.initializeApp(CONFIG_PAINEL.firebase);
const database = firebase.database();
let dbRef = null;

// Autenticação anônima
firebase.auth().signInAnonymously()
    .then((userCredential) => {
        console.log('✅ Painel autenticado');
        console.log('UID:', userCredential.user.uid);
        dbRef = database.ref('restaurantes/' + CONFIG_PAINEL.restauranteId);
    })
    .catch((err) => {
        console.error('❌ Erro autenticação:', err);
    });

// ===== CARREGAR DADOS INICIAIS =====
async function carregarDadosPainel() {
    try {
        // Espera autenticação terminar
        while (!dbRef) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        console.log('📥 Carregando dados do Firebase...');
        const snapshot = await dbRef.once('value');
        const data = snapshot.val() || {};

        if (data.config) {
            if (data.config.nomeRestaurante) CONFIG_PAINEL.nomeRestaurante = data.config.nomeRestaurante;
            if (data.config.logoUrl) CONFIG_PAINEL.logoUrl = data.config.logoUrl;
            if (data.config.senhaMaster) CONFIG_PAINEL.senhaMasterPadrao = String(data.config.senhaMaster);
            if (data.config.senhaView) CONFIG_PAINEL.senhaViewPadrao = String(data.config.senhaView);
            if (data.config.mensagens) CONFIG_PAINEL.mensagens = { ...CONFIG_PAINEL.mensagens, ...data.config.mensagens };
            if (data.config.tempoEstimado) CONFIG_PAINEL.tempoEstimado = data.config.tempoEstimado;
        }

        console.log('✅ Dados carregados');
        return data;
    } catch (error) {
        console.error('❌ Erro ao carregar dados:', error);
        return {};
    }
}



// ===== ESTADO =====
let carregamentoInicial = true;
let pedidosCache = {};
let pedidosNotificados = {};
let listenerNovos = null;
let listenerUpdates = null;
let listenerRemovidos = null;
let reconnectTimer = null;
let autoReloadTimer = null;
let limpezaNotificadosTimer = null;
let renderTimeout = null;
let ultimaNotificacao = 0;
const LIMITE_PEDIDOS = 200;
const THROTTLE_NOTIFICACAO = 2000;

// ===== INDICADOR DE CONEXÃO =====
function atualizarIndicadorConexao(status) {
    const el = document.getElementById('statusConexao');
    if (!el) return;
    
    if (status === 'online') {
        el.innerHTML = '🟢 Online';
        el.style.color = '#4CAF50';
    } else if (status === 'reconnecting') {
        el.innerHTML = '🟡 Reconectando...';
        el.style.color = '#FFC107';
    } else {
        el.innerHTML = '🔴 Offline';
        el.style.color = '#f44336';
    }
}

database.ref('.info/connected').on('value', (snap) => {
    if (snap.val() === true) {
        atualizarIndicadorConexao('online');
        if (reconnectTimer) {
            clearTimeout(reconnectTimer);
            reconnectTimer = null;
        }
    } else {
        atualizarIndicadorConexao('offline');
        reconnectTimer = setTimeout(() => {
            atualizarIndicadorConexao('reconnecting');
        }, 3000);
    }
});

// ===== DETECTAR ABA SUSPENSA =====
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        console.log('👁️ Aba voltou a ficar visível');
        atualizarIndicadorConexao('online');
    }
});

// ===== CARREGAR DADOS INICIAIS =====
async function carregarDadosPainel() {
    try {
        console.log('📥 Carregando dados do Firebase...');
        const snapshot = await dbRef.once('value');
        const data = snapshot.val() || {};

        if (data.config) {
            if (data.config.nomeRestaurante) CONFIG_PAINEL.nomeRestaurante = data.config.nomeRestaurante;
            if (data.config.logoUrl) CONFIG_PAINEL.logoUrl = data.config.logoUrl;
            if (data.config.senhaMaster) CONFIG_PAINEL.senhaMasterPadrao = data.config.senhaMaster;
            if (data.config.senhaView) CONFIG_PAINEL.senhaViewPadrao = data.config.senhaView;
            if (data.config.mensagens) CONFIG_PAINEL.mensagens = { ...CONFIG_PAINEL.mensagens, ...data.config.mensagens };
            if (data.config.tempoEstimado) CONFIG_PAINEL.tempoEstimado = data.config.tempoEstimado;
        }

        console.log('✅ Dados carregados');
        return data;
    } catch (error) {
        console.error('❌ Erro ao carregar dados:', error);
        return {};
    }
}

// ===== DEBOUNCE PARA RENDERIZAÇÃO =====
function debounceRender(callback) {
    if (renderTimeout) clearTimeout(renderTimeout);
    renderTimeout = setTimeout(() => {
        const lista = Object.values(pedidosCache)
            .filter(p => p)
            .sort((a, b) => (b.criadoEm || 0) - (a.criadoEm || 0));
        callback(lista);
    }, 100);
}

// ===== OUVIR PEDIDOS EM TEMPO REAL (VERSÃO FINAL) =====
function ouvirPedidosPainel(callback) {
    pararOuvirPedidos();

    pedidosCache = {};
    pedidosNotificados = {};
    carregamentoInicial = true;

    console.log('👂 Iniciando listeners profissionais...');

    const doisDiasAtras = Date.now() - (2 * 24 * 60 * 60 * 1000);

    const query = dbRef.child('pedidos')
        .orderByChild('criadoEm')
        .startAt(doisDiasAtras)
        .limitToLast(LIMITE_PEDIDOS);

    query.once('value', (snap) => {
        const totalInicial = snap.numChildren();
        let carregados = 0;

        console.log(`📦 ${totalInicial} pedidos (últimos 2 dias, máx ${LIMITE_PEDIDOS})`);

        listenerNovos = query.on('child_added', (snapshot) => {
            const pedido = snapshot.val();
            const id = snapshot.key;

            carregados++;
            pedidosCache[id] = pedido;

            if (!carregamentoInicial && pedido && pedido.status === 'novo') {
                if (!pedidosNotificados[id]) {
                    console.log('🆕 NOVO PEDIDO:', pedido.numero || id);
                    pedidosNotificados[id] = true;
                    tocarSomNovoPedido();
                    notificarComThrottle(pedido);
                }
            }

            if (carregados >= totalInicial) {
                carregamentoInicial = false;
                console.log('✅ Carga inicial concluída.');
            }

            debounceRender(callback);
        });

        listenerUpdates = query.on('child_changed', (snapshot) => {
            const pedido = snapshot.val();
            const id = snapshot.key;
            pedidosCache[id] = pedido;
            debounceRender(callback);
        });

        listenerRemovidos = query.on('child_removed', (snapshot) => {
            const id = snapshot.key;
            delete pedidosCache[id];
            delete pedidosNotificados[id];
            debounceRender(callback);
        });
    });

    // Limpeza automática do cache de notificados
    if (limpezaNotificadosTimer) clearInterval(limpezaNotificadosTimer);
    limpezaNotificadosTimer = setInterval(() => {
        const antes = Object.keys(pedidosNotificados).length;
        pedidosNotificados = {};
        console.log(`🧹 Cache limpo: ${antes} itens`);
    }, 60 * 60 * 1000);
}

// ===== NOTIFICAÇÃO COM THROTTLE =====
function notificarComThrottle(pedido) {
    const agora = Date.now();
    
    if (agora - ultimaNotificacao < THROTTLE_NOTIFICACAO) return;
    
    ultimaNotificacao = agora;
    
    if (Notification.permission === 'granted') {
        new Notification('Novo Pedido!', {
            body: `#${pedido.numero || '---'} - ${pedido.cliente?.nome || 'Cliente'}`,
            icon: CONFIG_PAINEL.logoUrl,
            tag: 'novo-pedido'
        });
    }
}

// ===== SOM PARA NOVO PEDIDO =====
let audioNovoPedido = null;

function tocarSomNovoPedido() {
    try {
        if (!audioNovoPedido) {
            audioNovoPedido = new Audio('img/som.mp3');
            audioNovoPedido.loop = false;
        }
        audioNovoPedido.currentTime = 0;
        audioNovoPedido.play().catch(e => console.log('🔇 Som bloqueado'));
    } catch (e) {
        console.log('🔇 Erro ao tocar som:', e);
    }
}

function pararSomNovoPedido() {
    if (audioNovoPedido) {
        audioNovoPedido.pause();
        audioNovoPedido.currentTime = 0;
    }
}

function solicitarPermissaoNotificacao() {
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
}

// ===== ATUALIZAR STATUS =====
async function atualizarStatusPedidoPainel(pedidoId, novoStatus) {
    try {
        const ref = dbRef.child('pedidos/' + pedidoId);
        await ref.child('status').set(novoStatus);
        await ref.child('statusHistorico').push({
            status: novoStatus,
            em: firebase.database.ServerValue.TIMESTAMP,
            por: 'painel'
        });
        await ref.child('atualizadoEm').set(firebase.database.ServerValue.TIMESTAMP);
        if (novoStatus === 'preparando') await ref.child('inicioPreparo').set(firebase.database.ServerValue.TIMESTAMP);
        if (novoStatus === 'saiu_entrega') await ref.child('saidaEntrega').set(firebase.database.ServerValue.TIMESTAMP);
        return true;
    } catch (error) {
        return false;
    }
}

// ===== BUSCAR PEDIDO POR ID =====
async function buscarPedidoPainel(pedidoId) {
    try {
        const snap = await dbRef.child('pedidos/' + pedidoId).once('value');
        return snap.val() || null;
    } catch (error) {
        return null;
    }
}

// ===== PARAR DE OUVIR =====
function pararOuvirPedidos() {
    const query = dbRef.child('pedidos').orderByChild('criadoEm').startAt(Date.now() - (2 * 24 * 60 * 60 * 1000)).limitToLast(LIMITE_PEDIDOS);
    if (listenerNovos) { query.off('child_added', listenerNovos); listenerNovos = null; }
    if (listenerUpdates) { query.off('child_changed', listenerUpdates); listenerUpdates = null; }
    if (listenerRemovidos) { query.off('child_removed', listenerRemovidos); listenerRemovidos = null; }
    if (renderTimeout) { clearTimeout(renderTimeout); renderTimeout = null; }
    if (limpezaNotificadosTimer) { clearInterval(limpezaNotificadosTimer); limpezaNotificadosTimer = null; }
}

// ===== AUTO RELOAD =====
function iniciarAutoReload() {
    const TEMPO_RELOAD = 30 * 60 * 1000;
    if (autoReloadTimer) clearInterval(autoReloadTimer);
    autoReloadTimer = setInterval(() => {
        window.location.reload();
    }, TEMPO_RELOAD);
}

// ===== EXPOR =====
window.dbRef = dbRef;
window.database = database;
window.carregarDadosPainel = carregarDadosPainel;
window.ouvirPedidosPainel = ouvirPedidosPainel;
window.atualizarStatusPedidoPainel = atualizarStatusPedidoPainel;
window.buscarPedidoPainel = buscarPedidoPainel;
window.pararOuvirPedidos = pararOuvirPedidos;
window.iniciarAutoReload = iniciarAutoReload;
window.solicitarPermissaoNotificacao = solicitarPermissaoNotificacao;
window.tocarSomNovoPedido = tocarSomNovoPedido;
window.pararSomNovoPedido = pararSomNovoPedido;

// ============================================
// ===== CONEXÃO FIREBASE DO PAINEL ===========
// ============================================

firebase.initializeApp(CONFIG_PAINEL.firebase);
const database = firebase.database();
const dbRef = database.ref('restaurantes/' + CONFIG_PAINEL.restauranteId);

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

        console.log('✅ Dados carregados:', {
            nome: CONFIG_PAINEL.nomeRestaurante,
            pedidos: data.pedidos ? Object.keys(data.pedidos).length + ' pedidos' : 'nenhum'
        });

        return data;
    } catch (error) {
        console.error('❌ Erro ao carregar dados:', error);
        return {};
    }
}

function ouvirPedidosPainel(callback) {
    dbRef.child('pedidos').on('value', (snapshot) => {
        const pedidos = snapshot.val();
        if (pedidos) {
            const lista = Object.values(pedidos);
            lista.sort((a, b) => (b.criadoEm || 0) - (a.criadoEm || 0));
            callback(lista);
        } else {
            callback([]);
        }
    });
}

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
        console.log(`✅ Status do pedido ${pedidoId} atualizado para: ${novoStatus}`);
        return true;
    } catch (error) {
        console.error('❌ Erro ao atualizar status:', error);
        return false;
    }
}

async function buscarPedidoPainel(pedidoId) {
    try {
        const snap = await dbRef.child('pedidos/' + pedidoId).once('value');
        return snap.val() || null;
    } catch (error) {
        console.error('Erro ao buscar pedido:', error);
        return null;
    }
}

function pararOuvirPedidos() {
    dbRef.child('pedidos').off('value');
}

window.dbRef = dbRef;
window.database = database;
window.carregarDadosPainel = carregarDadosPainel;
window.ouvirPedidosPainel = ouvirPedidosPainel;
window.atualizarStatusPedidoPainel = atualizarStatusPedidoPainel;
window.buscarPedidoPainel = buscarPedidoPainel;
window.pararOuvirPedidos = pararOuvirPedidos;

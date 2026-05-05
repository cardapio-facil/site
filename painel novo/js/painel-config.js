// ============================================
// ===== CONEXÃO FIREBASE DO PAINEL ===========
// ============================================

// Inicializa Firebase
firebase.initializeApp(CONFIG_PAINEL.firebase);
const database = firebase.database();
const dbRef = database.ref('restaurantes/' + CONFIG_PAINEL.restauranteId);

// ===== CARREGAR DADOS INICIAIS =====
async function carregarDadosPainel() {
    try {
        console.log('📥 Carregando dados do Firebase...');
        const snapshot = await dbRef.once('value');
        const data = snapshot.val() || {};
        
        // Atualiza nome do restaurante
        if (data.config && data.config.nomeRestaurante) {
            CONFIG_PAINEL.nomeRestaurante = data.config.nomeRestaurante;
        }
        
        // Atualiza logo
        if (data.config && data.config.logoUrl) {
            CONFIG_PAINEL.logoUrl = data.config.logoUrl;
        }
        
        // Atualiza senhas
        if (data.config && data.config.senhaMaster) {
            CONFIG_PAINEL.senhaMasterPadrao = data.config.senhaMaster;
        }
        if (data.config && data.config.senhaView) {
            CONFIG_PAINEL.senhaViewPadrao = data.config.senhaView;
        }
        
        // Atualiza templates de mensagem
        if (data.config && data.config.mensagens) {
            CONFIG_PAINEL.mensagens = { ...CONFIG_PAINEL.mensagens, ...data.config.mensagens };
        }
        
        // Atualiza tempo estimado
        if (data.config && data.config.tempoEstimado) {
            CONFIG_PAINEL.tempoEstimado = data.config.tempoEstimado;
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

// ===== OUVIR PEDIDOS EM TEMPO REAL =====
function ouvirPedidosPainel(callback) {
    dbRef.child('pedidos').on('value', (snapshot) => {
        const pedidos = snapshot.val();
        if (pedidos) {
            const listaPedidos = Object.values(pedidos);
            // Ordenar por data (mais recente primeiro)
            listaPedidos.sort((a, b) => (b.criadoEm || 0) - (a.criadoEm || 0));
            callback(listaPedidos);
        } else {
            callback([]);
        }
    });
}

// ===== ATUALIZAR STATUS DO PEDIDO =====
async function atualizarStatusPedidoPainel(pedidoId, novoStatus) {
    try {
        const pedidoRef = dbRef.child('pedidos/' + pedidoId);
        
        // Atualiza status
        await pedidoRef.child('status').set(novoStatus);
        
        // Adiciona ao histórico
        const novoHistorico = {
            status: novoStatus,
            em: firebase.database.ServerValue.TIMESTAMP,
            por: 'painel'
        };
        await pedidoRef.child('statusHistorico').push(novoHistorico);
        
        // Atualiza timestamp
        await pedidoRef.child('atualizadoEm').set(firebase.database.ServerValue.TIMESTAMP);
        
        // Se for preparando, registra hora de início
        if (novoStatus === 'preparando') {
            await pedidoRef.child('inicioPreparo').set(firebase.database.ServerValue.TIMESTAMP);
        }
        
        // Se for saiu_entrega, registra hora de saída
        if (novoStatus === 'saiu_entrega') {
            await pedidoRef.child('saidaEntrega').set(firebase.database.ServerValue.TIMESTAMP);
        }
        
        console.log(`✅ Status do pedido ${pedidoId} atualizado para: ${novoStatus}`);
        return true;
    } catch (error) {
        console.error('❌ Erro ao atualizar status:', error);
        return false;
    }
}

// ===== BUSCAR PEDIDO POR ID =====
async function buscarPedidoPainel(pedidoId) {
    try {
        const snapshot = await dbRef.child('pedidos/' + pedidoId).once('value');
        return snapshot.val() || null;
    } catch (error) {
        console.error('Erro ao buscar pedido:', error);
        return null;
    }
}

// ===== PARAR DE OUVIR =====
function pararOuvirPedidos() {
    dbRef.child('pedidos').off('value');
}

// ===== EXPOR =====
window.dbRef = dbRef;
window.database = database;
window.carregarDadosPainel = carregarDadosPainel;
window.ouvirPedidosPainel = ouvirPedidosPainel;
window.atualizarStatusPedidoPainel = atualizarStatusPedidoPainel;
window.buscarPedidoPainel = buscarPedidoPainel;
window.pararOuvirPedidos = pararOuvirPedidos;
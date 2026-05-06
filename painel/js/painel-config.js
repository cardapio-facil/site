// ============================================
// ===== CONFIGURAÇÕES DO PAINEL ==============
// ============================================

const CONFIG_PAINEL = {
    restauranteId: 'deliverypro',
    nomeRestaurante: 'Delivery Pro',
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

    senhaMasterPadrao: '123',
    senhaViewPadrao: 'view123',

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

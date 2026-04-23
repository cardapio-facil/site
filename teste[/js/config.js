// ============================================
// ===== CONFIGURAÇÕES DO SISTEMA ============
// ============================================

// CONFIGURAÇÕES DO RESTAURANTE (MUDE AQUI)
const RESTAURANTE_ID = 'deliverypro';
const NOME_RESTAURANTE = 'Delivery Pro';
const LOGO_PADRAO = 'https://png.pngtree.com/png-clipart/20200727/original/pngtree-pin-food-delivery-map-location-delivery-logo-concept-png-image_5137624.jpg';

// SENHAS (mude para suas senhas)
const SENHA_MASTER = '123';
const SENHA_VIEW = 'view123';

// CONFIGURAÇÕES PADRÃO DO RESTAURANTE
const CONFIG_PADRAO = {
    horaAbre: '11:00',
    horaFecha: '23:00',
    tipoFrete: 'bairro',
    freteFixo: 5.00,
    fretesPorBairro: {},
    cidade: 'Conselheiro Lafaiete',  // ⭐ ÚNICO LUGAR DA CIDADE
    uf: 'MG'                          // ⭐ ÚNICO LUGAR DA UF
};

// CATEGORIAS PADRÃO
const CATEGORIAS_PADRAO = [
    'hamburguer', 
    'pizza', 
    'refeicao', 
    'cachorro-quente', 
    'porcao', 
    'bebidas', 
    'doces'
];

// ÍCONES DAS CATEGORIAS
const ICONES_CATEGORIA = {
    'hamburguer': '🍔',
    'pizza': '🍕',
    'refeicao': '🍚',
    'cachorro-quente': '🌭',
    'porcao': '🍗',
    'bebidas': '🥤',
    'doces': '🍰'
};

// NOMES AMIGÁVEIS DAS CATEGORIAS
const NOMES_CATEGORIA = {
    'hamburguer': 'Hambúrguer',
    'pizza': 'Pizza',
    'refeicao': 'Refeição',
    'cachorro-quente': 'Cachorro Quente',
    'porcao': 'Porção',
    'bebidas': 'Bebidas',
    'doces': 'Doces'
};

// ===== FUNÇÕES AUXILIARES =====
function formatarPreco(valor) {
    return `R$ ${valor.toFixed(2).replace('.', ',')}`;
}

function parsePreco(precoStr) {
    return parseFloat(precoStr.replace('R$', '').replace(',', '.')) || 0;
}

function getIconeCategoria(cat) {
    return ICONES_CATEGORIA[cat] || '📦';
}

function getNomeCategoria(cat) {
    return NOMES_CATEGORIA[cat] || cat;
}

function gerarId() {
    return Date.now().toString() + '-' + Math.random().toString(36).substr(2, 9);
}

// ===== FUNÇÃO DE TOAST =====
function mostrarToast(mensagem, tipo = 'info') {
    let container = document.getElementById('toastContainer');
    
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    
    const toast = document.createElement('div');
    toast.className = 'toast';
    
    const icones = {
        'sucesso': '✅',
        'erro': '❌',
        'alerta': '⚠️',
        'info': 'ℹ️'
    };
    
    const cores = {
        'sucesso': '#2ecc71',
        'erro': '#e74c3c',
        'alerta': '#f39c12',
        'info': '#3498db'
    };
    
    toast.style.borderLeft = `4px solid ${cores[tipo] || cores.info}`;
    toast.innerHTML = `
        <span>${icones[tipo] || icones.info}</span>
        <span>${mensagem}</span>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ===== FUNÇÃO DE LOADER =====
function mostrarLoader(show) {
    let loader = document.getElementById('globalLoader');
    
    if (show) {
        if (!loader) {
            loader = document.createElement('div');
            loader.id = 'globalLoader';
            loader.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.5);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 9999;
            `;
            loader.innerHTML = '<div class="loader"></div>';
            document.body.appendChild(loader);
        }
        loader.style.display = 'flex';
    } else if (loader) {
        loader.style.display = 'none';
    }
}
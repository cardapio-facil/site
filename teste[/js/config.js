// ============================================
// ===== CONFIGURAÇÕES DO SISTEMA ============
// ============================================

// CONFIGURAÇÕES DO RESTAURANTE (MUDE AQUI)
const RESTAURANTE_ID = 'deliverypro';
const NOME_RESTAURANTE = 'Delivery Pro';
const LOGO_PADRAO = 'https://png.pngtree.com/png-clipart/20200727/original/pngtree-pin-food-delivery-map-location-delivery-logo-concept-png-image_5137624.jpg';

// SENHAS (mude para suas senhas)
const SENHA_MASTER = '123';      // Acesso total (editar produtos, categorias, etc.)
const SENHA_VIEW = 'view123';    // Apenas visualização

// CONFIGURAÇÕES PADRÃO DO RESTAURANTE
const CONFIG_PADRAO = {
    horaAbre: '11:00',
    horaFecha: '23:00',
    tipoFrete: 'bairro',        // 'bairro' ou 'fixo'
    freteFixo: 5.00,
    fretesPorBairro: {
        'centro': 5.00,
        'santo antonio': 7.00,
        'castelo': 8.00
    },
    cidade: 'Conselheiro Lafaiete',
    uf: 'MG',
    numeroWhatsapp: '5531999999999',  // ⭐ ADICIONEI
    templateMensagem: `🍕 *NOVO PEDIDO* 🍕

*Cliente:* {NOME}
*Telefone:* {TELEFONE}

*ITENS:*
{ITENS}

*Subtotal:* {SUBTOTAL}
*Frete:* {FRETE}
*TOTAL:* {TOTAL}

*Endereço:* {ENDERECO}
*Pagamento:* {PAGAMENTO}
{OBS}`
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
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(valor);
}

function parsePreco(precoStr) {
    if (typeof precoStr === 'number') return precoStr;
    if (!precoStr) return 0;
    
    // Remove 'R$' e espaços, troca vírgula por ponto
    const valor = precoStr.toString()
        .replace('R$', '')
        .replace(/\./g, '')
        .replace(',', '.')
        .trim();
    
    return parseFloat(valor) || 0;
}

function getIconeCategoria(cat) {
    return ICONES_CATEGORIA[cat] || '📦';
}

function getNomeCategoria(cat) {
    return NOMES_CATEGORIA[cat] || cat;
}

function gerarId() {
    return Date.now().toString(36) + '-' + Math.random().toString(36).substr(2, 9);
}

// ===== FUNÇÃO DE TOAST MELHORADA =====
function mostrarToast(mensagem, tipo = 'info', titulo = '') {
    let container = document.getElementById('toastContainer');
    
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    
    const toast = document.createElement('div');
    toast.className = 'toast';
    
    const config = {
        'sucesso': { icone: '✅', cor: '#2ecc71', titulo: 'Sucesso!' },
        'erro': { icone: '❌', cor: '#e74c3c', titulo: 'Erro!' },
        'alerta': { icone: '⚠️', cor: '#f39c12', titulo: 'Atenção!' },
        'info': { icone: 'ℹ️', cor: '#3498db', titulo: 'Info' }
    };
    
    const cfg = config[tipo] || config.info;
    const tituloFinal = titulo || cfg.titulo;
    
    toast.style.borderLeft = `4px solid ${cfg.cor}`;
    toast.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 1.2rem;">${cfg.icone}</span>
            <div>
                <strong style="color: ${cfg.cor};">${tituloFinal}</strong>
                <p style="margin: 0; font-size: 0.85rem;">${mensagem}</p>
            </div>
        </div>
        <button onclick="this.parentElement.remove()" style="background: none; border: none; cursor: pointer;">✕</button>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
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
                background: rgba(0,0,0,0.6);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 9999;
                backdrop-filter: blur(3px);
            `;
            loader.innerHTML = `
                <div style="background: white; padding: 20px; border-radius: 12px; text-align: center;">
                    <div class="loader"></div>
                    <p style="margin-top: 10px; color: var(--cor-primaria);">Carregando...</p>
                </div>
            `;
            document.body.appendChild(loader);
        }
        loader.style.display = 'flex';
    } else if (loader) {
        loader.style.display = 'none';
    }
}

// ===== VALIDAÇÃO DE HORÁRIO =====
function isRestauranteAberto() {
    const agora = new Date();
    const horaAtual = agora.getHours() * 60 + agora.getMinutes();
    
    const [hAbre, mAbre] = CONFIG_PADRAO.horaAbre.split(':').map(Number);
    const [hFecha, mFecha] = CONFIG_PADRAO.horaFecha.split(':').map(Number);
    
    const abertura = hAbre * 60 + mAbre;
    const fechamento = hFecha * 60 + mFecha;
    
    if (fechamento > abertura) {
        return horaAtual >= abertura && horaAtual <= fechamento;
    } else {
        return horaAtual >= abertura || horaAtual <= fechamento;
    }
}

// ===== EXPOR FUNÇÕES GLOBALMENTE =====
window.formatarPreco = formatarPreco;
window.parsePreco = parsePreco;
window.getIconeCategoria = getIconeCategoria;
window.getNomeCategoria = getNomeCategoria;
window.gerarId = gerarId;
window.mostrarToast = mostrarToast;
window.mostrarLoader = mostrarLoader;
window.isRestauranteAberto = isRestauranteAberto;

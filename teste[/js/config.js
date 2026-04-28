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
    numeroWhatsapp: '5531999999999',
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

// CATEGORIA FIXA QUE NÃO PODE SER EXCLUÍDA
const CATEGORIA_FIXA = 'pizza';

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

// Controle de visibilidade das categorias
const CATEGORIAS_VISIVEIS_PADRAO = {
    'hamburguer': true,
    'pizza': true,
    'refeicao': true,
    'cachorro-quente': true,
    'porcao': true,
    'bebidas': true,
    'doces': true
};

// 🛠️ ESTRUTURA PADRÃO DE MONTAGEM (exemplo Marmitex)
const MONTAGENS_PADRAO = [
    {
        id: 'mont1',
        nome: 'Marmitex',
        descricao: 'Monte sua refeição do seu jeito',
        categoria: 'refeicao',
        precoBase: 25.00,
        imagem: '',
        disponivel: true,
        destaque: true,
        tamanhos: [
            { id: 'tam1', nome: 'Pequeno (500g)', preco: 0 },
            { id: 'tam2', nome: 'Médio (700g)', preco: 5.00 },
            { id: 'tam3', nome: 'Grande (1kg)', preco: 10.00 }
        ],
        grupos: [
            {
                id: 'grp1',
                nome: 'Carnes',
                limite: 1,
                obrigatorio: true,
                itens: [
                    { id: 'itm1', nome: 'Frango Grelhado', preco: 0, disponivel: true },
                    { id: 'itm2', nome: 'Bife Acebolado', preco: 5.00, disponivel: true },
                    { id: 'itm3', nome: 'Linguiça Toscana', preco: 3.00, disponivel: true },
                    { id: 'itm4', nome: 'Filé de Tilápia', preco: 7.00, disponivel: true }
                ]
            },
            {
                id: 'grp2',
                nome: 'Acompanhamentos',
                limite: 3,
                obrigatorio: true,
                itens: [
                    { id: 'itm5', nome: 'Arroz Branco', preco: 0, disponivel: true },
                    { id: 'itm6', nome: 'Arroz Integral', preco: 2.00, disponivel: true },
                    { id: 'itm7', nome: 'Feijão Carioca', preco: 0, disponivel: true },
                    { id: 'itm8', nome: 'Feijão Tropeiro', preco: 3.00, disponivel: true },
                    { id: 'itm9', nome: 'Batata Frita', preco: 4.00, disponivel: true },
                    { id: 'itm10', nome: 'Salada Verde', preco: 0, disponivel: true },
                    { id: 'itm11', nome: 'Legumes Salteados', preco: 2.00, disponivel: true },
                    { id: 'itm12', nome: 'Purê de Batata', preco: 2.00, disponivel: true }
                ]
            },
            {
                id: 'grp3',
                nome: 'Extras',
                limite: 2,
                obrigatorio: false,
                itens: [
                    { id: 'itm13', nome: 'Ovo Frito', preco: 3.00, disponivel: true },
                    { id: 'itm14', nome: 'Bacon Crocante', preco: 5.00, disponivel: true },
                    { id: 'itm15', nome: 'Queijo Coalho', preco: 4.00, disponivel: true },
                    { id: 'itm16', nome: 'Banana Frita', preco: 3.00, disponivel: true }
                ]
            }
        ]
    }
];

// ===== FUNÇÕES AUXILIARES (ATUALIZADAS) =====

/**
 * Formata valor em centavos para exibição
 * @param {number} centavos - Valor em centavos (ex: 3290 = R$ 32,90)
 * @returns {string} Valor formatado
 */
function formatarPreco(centavos) {
    // Se já for float (legado), converte
    if (typeof centavos === 'number' && centavos % 1 !== 0) {
        centavos = Math.round(centavos * 100);
    }
    
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(centavos / 100);
}

/**
 * Converte string de preço para centavos
 * @param {string|number} precoStr - "R$ 32,90" ou 32.90
 * @returns {number} Valor em centavos
 */
function parsePreco(precoStr) {
    if (typeof precoStr === 'number') {
        // Se já for inteiro (centavos), retorna
        if (precoStr % 1 === 0 && precoStr > 100) return precoStr;
        // Se for float, converte
        return Math.round(precoStr * 100);
    }
    if (!precoStr) return 0;
    
    const valor = precoStr.toString()
        .replace('R$', '')
        .replace(/\./g, '')
        .replace(',', '.')
        .trim();
    
    return Math.round(parseFloat(valor) * 100) || 0;
}

/**
 * Converte centavos para número float (para cálculos internos)
 * @param {number} centavos
 * @returns {number}
 */
function centavosParaFloat(centavos) {
    return centavos / 100;
}

/**
 * Converte float para centavos
 * @param {number} float
 * @returns {number}
 */
function floatParaCentavos(float) {
    return Math.round(float * 100);
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

function isCategoriaFixa(cat) {
    return cat === CATEGORIA_FIXA;
}

function getSaboresPizzaDisponiveis() {
    return produtos.filter(p => 
        p.categoria === CATEGORIA_FIXA && 
        p.disponivel !== false
    );
}

function calcularPrecoPizza(precoBase, saboresEscolhidos) {
    if (!saboresEscolhidos || saboresEscolhidos.length === 0) {
        return precoBase;
    }
    const maiorPrecoSabor = Math.max(...saboresEscolhidos.map(s => s.preco));
    return Math.max(precoBase, maiorPrecoSabor);
}

// 🛠️ Calcula preço da montagem
function calcularPrecoMontagem(montagem, tamanhoEscolhido, itensSelecionados) {
    let preco = montagem.precoBase;
    
    // Adiciona preço do tamanho
    if (tamanhoEscolhido) {
        preco += tamanhoEscolhido.preco;
    }
    
    // Adiciona preço dos itens selecionados
    itensSelecionados.forEach(item => {
        preco += item.preco || 0;
    });
    
    return preco;
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
window.isCategoriaFixa = isCategoriaFixa;
window.getSaboresPizzaDisponiveis = getSaboresPizzaDisponiveis;
window.calcularPrecoPizza = calcularPrecoPizza;
window.calcularPrecoMontagem = calcularPrecoMontagem;
window.mostrarToast = mostrarToast;
window.mostrarLoader = mostrarLoader;
window.isRestauranteAberto = isRestauranteAberto;
window.CATEGORIAS_VISIVEIS_PADRAO = CATEGORIAS_VISIVEIS_PADRAO;
window.MONTAGENS_PADRAO = MONTAGENS_PADRAO;

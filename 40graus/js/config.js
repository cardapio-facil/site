// ============================================
// ===== CONFIGURAÇÕES DO SISTEMA ============
// ============================================

// CONFIGURAÇÕES DO RESTAURANTE (MUDE AQUI)
const RESTAURANTE_ID = '40graus';
const NOME_RESTAURANTE = 'Restaurante 40 graus';
const LOGO_PADRAO = 'https://i.imgur.com/yV7ub1g.png';


// CONFIGURAÇÕES PADRÃO DO RESTAURANTE
const CONFIG_PADRAO = {
    statusManual: 'aberto',           // 'aberto' | 'fechado'
    horariosLoja: [],                 // IDs dos horários vinculados
    tipoFrete: 'bairro',
    freteFixo: 500,
    fretesPorBairro: {
        'centro': 500,
        'santo antonio': 700,
        'castelo': 800
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

const CATEGORIA_FIXA = 'pizza';

const ICONES_CATEGORIA = {
    'hamburguer': '🍔',
    'pizza': '🍕',
    'refeicao': '🍚',
    'cachorro-quente': '🌭',
    'porcao': '🍗',
    'bebidas': '🥤',
    'doces': '🍰'
};

const NOMES_CATEGORIA = {
    'hamburguer': 'Hambúrguer',
    'pizza': 'Pizza',
    'refeicao': 'Refeição',
    'cachorro-quente': 'Cachorro Quente',
    'porcao': 'Porção',
    'bebidas': 'Bebidas',
    'doces': 'Doces'
};

const CATEGORIAS_VISIVEIS_PADRAO = {
    'hamburguer': true,
    'pizza': true,
    'refeicao': true,
    'cachorro-quente': true,
    'porcao': true,
    'bebidas': true,
    'doces': true
};

const MONTAGENS_PADRAO = [
    {
        id: 'mont1',
        nome: 'Marmitex',
        descricao: 'Monte sua refeição do seu jeito',
        categoria: 'refeicao',
        precoBase: 2500,
        imagem: '',
        disponivel: true,
        destaque: true,
        tamanhos: [
            { id: 'tam1', nome: 'Pequeno (500g)', preco: 0 },
            { id: 'tam2', nome: 'Médio (700g)', preco: 500 },
            { id: 'tam3', nome: 'Grande (1kg)', preco: 1000 }
        ],
        grupos: [
            {
                id: 'grp1',
                nome: 'Carnes',
                limite: 1,
                obrigatorio: true,
                itens: [
                    { id: 'itm1', nome: 'Frango Grelhado', preco: 0, disponivel: true },
                    { id: 'itm2', nome: 'Bife Acebolado', preco: 500, disponivel: true },
                    { id: 'itm3', nome: 'Linguiça Toscana', preco: 300, disponivel: true },
                    { id: 'itm4', nome: 'Filé de Tilápia', preco: 700, disponivel: true }
                ]
            },
            {
                id: 'grp2',
                nome: 'Acompanhamentos',
                limite: 3,
                obrigatorio: true,
                itens: [
                    { id: 'itm5', nome: 'Arroz Branco', preco: 0, disponivel: true },
                    { id: 'itm6', nome: 'Arroz Integral', preco: 200, disponivel: true },
                    { id: 'itm7', nome: 'Feijão Carioca', preco: 0, disponivel: true },
                    { id: 'itm8', nome: 'Feijão Tropeiro', preco: 300, disponivel: true },
                    { id: 'itm9', nome: 'Batata Frita', preco: 400, disponivel: true },
                    { id: 'itm10', nome: 'Salada Verde', preco: 0, disponivel: true },
                    { id: 'itm11', nome: 'Legumes Salteados', preco: 200, disponivel: true },
                    { id: 'itm12', nome: 'Purê de Batata', preco: 200, disponivel: true }
                ]
            },
            {
                id: 'grp3',
                nome: 'Extras',
                limite: 2,
                obrigatorio: false,
                itens: [
                    { id: 'itm13', nome: 'Ovo Frito', preco: 300, disponivel: true },
                    { id: 'itm14', nome: 'Bacon Crocante', preco: 500, disponivel: true },
                    { id: 'itm15', nome: 'Queijo Coalho', preco: 400, disponivel: true },
                    { id: 'itm16', nome: 'Banana Frita', preco: 300, disponivel: true }
                ]
            }
        ]
    }
];

// HORÁRIOS PADRÃO
const HORARIOS_PADRAO = [];

// FERIADOS PADRÃO
const FERIADOS_PADRAO = [];

// ===== FUNÇÕES AUXILIARES =====

function formatarPreco(centavos) {
    if (centavos === null || centavos === undefined) return 'R$ 0,00';
    if (typeof centavos === 'number' && centavos % 1 !== 0) {
        centavos = Math.round(centavos * 100);
    }
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(centavos / 100);
}

function parsePreco(precoStr) {
    if (typeof precoStr === 'number') {
        if (precoStr % 1 === 0 && precoStr > 100) return precoStr;
        if (precoStr % 1 !== 0) return Math.round(precoStr * 100);
        return Math.round(precoStr * 100);
    }
    if (!precoStr) return 0;
    const valor = precoStr.toString().replace('R$', '').replace(/\./g, '').replace(',', '.').trim();
    const float = parseFloat(valor);
    if (float < 100 && float % 1 !== 0) return Math.round(float * 100);
    if (float < 100 && float % 1 === 0) return Math.round(float * 100);
    return Math.round(float);
}

function centavosParaFloat(centavos) {
    if (!centavos) return 0;
    return centavos / 100;
}

function floatParaCentavos(valorEmReais) {
    if (!valorEmReais) return 0;
    return Math.round(valorEmReais * 100);
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
    return produtos.filter(p => p.categoria === CATEGORIA_FIXA && p.disponivel !== false);
}

function calcularPrecoPizza(precoBase, saboresEscolhidos) {
    if (!saboresEscolhidos || saboresEscolhidos.length === 0) return precoBase;
    const maiorPrecoSabor = Math.max(...saboresEscolhidos.map(s => s.preco));
    return Math.max(precoBase, maiorPrecoSabor);
}

function calcularPrecoMontagem(montagem, tamanhoEscolhido, itensSelecionados) {
    let preco = montagem.precoBase;
    if (tamanhoEscolhido) preco += tamanhoEscolhido.preco;
    itensSelecionados.forEach(item => { preco += item.preco || 0; });
    return preco;
}

// ===== FUNÇÕES DE HORÁRIO =====

let feriadoHoje = false;
let ultimoDiaVerificado = '';

/**
 * Verifica se uma data é feriado
 */
function isFeriado(data) {
    const mesDia = String(data.getMonth() + 1).padStart(2, '0') + '-' +
                   String(data.getDate()).padStart(2, '0');
    const dataCompleta = data.getFullYear() + '-' + mesDia;
    
    return feriados.some(f => {
        if (f.recorrente) return f.data === mesDia;
        return f.data === dataCompleta;
    });
}

/**
 * Verifica se é feriado hoje (com cache diário)
 */
function isFeriadoHoje() {
    const agora = new Date();
    const hoje = agora.toISOString().split('T')[0];
    
    if (hoje !== ultimoDiaVerificado) {
        feriadoHoje = isFeriado(agora);
        ultimoDiaVerificado = hoje;
    }
    
    return feriadoHoje;
}

/**
 * Verifica se está dentro de um horário específico
 */
function isDentroHorario(horarioId, agora) {
    const horario = getHorarioById(horarioId);
    if (!horario) return false;
    
    const diaSemana = agora.getDay() || 7;
    if (!horario.diasSemana.includes(diaSemana)) return false;
    
    const [hIni, mIni] = horario.horaInicio.split(':').map(Number);
    const [hFim, mFim] = horario.horaFim.split(':').map(Number);
    const horaAtual = agora.getHours() * 60 + agora.getMinutes();
    const inicio = hIni * 60 + mIni;
    const fim = hFim * 60 + mFim;
    
    if (horario.permiteViradaDia && inicio > fim) {
        return horaAtual >= inicio || horaAtual <= fim;
    }
    
    return horaAtual >= inicio && horaAtual <= fim;
}

/**
 * Verifica se uma categoria está disponível agora
 */
function isCategoriaDisponivel(categoria, agora) {
    if (!agora) agora = new Date();
    
    return horarios.some(h => {
        if (!h.categorias.includes(categoria)) return false;
        if (h.categorias.includes(categoria) && 
            configRestaurante.horariosLoja.includes(h.id)) {
            return isDentroHorario(h.id, agora);
        }
        return false;
    });
}

/**
 * Busca o próximo horário de uma categoria
 */
function getProximoHorarioDaCategoria(categoria, agora) {
    if (!agora) agora = new Date();
    
    const horariosDaCategoria = horarios.filter(h =>
        h.categorias.includes(categoria) &&
        configRestaurante.horariosLoja.includes(h.id)
    );
    
    if (horariosDaCategoria.length === 0) return null;
    
    let melhorProximo = null;
    let menorDiferenca = Infinity;
    
    for (let diasAdiante = 0; diasAdiante < 7; diasAdiante++) {
        const dataVerificacao = new Date(agora);
        dataVerificacao.setDate(dataVerificacao.getDate() + diasAdiante);
        const diaSemana = dataVerificacao.getDay() || 7;
        
        for (const horario of horariosDaCategoria) {
            if (!horario.diasSemana.includes(diaSemana)) continue;
            
            const [hIni, mIni] = horario.horaInicio.split(':').map(Number);
            const inicioMinutos = hIni * 60 + mIni;
            
            if (diasAdiante === 0) {
                const agoraMinutos = agora.getHours() * 60 + agora.getMinutes();
                if (inicioMinutos <= agoraMinutos) continue;
            }
            
            const diferenca = diasAdiante * 1440 + inicioMinutos;
            if (diferenca < menorDiferenca) {
                menorDiferenca = diferenca;
                melhorProximo = {
                    data: dataVerificacao,
                    horaInicio: horario.horaInicio,
                    nome: horario.nome
                };
            }
        }
        
        if (melhorProximo && diasAdiante === 0) break;
    }
    
    return melhorProximo;
}

/**
 * Gera o texto do selo para um card fora do horário
 */
function getSeloForaHorario(categoria) {
    const agora = new Date();
    
    if (configRestaurante.statusManual === 'fechado') {
        return { texto: '<i class="fas fa-lock"></i> Fechado', cor: '#c0392b' };
    }
    
    if (isFeriadoHoje()) {
        const feriado = feriados.find(f => {
            const mesDia = String(agora.getMonth() + 1).padStart(2, '0') + '-' +
                           String(agora.getDate()).padStart(2, '0');
            return f.recorrente ? f.data === mesDia : f.data === agora.toISOString().split('T')[0];
        });
        return { texto: '<i class="fas fa-calendar"></i> ' + (feriado ? feriado.nome : 'Feriado'), cor: '#7f8c8d' };
    }
    
    const lojaAberta = configRestaurante.horariosLoja.some(id => isDentroHorario(id, agora));
    if (!lojaAberta) {
        const proximoLoja = getProximoHorarioLoja(agora);
        if (proximoLoja) {
            return getTextoSeloTempo(proximoLoja);
        }
        return { texto: '<i class="fas fa-lock"></i> Fechado hoje', cor: '#c0392b' };
    }
    
    const proximoCat = getProximoHorarioDaCategoria(categoria, agora);
    if (proximoCat) {
        return getTextoSeloTempo(proximoCat);
    }
    
    return { texto: '<i class="fas fa-lock"></i> Indisponivel', cor: '#c0392b' };
}

function getProximoHorarioLoja(agora) {
    let melhorProximo = null;
    let menorDiferenca = Infinity;
    
    for (let diasAdiante = 0; diasAdiante < 7; diasAdiante++) {
        const dataVerificacao = new Date(agora);
        dataVerificacao.setDate(dataVerificacao.getDate() + diasAdiante);
        const diaSemana = dataVerificacao.getDay() || 7;
        
        for (const horarioId of configRestaurante.horariosLoja) {
            const horario = getHorarioById(horarioId);
            if (!horario || !horario.diasSemana.includes(diaSemana)) continue;
            
            const [hIni, mIni] = horario.horaInicio.split(':').map(Number);
            const inicioMinutos = hIni * 60 + mIni;
            
            if (diasAdiante === 0) {
                const agoraMinutos = agora.getHours() * 60 + agora.getMinutes();
                if (inicioMinutos <= agoraMinutos) continue;
            }
            
            const diferenca = diasAdiante * 1440 + inicioMinutos;
            if (diferenca < menorDiferenca) {
                menorDiferenca = diferenca;
                melhorProximo = {
                    data: dataVerificacao,
                    horaInicio: horario.horaInicio,
                    nome: horario.nome
                };
            }
        }
        
        if (melhorProximo && diasAdiante === 0) break;
    }
    
    return melhorProximo;
}

function getTextoSeloTempo(proximo) {
    const hoje = new Date();
    const amanha = new Date(hoje);
    amanha.setDate(amanha.getDate() + 1);
    
    const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    
    if (proximo.data.toDateString() === hoje.toDateString()) {
        return { texto: `🕐 A partir das ${proximo.horaInicio}`, cor: '#f39c12' };
    } else if (proximo.data.toDateString() === amanha.toDateString()) {
        return { texto: `🕐 Amanhã às ${proximo.horaInicio}`, cor: '#3498db' };
    } else {
        const nomeDia = diasSemana[proximo.data.getDay()];
        return { texto: `🕐 ${nomeDia} às ${proximo.horaInicio}`, cor: '#9b59b6' };
    }
}

function getHorarioById(id) {
    return horarios.find(h => h.id === id);
}

function verificarStatusLoja() {
    const agora = new Date();
    
    if (configRestaurante.statusManual === 'fechado') {
        return { aberto: false, motivo: 'fechado' };
    }
    
    if (isFeriadoHoje()) {
        return { aberto: false, motivo: 'feriado' };
    }
    
    if (!configRestaurante.horariosLoja || configRestaurante.horariosLoja.length === 0) {
        return { aberto: true, motivo: null };
    }
    
    const lojaAberta = configRestaurante.horariosLoja.some(id => isDentroHorario(id, agora));
    
    return { aberto: lojaAberta, motivo: lojaAberta ? null : 'fora_horario' };
}

// ===== TOAST =====
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

function mostrarLoader(show) {
    let loader = document.getElementById('globalLoader');
    if (show) {
        if (!loader) {
            loader = document.createElement('div');
            loader.id = 'globalLoader';
            loader.style.cssText = `
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background: rgba(0,0,0,0.6); display: flex; justify-content: center;
                align-items: center; z-index: 9999; backdrop-filter: blur(3px);
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

// ============================================
// ===== 🆕 SISTEMA DE CUPONS ================
// ============================================

const CUPONS_PADRAO = [];

function validarCupom(codigo, subtotalCentavos, userId = null) {
    const cupom = cupons.find(c => c.codigo === codigo.toUpperCase().trim());
    
    if (!cupom) {
        return { valido: false, erro: 'Cupom não encontrado', mensagem: 'Este cupom não existe. Verifique o código e tente novamente.' };
    }
    
    if (!cupom.ativo) {
        return { valido: false, erro: 'Cupom inativo', mensagem: 'Este cupom não está mais disponível.' };
    }
    
    if (cupom.dataInicio) {
        const agora = new Date();
        const dataInicio = new Date(cupom.dataInicio);
        if (agora < dataInicio) {
            return { valido: false, erro: 'Cupom ainda não válido', mensagem: `Este cupom será válido a partir de ${dataInicio.toLocaleDateString('pt-BR')}.` };
        }
    }
    
    if (cupom.dataExpiracao) {
        const agora = new Date();
        const dataExpiracao = new Date(cupom.dataExpiracao);
        dataExpiracao.setHours(23, 59, 59, 999);
        if (agora > dataExpiracao) {
            return { valido: false, erro: 'Cupom expirado', mensagem: 'Este cupom já expirou.' };
        }
    }
    
    if (cupom.tipoLimiteUso === 'unico' && cupom.usos >= 1) {
        return { valido: false, erro: 'Cupom já utilizado', mensagem: 'Este cupom já foi utilizado e é de uso único.' };
    }
    
    if (cupom.tipoLimiteUso === 'limitado' && cupom.usos >= cupom.limiteUso) {
        return { valido: false, erro: 'Limite de usos atingido', mensagem: `Este cupom já foi utilizado ${cupom.limiteUso} vez(es) e atingiu o limite.` };
    }
    
    if (cupom.limitePorUsuario && userId) {
        const usosDoUsuario = cupom.historicoUso ? cupom.historicoUso.filter(h => h.userId === userId).length : 0;
        if (usosDoUsuario >= cupom.limitePorUsuario) {
            return { valido: false, erro: 'Limite por usuário atingido', mensagem: `Você já utilizou este cupom ${cupom.limitePorUsuario} vez(es).` };
        }
    }
    
    if (cupom.valorMinimoPedido && subtotalCentavos < cupom.valorMinimoPedido) {
        return { valido: false, erro: 'Valor mínimo não atingido', mensagem: `Pedido mínimo para este cupom: ${formatarPreco(cupom.valorMinimoPedido)}.` };
    }
    
    let descontoCentavos = 0;
    
    if (cupom.tipoDesconto === 'percentual') {
        const percentual = Math.min(cupom.valorDesconto, 100);
        descontoCentavos = Math.floor(subtotalCentavos * percentual / 100);
    } else if (cupom.tipoDesconto === 'fixo') {
        descontoCentavos = cupom.valorDesconto;
    }
    
    if (descontoCentavos > subtotalCentavos) {
        descontoCentavos = subtotalCentavos;
    }
    
    const totalComDesconto = Math.max(0, subtotalCentavos - descontoCentavos);
    
    return {
        valido: true, cupom: cupom, descontoCentavos: descontoCentavos,
        subtotalOriginal: subtotalCentavos, subtotalComDesconto: totalComDesconto,
        mensagem: `Cupom aplicado! Desconto de ${formatarPreco(descontoCentavos)}.`
    };
}

function registrarUsoCupom(codigo, userId = null, descontoCentavos = 0, pedidoId = null) {
    const cupom = cupons.find(c => c.codigo === codigo.toUpperCase().trim());
    if (!cupom) return false;
    
    cupom.usos = (cupom.usos || 0) + 1;
    if (!cupom.historicoUso) cupom.historicoUso = [];
    
    cupom.historicoUso.push({
        userId: userId || 'anonimo',
        data: new Date().toISOString(),
        descontoCentavos: descontoCentavos,
        pedidoId: pedidoId
    });
    
    salvarCuponsFirebase(cupons);
    return true;
}

function formatarDescontoCupom(cupom) {
    if (cupom.tipoDesconto === 'percentual') {
        return `${cupom.valorDesconto}%`;
    } else {
        return formatarPreco(cupom.valorDesconto);
    }
}

function parseValorDesconto(valorStr, tipo) {
    if (!valorStr) return 0;
    
    let valor = valorStr.toString().replace(/R\$/gi, '').replace(/\s/g, '').replace(/\./g, '').replace(',', '.').trim();
    const isPercentual = valor.includes('%');
    valor = valor.replace('%', '');
    
    const valorFloat = parseFloat(valor);
    if (isNaN(valorFloat)) return 0;
    
    if (tipo === 'percentual') {
        return Math.min(100, Math.max(0, Math.round(valorFloat)));
    } else {
        return floatParaCentavos(valorFloat);
    }
}

// ===== EXPOR =====
window.CUPONS_PADRAO = CUPONS_PADRAO;
window.validarCupom = validarCupom;
window.registrarUsoCupom = registrarUsoCupom;
window.formatarDescontoCupom = formatarDescontoCupom;
window.parseValorDesconto = parseValorDesconto;
window.formatarPreco = formatarPreco;
window.parsePreco = parsePreco;
window.centavosParaFloat = centavosParaFloat;
window.floatParaCentavos = floatParaCentavos;
window.getIconeCategoria = getIconeCategoria;
window.getNomeCategoria = getNomeCategoria;
window.gerarId = gerarId;
window.isCategoriaFixa = isCategoriaFixa;
window.getSaboresPizzaDisponiveis = getSaboresPizzaDisponiveis;
window.calcularPrecoPizza = calcularPrecoPizza;
window.calcularPrecoMontagem = calcularPrecoMontagem;
window.isFeriado = isFeriado;
window.isFeriadoHoje = isFeriadoHoje;
window.isDentroHorario = isDentroHorario;
window.isCategoriaDisponivel = isCategoriaDisponivel;
window.getProximoHorarioDaCategoria = getProximoHorarioDaCategoria;
window.getSeloForaHorario = getSeloForaHorario;
window.getHorarioById = getHorarioById;
window.verificarStatusLoja = verificarStatusLoja;
window.mostrarToast = mostrarToast;
window.mostrarLoader = mostrarLoader;
window.CATEGORIAS_VISIVEIS_PADRAO = CATEGORIAS_VISIVEIS_PADRAO;
window.MONTAGENS_PADRAO = MONTAGENS_PADRAO;
window.HORARIOS_PADRAO = HORARIOS_PADRAO;
window.FERIADOS_PADRAO = FERIADOS_PADRAO;

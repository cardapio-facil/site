// ============================================
// ===== VARIÁVEIS GLOBAIS ===================
// ============================================

let produtos = [];                    // Lista de produtos
let categorias = [...CATEGORIAS_PADRAO];
let adicionaisPorCategoria = {};      // { categoria: [{nome, preco}] }
let carrinho = [];
let configRestaurante = { ...CONFIG_PADRAO };

let adminLogado = false;
let nivelAcesso = null;
let produtoSelecionado = null;
let produtoEditando = null;

let quantidadeSelecionada = 1;
let saboresSelecionados = [];
let adicionaisSelecionados = [];

let categoriaAtual = 'todos';

// ============================================
// ===== INICIALIZAÇÃO =======================
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
    document.getElementById('restauranteNome').innerText = NOME_RESTAURANTE;
    
    // Carregar dados do Firebase
    const data = await carregarDadosFirebase();
    
    if (data.produtos) produtos = data.produtos;
    if (data.categorias) categorias = data.categorias;
    if (data.adicionais) adicionaisPorCategoria = data.adicionais;
    if (data.config) configRestaurante = { ...CONFIG_PADRAO, ...data.config };
    
    // Se não tiver produtos, cria exemplos
    if (produtos.length === 0) {
        criarProdutosExemplo();
    }
    
    renderizarTodasCategorias();
    renderizarProdutos();
    renderizarCarrinho();
    verificarHorario();
    
    // Verificar horário a cada minuto
    setInterval(verificarHorario, 60000);
});

// ============================================
// ===== PRODUTOS DE EXEMPLO =================
// ============================================

function criarProdutosExemplo() {
    produtos = [
        { 
            id: 'prod1', 
            nome: 'X-Bacon Supremo', 
            descricao: 'Pão, carne 180g, bacon, queijo, alface, tomate', 
            preco: 32.90, 
            categoria: 'hamburguer', 
            imagem: '', 
            disponivel: true, 
            destaque: true 
        },
        { 
            id: 'prod2', 
            nome: 'X-Salada', 
            descricao: 'Pão, carne, queijo, alface, tomate', 
            preco: 25.90, 
            categoria: 'hamburguer', 
            imagem: '', 
            disponivel: true, 
            destaque: false 
        },
        { 
            id: 'prod3', 
            nome: 'Pizza Calabresa', 
            descricao: 'Molho, mussarela, calabresa, cebola', 
            preco: 45.00, 
            categoria: 'pizza', 
            imagem: '', 
            disponivel: true, 
            destaque: true, 
            sabores: ['Calabresa', 'Portuguesa', 'Mussarela', 'Marguerita', 'Frango com Catupiry'] 
        },
        { 
            id: 'prod4', 
            nome: 'Refeição Executiva', 
            descricao: 'Arroz, feijão, bife, salada', 
            preco: 28.90, 
            categoria: 'refeicao', 
            imagem: '', 
            disponivel: true, 
            destaque: false 
        },
        { 
            id: 'prod5', 
            nome: 'Batata Frita', 
            descricao: 'Porção de batata frita crocante', 
            preco: 15.00, 
            categoria: 'porcao', 
            imagem: '', 
            disponivel: true, 
            destaque: false 
        },
        { 
            id: 'prod6', 
            nome: 'Coca-Cola 2L', 
            descricao: 'Refrigerante Coca-Cola 2 litros', 
            preco: 12.00, 
            categoria: 'bebidas', 
            imagem: '', 
            disponivel: true, 
            destaque: false 
        }
    ];
    
    salvarProdutosFirebase(produtos);
}

// ============================================
// ===== RENDERIZAÇÃO DE CATEGORIAS ==========
// ============================================

function renderizarTodasCategorias() {
    const container = document.getElementById('categoriasTabs');
    container.innerHTML = '';
    
    // Tab "Todos"
    const tabTodos = document.createElement('div');
    tabTodos.className = 'categoria-tab ativo';
    tabTodos.innerHTML = '📱 Todos';
    tabTodos.onclick = () => filtrarPorCategoria('todos');
    container.appendChild(tabTodos);
    
    categorias.forEach(cat => {
        const tab = document.createElement('div');
        tab.className = 'categoria-tab';
        tab.innerHTML = getIconeCategoria(cat) + ' ' + getNomeCategoria(cat);
        tab.onclick = () => filtrarPorCategoria(cat);
        container.appendChild(tab);
    });
}

function filtrarPorCategoria(categoria) {
    categoriaAtual = categoria;
    
    document.querySelectorAll('.categoria-tab').forEach(tab => {
        tab.classList.remove('ativo');
        if (tab.innerText.includes(categoria === 'todos' ? 'Todos' : getNomeCategoria(categoria))) {
            tab.classList.add('ativo');
        }
    });
    
    renderizarProdutos();
}

// ============================================
// ===== RENDERIZAÇÃO DE PRODUTOS ============
// ============================================

function renderizarProdutos() {
    const container = document.getElementById('produtosGrid');
    container.innerHTML = '';
    
    let produtosFiltrados = produtos;
    if (categoriaAtual !== 'todos') {
        produtosFiltrados = produtos.filter(p => p.categoria === categoriaAtual);
    }
    
    // Filtrar indisponíveis para cliente
    if (!adminLogado) {
        produtosFiltrados = produtosFiltrados.filter(p => p.disponivel !== false);
    }
    
    if (produtosFiltrados.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 50px; color: var(--cor-texto-claro); grid-column: 1/-1;">
                <i class="fas fa-utensils" style="font-size: 3rem; opacity: 0.5;"></i>
                <p>Nenhum produto encontrado nesta categoria</p>
            </div>
        `;
        return;
    }
    
    produtosFiltrados.forEach(produto => {
        const card = document.createElement('div');
        card.className = `produto-card ${!produto.disponivel ? 'indisponivel' : ''}`;
        
        const imagemUrl = produto.imagem || LOGO_PADRAO;
        
        card.innerHTML = `
            ${produto.destaque ? '<div class="badge-destaque">🔥 Destaque</div>' : ''}
            <img class="produto-img" src="${imagemUrl}" alt="${produto.nome}" onerror="this.src='${LOGO_PADRAO}'; this.classList.add('placeholder-img')">
            <div class="produto-info">
                <div class="produto-nome">${produto.nome}</div>
                <div class="produto-desc">${produto.descricao || ''}</div>
                <div class="produto-footer">
                    <span class="produto-preco">${formatarPreco(produto.preco)}</span>
                    <button class="btn-add" onclick="event.stopPropagation(); abrirModalProduto('${produto.id}')">+</button>
                </div>
            </div>
        `;
        
        card.onclick = () => abrirModalProduto(produto.id);
        container.appendChild(card);
    });
    
    renderizarDestaques();
}

function renderizarDestaques() {
    const section = document.getElementById('destaquesSection');
    const produtosDestaque = produtos.filter(p => p.destaque && p.disponivel);
    
    if (produtosDestaque.length > 0) {
        section.style.display = 'block';
        const grid = document.getElementById('destaquesGrid');
        grid.innerHTML = '';
        
        produtosDestaque.slice(0, 4).forEach(produto => {
            const card = document.createElement('div');
            card.className = 'produto-card';
            card.style.background = 'rgba(255,255,255,0.15)';
            card.style.backdropFilter = 'blur(10px)';
            
            const imagemUrl = produto.imagem || LOGO_PADRAO;
            
            card.innerHTML = `
                <img class="produto-img" src="${imagemUrl}" alt="${produto.nome}" style="height: 120px;" onerror="this.src='${LOGO_PADRAO}'">
                <div class="produto-info">
                    <div class="produto-nome" style="color: white;">${produto.nome}</div>
                    <div class="produto-preco" style="color: white;">${formatarPreco(produto.preco)}</div>
                    <button class="btn-add" style="background: white; color: var(--cor-primaria);" onclick="event.stopPropagation(); abrirModalProduto('${produto.id}')">+</button>
                </div>
            `;
            grid.appendChild(card);
        });
    } else {
        section.style.display = 'none';
    }
}

// ============================================
// ===== MODAL DE PRODUTO ====================
// ============================================

function abrirModalProduto(produtoId) {
    produtoSelecionado = produtos.find(p => p.id === produtoId);
    if (!produtoSelecionado) return;
    
    quantidadeSelecionada = 1;
    saboresSelecionados = [];
    adicionaisSelecionados = [];
    
    document.getElementById('modalProdutoNome').innerText = produtoSelecionado.nome;
    document.getElementById('modalProdutoDesc').innerText = produtoSelecionado.descricao || '';
    document.getElementById('modalProdutoPreco').innerHTML = formatarPreco(produtoSelecionado.preco);
    document.getElementById('quantidadeProduto').innerText = '1';
    document.getElementById('obsItem').value = '';
    
    const img = document.getElementById('modalProdutoImg');
    img.src = produtoSelecionado.imagem || LOGO_PADRAO;
    img.onerror = () => { img.src = LOGO_PADRAO; };
    
    // Sabores para pizza
    const saboresDiv = document.getElementById('saboresPizzaDiv');
    if (produtoSelecionado.categoria === 'pizza' && produtoSelecionado.sabores) {
        saboresDiv.style.display = 'block';
        const lista = document.getElementById('saboresLista');
        lista.innerHTML = '';
        produtoSelecionado.sabores.forEach(sabor => {
            const div = document.createElement('div');
            div.className = 'sabor-item';
            div.innerHTML = `
                <span>${sabor}</span>
                <input type="checkbox" value="${sabor}" onchange="toggleSaborPizza(this, '${sabor}')">
            `;
            lista.appendChild(div);
        });
    } else {
        saboresDiv.style.display = 'none';
    }
    
    // Adicionais da categoria
    const adicionaisDiv = document.getElementById('adicionaisDiv');
    const adicionaisCat = adicionaisPorCategoria[produtoSelecionado.categoria] || [];
    if (adicionaisCat.length > 0) {
        adicionaisDiv.style.display = 'block';
        const lista = document.getElementById('adicionaisLista');
        lista.innerHTML = '';
        adicionaisCat.forEach(adicional => {
            const div = document.createElement('div');
            div.className = 'adicional-item';
            div.innerHTML = `
                <span>${adicional.nome} ${adicional.preco > 0 ? `(+${formatarPreco(adicional.preco)})` : ''}</span>
                <input type="checkbox" value='${JSON.stringify(adicional)}' onchange="toggleAdicional(this, '${adicional.nome}', ${adicional.preco})">
            `;
            lista.appendChild(div);
        });
    } else {
        adicionaisDiv.style.display = 'none';
    }
    
    document.getElementById('modalProduto').style.display = 'flex';
}

function fecharModalProduto() {
    document.getElementById('modalProduto').style.display = 'none';
}

function toggleSaborPizza(checkbox, sabor) {
    if (checkbox.checked) {
        if (saboresSelecionados.length >= 2) {
            checkbox.checked = false;
            mostrarToast('Máximo 2 sabores por pizza', 'alerta');
            return;
        }
        saboresSelecionados.push(sabor);
    } else {
        saboresSelecionados = saboresSelecionados.filter(s => s !== sabor);
    }
}

function toggleAdicional(checkbox, nome, preco) {
    if (checkbox.checked) {
        adicionaisSelecionados.push({ nome, preco });
    } else {
        adicionaisSelecionados = adicionaisSelecionados.filter(a => a.nome !== nome);
    }
}

function aumentarQuantidade() {
    quantidadeSelecionada++;
    document.getElementById('quantidadeProduto').innerText = quantidadeSelecionada;
}

function diminuirQuantidade() {
    if (quantidadeSelecionada > 1) {
        quantidadeSelecionada--;
        document.getElementById('quantidadeProduto').innerText = quantidadeSelecionada;
    }
}

function adicionarAoCarrinho() {
    if (!produtoSelecionado) return;
    
    let precoFinal = produtoSelecionado.preco;
    
    // Adicionar preço dos adicionais
    adicionaisSelecionados.forEach(adicional => {
        precoFinal += adicional.preco;
    });
    
    const itemCarrinho = {
        id: produtoSelecionado.id + '-' + Date.now(),
        produtoId: produtoSelecionado.id,
        nome: produtoSelecionado.nome,
        precoUnitario: precoFinal,
        quantidade: quantidadeSelecionada,
        observacao: document.getElementById('obsItem').value,
        adicionais: [...adicionaisSelecionados],
        sabores: produtoSelecionado.categoria === 'pizza' ? [...saboresSelecionados] : []
    };
    
    carrinho.push(itemCarrinho);
    renderizarCarrinho();
    fecharModalProduto();
    mostrarToast(`${produtoSelecionado.nome} adicionado ao carrinho!`, 'sucesso');
}

// ============================================
// ===== RENDERIZAÇÃO DO CARRINHO ============
// ============================================

function renderizarCarrinho() {
    const container = document.getElementById('carrinhoContainer');
    
    if (carrinho.length === 0) {
        container.innerHTML = `
            <div class="carrinho-vazio">
                <i class="fas fa-shopping-basket" style="font-size: 3rem;"></i>
                <p>Seu carrinho está vazio</p>
            </div>
        `;
        document.getElementById('totalCarrinho').innerHTML = formatarPreco(0);
        return;
    }
    
    let total = 0;
    container.innerHTML = '';
    
    carrinho.forEach((item, idx) => {
        const subtotal = item.precoUnitario * item.quantidade;
        total += subtotal;
        
        const div = document.createElement('div');
        div.className = 'carrinho-item';
        
        let adicionaisHtml = '';
        if (item.adicionais && item.adicionais.length) {
            adicionaisHtml = `
                <div class="item-adicionais">
                    ➕ ${item.adicionais.map(a => `${a.nome}${a.preco > 0 ? ` (+${formatarPreco(a.preco)})` : ''}`).join(', ')}
                </div>
            `;
        }
        
        let saboresHtml = '';
        if (item.sabores && item.sabores.length) {
            saboresHtml = `
                <div class="item-adicionais">
                    🍕 Sabores: ${item.sabores.join(' e ')}
                </div>
            `;
        }
        
        div.innerHTML = `
            <div class="item-header">
                <span class="item-nome">${item.quantidade}x ${item.nome}</span>
                <span class="item-preco">${formatarPreco(subtotal)}</span>
            </div>
            ${saboresHtml}
            ${adicionaisHtml}
            ${item.observacao ? `<div class="item-obs">📝 ${item.observacao}</div>` : ''}
            <div class="item-footer">
                <div class="quantidade-control">
                    <button class="quantidade-btn" onclick="alterarQuantidade(${idx}, -1)">-</button>
                    <span>${item.quantidade}</span>
                    <button class="quantidade-btn" onclick="alterarQuantidade(${idx}, 1)">+</button>
                </div>
                <div class="item-actions">
                    <button class="btn-editar-item" onclick="editarItemCarrinho(${idx})"><i class="fas fa-edit"></i></button>
                    <button class="btn-duplicar-item" onclick="duplicarItemCarrinho(${idx})"><i class="fas fa-copy"></i></button>
                    <button class="btn-remover-item" onclick="removerItemCarrinho(${idx})"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `;
        container.appendChild(div);
    });
    
    document.getElementById('totalCarrinho').innerHTML = formatarPreco(total);
}

function alterarQuantidade(index, delta) {
    const novoQtd = carrinho[index].quantidade + delta;
    if (novoQtd >= 1) {
        carrinho[index].quantidade = novoQtd;
        renderizarCarrinho();
    }
}

function removerItemCarrinho(index) {
    const item = carrinho[index];
    carrinho.splice(index, 1);
    renderizarCarrinho();
    mostrarToast(`${item.nome} removido do carrinho`, 'info');
}

function duplicarItemCarrinho(index) {
    const item = JSON.parse(JSON.stringify(carrinho[index]));
    item.id = item.produtoId + '-' + Date.now();
    carrinho.push(item);
    renderizarCarrinho();
    mostrarToast('Item duplicado!', 'sucesso');
}

function editarItemCarrinho(index) {
    const item = carrinho[index];
    abrirModalProduto(item.produtoId);
    
    // Pré-selecionar valores (a implementar)
    mostrarToast('Edição em desenvolvimento', 'info');
}

// ============================================
// ===== ATALHO SECRETO - DUPLO CLIQUE NO LOGO
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // Procura o elemento do logo (área que contém a imagem e o nome)
    const logoArea = document.querySelector('.logo-area');
    
    if (logoArea) {
        logoArea.style.cursor = 'pointer';
        
        // Para desktop: duplo clique
        logoArea.addEventListener('dblclick', function(e) {
            e.stopPropagation();
            console.log('🍔 Duplo clique no logo - Abrindo login admin...');
            
            if (typeof abrirModalLogin === 'function') {
                abrirModalLogin();
            } else {
                console.error('❌ Função abrirModalLogin não encontrada');
            }
        });
        
        // Para mobile: duplo toque
        let toques = 0;
        let timeout;
        
        logoArea.addEventListener('touchstart', function(e) {
            toques++;
            
            if (toques === 1) {
                timeout = setTimeout(() => {
                    toques = 0;
                }, 300);
            } else if (toques === 2) {
                clearTimeout(timeout);
                e.preventDefault();
                e.stopPropagation();
                console.log('📱 Duplo toque no logo - Abrindo login admin...');
                
                if (typeof abrirModalLogin === 'function') {
                    abrirModalLogin();
                }
                toques = 0;
            }
        });
        
        console.log('✅ Atalho secreto ativado: Duplo clique/toque no logo abre o admin');
    } else {
        console.warn('⚠️ Elemento .logo-area não encontrado');
    }
});

// ============================================
// ===== FUNÇÃO TOGGLE TEMA ESCURO/CLARO =====
// ============================================

function toggleTema() {
    const html = document.documentElement;
    const themeIcon = document.getElementById('themeIcon');
    const themeText = document.getElementById('themeText');
    const currentTheme = html.getAttribute('data-theme');
    
    if (currentTheme === 'dark') {
        // Mudar para tema claro
        html.removeAttribute('data-theme');
        if (themeIcon) themeIcon.className = 'fas fa-moon';
        if (themeText) themeText.textContent = 'Escuro';
        localStorage.setItem('tema', 'claro');
    } else {
        // Mudar para tema escuro
        html.setAttribute('data-theme', 'dark');
        if (themeIcon) themeIcon.className = 'fas fa-sun';
        if (themeText) themeText.textContent = 'Claro';
        localStorage.setItem('tema', 'escuro');
    }
}

// Carregar tema salvo ao iniciar
function carregarTemaSalvo() {
    const temaSalvo = localStorage.getItem('tema');
    const html = document.documentElement;
    const themeIcon = document.getElementById('themeIcon');
    const themeText = document.getElementById('themeText');
    
    if (temaSalvo === 'escuro') {
        html.setAttribute('data-theme', 'dark');
        if (themeIcon) themeIcon.className = 'fas fa-sun';
        if (themeText) themeText.textContent = 'Claro';
    }
}

// Inicializar tema ao carregar a página
document.addEventListener('DOMContentLoaded', function() {
    carregarTemaSalvo();
});

// Exportar função global
window.toggleTema = toggleTema;

// ============================================
// ===== VERIFICAÇÃO DE HORÁRIO ==============
// ============================================

function verificarHorario() {
    const agora = new Date();
    const horaAtual = agora.getHours() * 60 + agora.getMinutes();
    const [hAbre, mAbre] = configRestaurante.horaAbre.split(':').map(Number);
    const [hFecha, mFecha] = configRestaurante.horaFecha.split(':').map(Number);
    
    const abertura = hAbre * 60 + mAbre;
    const fechamento = hFecha * 60 + mFecha;
    
    let aberto = false;
    if (fechamento > abertura) {
        aberto = (horaAtual >= abertura && horaAtual <= fechamento);
    } else {
        aberto = (horaAtual >= abertura || horaAtual <= fechamento);
    }
    
    const statusDiv = document.getElementById('statusHorarioHeader');
    if (aberto) {
        statusDiv.innerHTML = '🟢 ABERTO';
        statusDiv.className = 'status-horario aberto';
    } else {
        statusDiv.innerHTML = '🔴 FECHADO';
        statusDiv.className = 'status-horario fechado';
    }
    
    return aberto;
}

// ============================================
// ===== EXPOR FUNÇÕES GLOBALMENTE ===========
// ============================================

window.abrirModalProduto = abrirModalProduto;
window.fecharModalProduto = fecharModalProduto;
window.toggleSaborPizza = toggleSaborPizza;
window.toggleAdicional = toggleAdicional;
window.aumentarQuantidade = aumentarQuantidade;
window.diminuirQuantidade = diminuirQuantidade;
window.adicionarAoCarrinho = adicionarAoCarrinho;
window.alterarQuantidade = alterarQuantidade;
window.removerItemCarrinho = removerItemCarrinho;
window.duplicarItemCarrinho = duplicarItemCarrinho;
window.editarItemCarrinho = editarItemCarrinho;
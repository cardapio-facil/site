// ============================================
// ===== VARIÁVEIS GLOBAIS ===================
// ============================================

let produtos = [];
let categorias = [...CATEGORIAS_PADRAO];
let adicionaisPorCategoria = {};
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
    carregarTemaSalvo();
    
    const data = await carregarDadosFirebase();
    
    if (data.produtos) produtos = data.produtos;
    if (data.categorias) categorias = data.categorias;
    if (data.adicionais) adicionaisPorCategoria = data.adicionais;
    if (data.config) configRestaurante = { ...CONFIG_PADRAO, ...data.config };
    
    if (produtos.length === 0) {
        criarProdutosExemplo();
    }
    
    atualizarAlturaHeader();
    window.addEventListener('resize', debounce(atualizarAlturaHeader, 200));
    
    renderizarTodasCategorias();
    renderizarProdutos();
    renderizarCarrinho();
    verificarHorario();
    setupAtalhoSecreto();
    
    setInterval(verificarHorario, 60000);
});

// ============================================
// ===== HELPERS ==============================
// ============================================

function debounce(fn, delay) {
    let t;
    return (...args) => {
        clearTimeout(t);
        t = setTimeout(() => fn(...args), delay);
    };
}

function atualizarAlturaHeader() {
    const header = document.querySelector('.header');
    if (header) {
        document.documentElement.style.setProperty('--header-height', header.offsetHeight + 'px');
    }
}

// ============================================
// ===== PRODUTOS DE EXEMPLO =================
// ============================================

function criarProdutosExemplo() {
    produtos = [
        { id: 'prod1', nome: 'X-Bacon Supremo', descricao: 'Pão, carne 180g, bacon, queijo, alface, tomate', preco: 32.90, categoria: 'hamburguer', imagem: '', disponivel: true, destaque: true },
        { id: 'prod2', nome: 'X-Salada', descricao: 'Pão, carne, queijo, alface, tomate', preco: 25.90, categoria: 'hamburguer', imagem: '', disponivel: true, destaque: false },
        { id: 'prod3', nome: 'Pizza Calabresa', descricao: 'Molho, mussarela, calabresa, cebola', preco: 45.00, categoria: 'pizza', imagem: '', disponivel: true, destaque: true, sabores: ['Calabresa', 'Portuguesa', 'Mussarela', 'Marguerita', 'Frango com Catupiry'] },
        { id: 'prod4', nome: 'Refeição Executiva', descricao: 'Arroz, feijão, bife, salada', preco: 28.90, categoria: 'refeicao', imagem: '', disponivel: true, destaque: false },
        { id: 'prod5', nome: 'Batata Frita', descricao: 'Porção de batata frita crocante', preco: 15.00, categoria: 'porcao', imagem: '', disponivel: true, destaque: false },
        { id: 'prod6', nome: 'Coca-Cola 2L', descricao: 'Refrigerante Coca-Cola 2 litros', preco: 12.00, categoria: 'bebidas', imagem: '', disponivel: true, destaque: false }
    ];
    salvarProdutosFirebase(produtos);
}

// ============================================
// ===== RENDERIZAÇÃO DE CATEGORIAS ==========
// ============================================

function renderizarTodasCategorias() {
    const container = document.getElementById('categoriasTabs');
    container.innerHTML = '';
    
    criarWrapperCategorias(container);
    
    // Tab "Todos"
    const tabTodos = document.createElement('div');
    tabTodos.className = 'categoria-tab ativo';
    tabTodos.innerHTML = '📱 Todos';
    tabTodos.onclick = () => filtrarPorCategoria('todos', tabTodos);
    container.appendChild(tabTodos);
    
    categorias.forEach(cat => {
        const tab = document.createElement('div');
        tab.className = 'categoria-tab';
        tab.innerHTML = getIconeCategoria(cat) + ' ' + getNomeCategoria(cat);
        tab.onclick = () => filtrarPorCategoria(cat, tab);
        container.appendChild(tab);
    });
    
    verificarSetinhas();
    container.addEventListener('scroll', debounce(verificarSetinhas, 100));
    window.addEventListener('resize', debounce(verificarSetinhas, 200));
}

function criarWrapperCategorias(container) {
    let wrapper = document.querySelector('.categorias-wrapper');
    
    if (!wrapper) {
        wrapper = document.createElement('div');
        wrapper.className = 'categorias-wrapper';
        
        const btnLeft = document.createElement('button');
        btnLeft.className = 'categoria-nav-btn categoria-nav-left';
        btnLeft.innerHTML = '◀';
        btnLeft.onclick = () => scrollCategorias(-200);
        
        const btnRight = document.createElement('button');
        btnRight.className = 'categoria-nav-btn categoria-nav-right';
        btnRight.innerHTML = '▶';
        btnRight.onclick = () => scrollCategorias(200);
        
        container.parentNode.insertBefore(wrapper, container);
        wrapper.appendChild(btnLeft);
        wrapper.appendChild(container);
        wrapper.appendChild(btnRight);
    }
}

function scrollCategorias(distancia) {
    const container = document.getElementById('categoriasTabs');
    container.scrollBy({
        left: distancia,
        behavior: 'smooth'
    });
    setTimeout(verificarSetinhas, 400);
}

function verificarSetinhas() {
    const container = document.getElementById('categoriasTabs');
    const wrapper = document.querySelector('.categorias-wrapper');
    if (!container || !wrapper) return;
    
    const btnLeft = wrapper.querySelector('.categoria-nav-left');
    const btnRight = wrapper.querySelector('.categoria-nav-right');
    if (!btnLeft || !btnRight) return;
    
    const podeScrollar = container.scrollWidth > container.clientWidth + 2;
    const noInicio = container.scrollLeft <= 2;
    const noFim = container.scrollLeft + container.clientWidth >= container.scrollWidth - 2;
    
    if (podeScrollar && !noInicio) {
        btnLeft.classList.add('visivel');
    } else {
        btnLeft.classList.remove('visivel');
    }
    
    if (podeScrollar && !noFim) {
        btnRight.classList.add('visivel');
    } else {
        btnRight.classList.remove('visivel');
    }
}

function filtrarPorCategoria(categoria, tabElement = null) {
    categoriaAtual = categoria;
    
    document.querySelectorAll('.categoria-tab').forEach(tab => {
        tab.classList.remove('ativo');
    });
    
    if (tabElement) {
        tabElement.classList.add('ativo');
    }
    
    // Centralizar tab
    if (tabElement) {
        const container = document.getElementById('categoriasTabs');
        const containerRect = container.getBoundingClientRect();
        const tabRect = tabElement.getBoundingClientRect();
        
        const tabCentro = tabRect.left - containerRect.left + (tabRect.width / 2);
        const containerCentro = containerRect.width / 2;
        const scrollPara = container.scrollLeft + tabCentro - containerCentro;
        
        container.scrollTo({
            left: Math.max(0, scrollPara),
            behavior: 'smooth'
        });
        
        setTimeout(verificarSetinhas, 400);
    }
    
    renderizarProdutos();
    
    // Scroll até produtos
    const produtosGrid = document.getElementById('produtosGrid');

if (produtosGrid) {
    requestAnimationFrame(() => {
        produtosGrid.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    });

}
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
    
    // Atualizar sticky mobile
    initMobileFixes();
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
    mostrarToast('Edição em desenvolvimento', 'info');
}

// ============================================
// ===== ATALHO SECRETO ======================
// ============================================

function setupAtalhoSecreto() {
    const logoArea = document.querySelector('.logo-area');
    if (!logoArea) return;
    
    logoArea.style.cursor = 'pointer';
    
    logoArea.addEventListener('dblclick', function(e) {
        e.stopPropagation();
        if (typeof abrirModalLogin === 'function') {
            abrirModalLogin();
        }
    });
    
    let toques = 0;
    let timeout;
    
    logoArea.addEventListener('touchstart', function(e) {
        toques++;
        if (toques === 1) {
            timeout = setTimeout(() => { toques = 0; }, 300);
        } else if (toques === 2) {
            clearTimeout(timeout);
            e.preventDefault();
            e.stopPropagation();
            if (typeof abrirModalLogin === 'function') {
                abrirModalLogin();
            }
            toques = 0;
        }
    });
}

// ============================================
// ===== TOGGLE TEMA =========================
// ============================================

function toggleTema() {
    const html = document.documentElement;
    const themeIcon = document.getElementById('themeIcon');
    const themeText = document.getElementById('themeText');
    const currentTheme = html.getAttribute('data-theme');
    
    if (currentTheme === 'dark') {
        html.removeAttribute('data-theme');
        if (themeIcon) themeIcon.className = 'fas fa-moon';
        if (themeText) themeText.textContent = 'Escuro';
        localStorage.setItem('tema', 'claro');
    } else {
        html.setAttribute('data-theme', 'dark');
        if (themeIcon) themeIcon.className = 'fas fa-sun';
        if (themeText) themeText.textContent = 'Claro';
        localStorage.setItem('tema', 'escuro');
    }
    
    initMobileFixes();
}

function carregarTemaSalvo() {
    const temaSalvo = localStorage.getItem('tema');
    if (temaSalvo === 'escuro') {
        document.documentElement.setAttribute('data-theme', 'dark');
    }
}

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
// ===== FIX STICKY MOBILE ====================
// ============================================

function initMobileFixes() {
    const isMobile = window.innerWidth <= 900;
    
    const header = document.querySelector('.header');
    const categoriasWrapper = document.querySelector('.categorias-wrapper');
    
    if (!header || !categoriasWrapper) return;
    
    if (!isMobile) {
        // Reset para desktop (usa CSS sticky)
        header.style.position = '';
        header.style.top = '';
        header.style.left = '';
        header.style.right = '';
        header.style.zIndex = '';
        header.style.width = '';
        
        categoriasWrapper.style.position = '';
        categoriasWrapper.style.top = '';
        categoriasWrapper.style.left = '';
        categoriasWrapper.style.right = '';
        categoriasWrapper.style.zIndex = '';
        categoriasWrapper.style.width = '';
        
        document.body.style.paddingTop = '';
        return;
    }
    
    // Mobile: usa position fixed (JavaScript)
    header.style.position = 'fixed';
    header.style.top = '0';
    header.style.left = '0';
    header.style.right = '0';
    header.style.width = '100%';
    header.style.zIndex = '999';
    
    const headerHeight = header.offsetHeight;
    
    categoriasWrapper.style.position = 'fixed';
    categoriasWrapper.style.top = headerHeight + 'px';
    categoriasWrapper.style.left = '0';
    categoriasWrapper.style.right = '0';
    categoriasWrapper.style.width = '100%';
    categoriasWrapper.style.zIndex = '998';
    
    // Empurra o conteúdo pra não ficar escondido atrás
    document.body.style.paddingTop = (headerHeight + categoriasWrapper.offsetHeight + 10) + 'px';
}

// Roda ao carregar
window.addEventListener('load', initMobileFixes);

// Roda ao redimensionar
window.addEventListener('resize', debounce(initMobileFixes, 200));

// Também roda após renderizar produtos
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(initMobileFixes, 500);
});

// ============================================
// ===== EXPOR FUNÇÕES GLOBALMENTE ===========
// ============================================

window.toggleTema = toggleTema;
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
window.initMobileFixes = initMobileFixes;

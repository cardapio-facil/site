// ============================================
// ===== VARIÁVEIS GLOBAIS ===================
// ============================================

let produtos = [];
let categorias = [...CATEGORIAS_PADRAO];
let adicionaisPorCategoria = {};
let carrinho = [];
let configRestaurante = { ...CONFIG_PADRAO };
let montagens = [...MONTAGENS_PADRAO];
let categoriasVisiveis = { ...CATEGORIAS_VISIVEIS_PADRAO };

let adminLogado = false;
let nivelAcesso = null;
let produtoSelecionado = null;
let produtoEditando = null;

let quantidadeSelecionada = 1;
let saboresSelecionados = [];
let adicionaisSelecionados = [];

let categoriaAtual = 'todos';

// 🛠️ Variáveis para montagem
let montagemSelecionada = null;
let tamanhoSelecionado = null;
let itensMontagemSelecionados = [];

// ============================================
// ===== INICIALIZAÇÃO =======================
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
    document.getElementById('restauranteNome').innerText = NOME_RESTAURANTE;
    carregarTemaSalvo();
    window.editandoCarrinhoIndex = null;
    
    const data = await carregarDadosFirebase();
    
    if (data.produtos) produtos = data.produtos;
    if (data.categorias) categorias = data.categorias;
    if (data.adicionais) adicionaisPorCategoria = data.adicionais;
    if (data.config) configRestaurante = { ...CONFIG_PADRAO, ...data.config };
    if (data.categoriasVisiveis) categoriasVisiveis = data.categoriasVisiveis;
    if (data.montagens) montagens = data.montagens;
    
    if (produtos.length === 0) {
        criarProdutosExemplo();
    }
    
    if (montagens.length === 0) {
        montagens = [...MONTAGENS_PADRAO];
        salvarMontagensFirebase(montagens);
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
        { id: 'prod3', nome: 'Pizza Grande', descricao: 'Pizza grande 8 fatias - Escolha até 2 sabores', preco: 45.00, categoria: 'pizza', imagem: '', disponivel: true, destaque: true },
        { id: 'prod4', nome: 'Pizza Calabresa', descricao: 'Molho, mussarela, calabresa, cebola', preco: 48.00, categoria: 'pizza', imagem: '', disponivel: true, destaque: false },
        { id: 'prod5', nome: 'Pizza Portuguesa', descricao: 'Molho, mussarela, presunto, ovos, cebola, azeitona', preco: 52.00, categoria: 'pizza', imagem: '', disponivel: true, destaque: false },
        { id: 'prod6', nome: 'Pizza Frango com Catupiry', descricao: 'Molho, mussarela, frango, catupiry', preco: 55.00, categoria: 'pizza', imagem: '', disponivel: true, destaque: true },
        { id: 'prod7', nome: 'Pizza Marguerita', descricao: 'Molho, mussarela, tomate, manjericão', preco: 50.00, categoria: 'pizza', imagem: '', disponivel: true, destaque: false },
        { id: 'prod8', nome: 'Refeição Executiva', descricao: 'Arroz, feijão, bife, salada', preco: 28.90, categoria: 'refeicao', imagem: '', disponivel: true, destaque: false },
        { id: 'prod9', nome: 'Batata Frita', descricao: 'Porção de batata frita crocante', preco: 15.00, categoria: 'porcao', imagem: '', disponivel: true, destaque: false },
        { id: 'prod10', nome: 'Coca-Cola 2L', descricao: 'Refrigerante Coca-Cola 2 litros', preco: 12.00, categoria: 'bebidas', imagem: '', disponivel: true, destaque: false }
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
        if (!adminLogado && categoriasVisiveis[cat] === false) return;
        
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
    
    const produtosGrid = document.getElementById('produtosGrid');
    if (produtosGrid) {
        produtosGrid.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest'
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
    
    // 🛠️ Busca montagens da categoria atual
    let montagensFiltradas = [];
    if (categoriaAtual === 'todos') {
        montagensFiltradas = montagens.filter(m => m.disponivel !== false);
    } else {
        montagensFiltradas = montagens.filter(m => m.categoria === categoriaAtual && m.disponivel !== false);
    }
    
    if (!adminLogado) {
        montagensFiltradas = montagensFiltradas.filter(m => m.disponivel !== false);
    }
    
    if (produtosFiltrados.length === 0 && montagensFiltradas.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 50px; color: var(--cor-texto-claro); grid-column: 1/-1;">
                <i class="fas fa-utensils" style="font-size: 3rem; opacity: 0.5;"></i>
                <p>Nenhum produto encontrado nesta categoria</p>
            </div>
        `;
        return;
    }
    
    // Renderiza montagens primeiro (com selo "Você Escolhe")
    montagensFiltradas.forEach(montagem => {
        const card = document.createElement('div');
        card.className = 'produto-card montagem-card';
        
        const imagemUrl = montagem.imagem || LOGO_PADRAO;
        const menorPreco = montagem.precoBase;
        
        card.innerHTML = `
            <div class="badge-montagem">🧩 Você Escolhe</div>
            ${montagem.destaque ? '<div class="badge-destaque direita">🔥 Destaque</div>' : ''}
            <img class="produto-img" src="${imagemUrl}" alt="${montagem.nome}" onerror="this.src='${LOGO_PADRAO}';">
            <div class="produto-info">
                <div class="produto-nome">${montagem.nome}</div>
                <div class="produto-desc">${montagem.descricao || ''}</div>
                <div class="produto-footer">
                    <span class="produto-preco">A partir de ${formatarPreco(menorPreco)}</span>
                    <button class="btn-add btn-montagem" onclick="event.stopPropagation(); abrirModalMontagem('${montagem.id}')">+</button>
                </div>
            </div>
        `;
        
        card.onclick = () => abrirModalMontagem(montagem.id);
        container.appendChild(card);
    });
    
    // Renderiza produtos normais
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
    initMobileFixes();
}

function renderizarDestaques() {
    const section = document.getElementById('destaquesSection');
    const produtosDestaque = produtos.filter(p => p.destaque && p.disponivel);
    const montagensDestaque = montagens.filter(m => m.destaque && m.disponivel);
    
    const totalDestaques = produtosDestaque.length + montagensDestaque.length;
    
    if (totalDestaques > 0) {
        section.style.display = 'block';
        const grid = document.getElementById('destaquesGrid');
        grid.innerHTML = '';
        
        // Montagens em destaque
        montagensDestaque.slice(0, 2).forEach(montagem => {
            const card = document.createElement('div');
            card.className = 'produto-card';
            card.style.background = 'rgba(255,255,255,0.15)';
            card.style.backdropFilter = 'blur(10px)';
            
            const imagemUrl = montagem.imagem || LOGO_PADRAO;
            
            card.innerHTML = `
                <div class="badge-montagem" style="font-size: 0.6rem; padding: 2px 8px;">🧩 Você Escolhe</div>
                <img class="produto-img" src="${imagemUrl}" alt="${montagem.nome}" style="height: 120px;" onerror="this.src='${LOGO_PADRAO}'">
                <div class="produto-info">
                    <div class="produto-nome" style="color: white;">${montagem.nome}</div>
                    <div class="produto-preco" style="color: white;">A partir de ${formatarPreco(montagem.precoBase)}</div>
                    <button class="btn-add" style="background: white; color: var(--cor-primaria);" onclick="event.stopPropagation(); abrirModalMontagem('${montagem.id}')">+</button>
                </div>
            `;
            grid.appendChild(card);
        });
        
        // Produtos em destaque
        produtosDestaque.slice(0, 4 - montagensDestaque.length).forEach(produto => {
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
// ===== MODAL DE PRODUTO (PIZZA) ============
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
    if (produtoSelecionado.categoria === 'pizza') {
        saboresDiv.style.display = 'block';
        const lista = document.getElementById('saboresLista');
        lista.innerHTML = '';
        
        const pizzasDisponiveis = produtos.filter(p => 
            p.categoria === 'pizza' && 
            p.disponivel !== false && 
            p.id !== produtoSelecionado.id
        );
        
        if (pizzasDisponiveis.length === 0) {
            lista.innerHTML = '<p style="color: #c62828;">⚠️ Nenhum sabor disponível no momento</p>';
        } else {
            pizzasDisponiveis.forEach(pizza => {
                const div = document.createElement('div');
                div.className = 'sabor-item';
                div.innerHTML = `
                    <span>🍕 ${pizza.nome} - <strong>${formatarPreco(pizza.preco)}</strong></span>
                    <input type="checkbox" 
                           value="${pizza.id}" 
                           data-nome="${pizza.nome}" 
                           data-preco="${pizza.preco}" 
                           onchange="toggleSaborPizza(this, '${pizza.id}', '${pizza.nome.replace(/'/g, "\\'")}', ${pizza.preco})">
                `;
                div.style.cursor = 'pointer';
div.onclick = function(e) {
    // Não dispara se clicou no próprio checkbox
    if (e.target.tagName !== 'INPUT') {
        const cb = this.querySelector('input[type="checkbox"]');
        cb.checked = !cb.checked;
        cb.dispatchEvent(new Event('change'));
    }
};
                lista.appendChild(div);
            });
        }
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
            div.style.cursor = 'pointer';
div.onclick = function(e) {
    if (e.target.tagName !== 'INPUT') {
        const cb = this.querySelector('input[type="checkbox"]');
        cb.checked = !cb.checked;
        cb.dispatchEvent(new Event('change'));
    }
};
            lista.appendChild(div);
        });
    } else {
        adicionaisDiv.style.display = 'none';
    }
    
    // Esconde seção de montagem
    document.getElementById('montagemDiv').style.display = 'none';
    
    document.getElementById('modalProduto').style.display = 'flex';
}

function fecharModalProduto() {
    document.getElementById('modalProduto').style.display = 'none';
    window.editandoCarrinhoIndex = null;
    
    const btnAdicionar = document.querySelector('#modalProduto .btn-adicionar-carrinho');
    if (btnAdicionar) {
        btnAdicionar.innerHTML = '<i class="fas fa-cart-plus"></i> Adicionar ao Carrinho';
    }
}

function toggleSaborPizza(checkbox, pizzaId, pizzaNome, pizzaPreco) {
    if (checkbox.checked) {
        if (saboresSelecionados.length >= 2) {
            checkbox.checked = false;
            mostrarToast('Máximo 2 sabores', 'Você já escolheu 2 sabores para meio a meio', 'alerta');
            return;
        }
        saboresSelecionados.push({ id: pizzaId, nome: pizzaNome, preco: pizzaPreco });
    } else {
        saboresSelecionados = saboresSelecionados.filter(s => s.id !== pizzaId);
    }
    atualizarPrecoPizza();
}

function atualizarPrecoPizza() {
    if (!produtoSelecionado || produtoSelecionado.categoria !== 'pizza') return;
    
    let precoBase = produtoSelecionado.preco;
    
    if (saboresSelecionados.length > 0) {
        const maiorPrecoSabor = Math.max(...saboresSelecionados.map(s => s.preco));
        precoBase = Math.max(precoBase, maiorPrecoSabor);
    }
    
    let precoFinal = precoBase;
    adicionaisSelecionados.forEach(adicional => {
        precoFinal += adicional.preco;
    });
    
    document.getElementById('modalProdutoPreco').innerHTML = formatarPreco(precoFinal);
}

function toggleAdicional(checkbox, nome, preco) {
    if (checkbox.checked) {
        adicionaisSelecionados.push({ nome, preco });
    } else {
        adicionaisSelecionados = adicionaisSelecionados.filter(a => a.nome !== nome);
    }
    
    if (produtoSelecionado && produtoSelecionado.categoria === 'pizza') {
        atualizarPrecoPizza();
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

// ============================================
// ===== MODAL DE MONTAGEM ===================
// ============================================

function abrirModalMontagem(montagemId) {
    montagemSelecionada = montagens.find(m => m.id === montagemId);
    if (!montagemSelecionada) return;
    
    quantidadeSelecionada = 1;
    tamanhoSelecionado = montagemSelecionada.tamanhos?.[0] || null;
    itensMontagemSelecionados = [];
    
    document.getElementById('modalProdutoNome').innerText = montagemSelecionada.nome;
    document.getElementById('modalProdutoDesc').innerText = montagemSelecionada.descricao || '';
    document.getElementById('quantidadeProduto').innerText = '1';
    document.getElementById('obsItem').value = '';
    
    const img = document.getElementById('modalProdutoImg');
    img.src = montagemSelecionada.imagem || LOGO_PADRAO;
    img.onerror = () => { img.src = LOGO_PADRAO; };
    
    // Esconde seções de pizza
    document.getElementById('saboresPizzaDiv').style.display = 'none';
    document.getElementById('adicionaisDiv').style.display = 'none';
    
    // Mostra seção de montagem
    const montagemDiv = document.getElementById('montagemDiv');
    montagemDiv.style.display = 'block';
    montagemDiv.innerHTML = '';
    
    // Tamanhos
    if (montagemSelecionada.tamanhos && montagemSelecionada.tamanhos.length > 0) {
        const tamanhoSection = document.createElement('div');
        tamanhoSection.className = 'montagem-section';
        tamanhoSection.innerHTML = '<h4>📏 Escolha o tamanho</h4>';
        
        const tamanhoLista = document.createElement('div');
        tamanhoLista.className = 'montagem-lista';
        
        montagemSelecionada.tamanhos.forEach((tamanho, idx) => {
            const div = document.createElement('div');
            div.className = 'montagem-item-radio';
            div.innerHTML = `
                <input type="radio" name="tamanhoMontagem" value="${tamanho.id}" 
                       ${idx === 0 ? 'checked' : ''} 
                       onchange="selecionarTamanho('${tamanho.id}')">
                <span>${tamanho.nome} ${tamanho.preco > 0 ? `(+${formatarPreco(tamanho.preco)})` : ''}</span>
            `;
            div.style.cursor = 'pointer';
div.onclick = function(e) {
    if (e.target.tagName !== 'INPUT') {
        const radio = this.querySelector('input[type="radio"]');
        radio.checked = true;
        radio.dispatchEvent(new Event('change'));
    }
};
            tamanhoLista.appendChild(div);
        });
        
        tamanhoSection.appendChild(tamanhoLista);
        montagemDiv.appendChild(tamanhoSection);
    }
    
    // Grupos
    montagemSelecionada.grupos.forEach(grupo => {
        const grupoSection = document.createElement('div');
        grupoSection.className = 'montagem-section';
        
        const obrigatorio = grupo.obrigatorio ? ' *' : '';
        const limite = grupo.limite > 1 ? ` (escolha até ${grupo.limite})` : ' (escolha 1)';
        
        grupoSection.innerHTML = `<h4>${grupo.nome}${obrigatorio}<small>${limite}</small></h4>`;
        
        const itensLista = document.createElement('div');
        itensLista.className = 'montagem-lista';
        
        grupo.itens.forEach(item => {
            if (item.disponivel === false) return;
            
            const div = document.createElement('div');
            div.className = 'montagem-item';
            div.innerHTML = `
                <input type="checkbox" 
                       value="${item.id}" 
                       data-grupo="${grupo.id}"
                       data-nome="${item.nome}" 
                       data-preco="${item.preco}" 
                       onchange="toggleItemMontagem(this, '${grupo.id}', '${item.id}', '${item.nome.replace(/'/g, "\\'")}', ${item.preco}, ${grupo.limite})">
                <span>${item.nome} ${item.preco > 0 ? `(+${formatarPreco(item.preco)})` : ''}</span>
            `;
            div.style.cursor = 'pointer';
div.onclick = function(e) {
    if (e.target.tagName !== 'INPUT') {
        const cb = this.querySelector('input[type="checkbox"]');
        cb.checked = !cb.checked;
        cb.dispatchEvent(new Event('change'));
    }
};
            itensLista.appendChild(div);
        });
        
        grupoSection.appendChild(itensLista);
        montagemDiv.appendChild(grupoSection);
    });
    
    atualizarPrecoMontagem();
    document.getElementById('modalProduto').style.display = 'flex';
}

function selecionarTamanho(tamanhoId) {
    tamanhoSelecionado = montagemSelecionada.tamanhos.find(t => t.id === tamanhoId);
    atualizarPrecoMontagem();
}

function toggleItemMontagem(checkbox, grupoId, itemId, itemNome, itemPreco, limite) {
    const grupo = montagemSelecionada.grupos.find(g => g.id === grupoId);
    
    if (checkbox.checked) {
        // Conta quantos itens desse grupo já estão selecionados
        const selecionadosNoGrupo = itensMontagemSelecionados.filter(i => i.grupoId === grupoId);
        
        if (selecionadosNoGrupo.length >= limite) {
            checkbox.checked = false;
            mostrarToast(`Limite atingido`, `Você só pode escolher até ${limite} item(ns) em "${grupo.nome}"`, 'alerta');
            return;
        }
        
        itensMontagemSelecionados.push({ grupoId, itemId, nome: itemNome, preco: itemPreco });
    } else {
        itensMontagemSelecionados = itensMontagemSelecionados.filter(i => i.itemId !== itemId);
    }
    
    atualizarPrecoMontagem();
}

function atualizarPrecoMontagem() {
    if (!montagemSelecionada) return;
    
    let preco = montagemSelecionada.precoBase;
    
    if (tamanhoSelecionado) {
        preco += tamanhoSelecionado.preco;
    }
    
    itensMontagemSelecionados.forEach(item => {
        preco += item.preco || 0;
    });
    
    document.getElementById('modalProdutoPreco').innerHTML = formatarPreco(preco);
}

// ============================================
// ===== ADICIONAR AO CARRINHO ===============
// ============================================

function adicionarAoCarrinho() {
    // 🛠️ Se for montagem
    if (montagemSelecionada) {
        // Valida grupos obrigatórios
        for (const grupo of montagemSelecionada.grupos) {
            if (grupo.obrigatorio) {
                const selecionados = itensMontagemSelecionados.filter(i => i.grupoId === grupo.id);
                if (selecionados.length === 0) {
                    mostrarToast('Item obrigatório', `Selecione pelo menos 1 item em "${grupo.nome}"`, 'alerta');
                    return;
                }
            }
        }
        
        let precoFinal = montagemSelecionada.precoBase;
        if (tamanhoSelecionado) precoFinal += tamanhoSelecionado.preco;
        itensMontagemSelecionados.forEach(item => { precoFinal += item.preco || 0; });
        
        // Monta descrição do item
        let descricaoMontagem = [];
        if (tamanhoSelecionado) descricaoMontagem.push(`📏 ${tamanhoSelecionado.nome}`);
        
        montagemSelecionada.grupos.forEach(grupo => {
            const itensDoGrupo = itensMontagemSelecionados.filter(i => i.grupoId === grupo.id);
            if (itensDoGrupo.length > 0) {
                descricaoMontagem.push(`${grupo.nome}: ${itensDoGrupo.map(i => i.nome).join(', ')}`);
            }
        });
        
        const nomeFinal = `${montagemSelecionada.nome}${tamanhoSelecionado ? ' (' + tamanhoSelecionado.nome + ')' : ''}`;
        
        const itemCarrinho = {
            id: montagemSelecionada.id + '-' + Date.now(),
            produtoId: montagemSelecionada.id,
            tipo: 'montagem',
            nome: nomeFinal,
            precoUnitario: precoFinal,
            quantidade: quantidadeSelecionada,
            observacao: document.getElementById('obsItem').value,
            montagemDetalhes: {
                montagemId: montagemSelecionada.id,
                tamanho: tamanhoSelecionado,
                itens: [...itensMontagemSelecionados],
                descricao: descricaoMontagem
            }
        };
        
        if (window.editandoCarrinhoIndex !== undefined && window.editandoCarrinhoIndex !== null) {
            carrinho[window.editandoCarrinhoIndex] = itemCarrinho;
            window.editandoCarrinhoIndex = null;
            mostrarToast('Item atualizado!', 'sucesso');
        } else {
            carrinho.push(itemCarrinho);
            mostrarToast(`${nomeFinal} adicionado ao carrinho!`, 'sucesso');
        }
        
        montagemSelecionada = null;
        tamanhoSelecionado = null;
        itensMontagemSelecionados = [];
    }
    // Produto normal ou pizza
    else if (produtoSelecionado) {
        let precoFinal = produtoSelecionado.preco;
        
        if (produtoSelecionado.categoria === 'pizza' && saboresSelecionados.length > 0) {
            const maiorPrecoSabor = Math.max(...saboresSelecionados.map(s => s.preco));
            precoFinal = Math.max(precoFinal, maiorPrecoSabor);
        }
        
        adicionaisSelecionados.forEach(adicional => {
            precoFinal += adicional.preco;
        });
        
        let nomeFinal = produtoSelecionado.nome;
        
        if (produtoSelecionado.categoria === 'pizza' && saboresSelecionados.length > 0) {
            if (saboresSelecionados.length === 1) {
                nomeFinal = `${produtoSelecionado.nome} - ${saboresSelecionados[0].nome}`;
            } else if (saboresSelecionados.length === 2) {
                nomeFinal = `${produtoSelecionado.nome} - Meio ${saboresSelecionados[0].nome} / Meio ${saboresSelecionados[1].nome}`;
            }
        }
        
        const itemCarrinho = {
            id: produtoSelecionado.id + '-' + Date.now(),
            produtoId: produtoSelecionado.id,
            tipo: 'produto',
            nome: nomeFinal,
            precoUnitario: precoFinal,
            quantidade: quantidadeSelecionada,
            observacao: document.getElementById('obsItem').value,
            adicionais: [...adicionaisSelecionados],
            sabores: [...saboresSelecionados]
        };
        
        if (window.editandoCarrinhoIndex !== undefined && window.editandoCarrinhoIndex !== null) {
            carrinho[window.editandoCarrinhoIndex] = itemCarrinho;
            window.editandoCarrinhoIndex = null;
            mostrarToast('Item atualizado!', 'sucesso');
        } else {
            carrinho.push(itemCarrinho);
            mostrarToast(`${nomeFinal} adicionado ao carrinho!`, 'sucesso');
        }
    }
    
    const btnAdicionar = document.querySelector('#modalProduto .btn-adicionar-carrinho');
    if (btnAdicionar) {
        btnAdicionar.innerHTML = '<i class="fas fa-cart-plus"></i> Adicionar ao Carrinho';
    }
    
    renderizarCarrinho();
    fecharModalProduto();
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
        
        // 🛠️ Detalhes da montagem
        let detalhesHtml = '';
        if (item.tipo === 'montagem' && item.montagemDetalhes) {
            detalhesHtml = '<div class="item-adicionais" style="font-size: 0.75rem;">';
            item.montagemDetalhes.descricao.forEach(linha => {
                detalhesHtml += `${linha}<br>`;
            });
            detalhesHtml += '</div>';
        }
        
        // Sabores pizza
        let saboresHtml = '';
        if (item.sabores && item.sabores.length) {
            saboresHtml = `
                <div class="item-adicionais">
                    🍕 Sabores: ${item.sabores.map(s => s.nome).join(' e ')}
                </div>
            `;
        }
        
        // Adicionais
        let adicionaisHtml = '';
        if (item.adicionais && item.adicionais.length) {
            adicionaisHtml = `
                <div class="item-adicionais">
                    ➕ ${item.adicionais.map(a => `${a.nome}${a.preco > 0 ? ` (+${formatarPreco(a.preco)})` : ''}`).join(', ')}
                </div>
            `;
        }
        
        div.innerHTML = `
            <div class="item-header">
                <span class="item-nome">${item.quantidade}x ${item.nome}</span>
                <span class="item-preco">${formatarPreco(subtotal)}</span>
            </div>
            ${detalhesHtml}
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
                    ${item.tipo === 'produto' ? `<button class="btn-editar-item" onclick="editarItemCarrinho(${idx})"><i class="fas fa-edit"></i></button>` : ''}
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
    if (item.tipo === 'montagem') {
        // Reabre modal de montagem
        abrirModalMontagem(item.produtoId);
        // Restaura seleções
        setTimeout(() => {
            if (item.montagemDetalhes) {
                if (item.montagemDetalhes.tamanho) {
                    const radio = document.querySelector(`input[name="tamanhoMontagem"][value="${item.montagemDetalhes.tamanho.id}"]`);
                    if (radio) radio.checked = true;
                    tamanhoSelecionado = item.montagemDetalhes.tamanho;
                }
                if (item.montagemDetalhes.itens) {
                    itensMontagemSelecionados = [...item.montagemDetalhes.itens];
                    document.querySelectorAll('#montagemDiv input[type="checkbox"]').forEach(cb => {
                        cb.checked = itensMontagemSelecionados.some(i => i.itemId === cb.value);
                    });
                }
                atualizarPrecoMontagem();
            }
            document.getElementById('obsItem').value = item.observacao || '';
            quantidadeSelecionada = item.quantidade;
            document.getElementById('quantidadeProduto').innerText = quantidadeSelecionada;
        }, 100);
        
        window.editandoCarrinhoIndex = index;
        const btnAdicionar = document.querySelector('#modalProduto .btn-adicionar-carrinho');
        if (btnAdicionar) btnAdicionar.innerHTML = '<i class="fas fa-save"></i> Atualizar Item';
    } else {
        const produto = produtos.find(p => p.id === item.produtoId);
        if (!produto) return;
        
        window.editandoCarrinhoIndex = index;
        produtoSelecionado = produto;
        quantidadeSelecionada = item.quantidade;
        saboresSelecionados = [...(item.sabores || [])];
        adicionaisSelecionados = item.adicionais ? item.adicionais.map(a => ({ nome: a.nome, preco: a.preco })) : [];
        document.getElementById('obsItem').value = item.observacao || '';
        
        abrirModalProduto(item.produtoId);
        
        setTimeout(() => {
            const checkboxesSabores = document.querySelectorAll('#saboresLista input[type="checkbox"]');
            checkboxesSabores.forEach(cb => {
                cb.checked = saboresSelecionados.some(s => s.id === cb.value);
            });
            const checkboxesAdicionais = document.querySelectorAll('#adicionaisLista input[type="checkbox"]');
            checkboxesAdicionais.forEach(cb => {
                try {
                    const adicional = JSON.parse(cb.value);
                    cb.checked = adicionaisSelecionados.some(a => a.nome === adicional.nome);
                } catch(e) {}
            });
            atualizarPrecoPizza();
        }, 100);
        
        document.getElementById('quantidadeProduto').innerText = quantidadeSelecionada;
        const btnAdicionar = document.querySelector('#modalProduto .btn-adicionar-carrinho');
        if (btnAdicionar) btnAdicionar.innerHTML = '<i class="fas fa-save"></i> Atualizar Item';
    }
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
    
    document.body.style.paddingTop = (headerHeight + categoriasWrapper.offsetHeight + 10) + 'px';
}

window.addEventListener('load', initMobileFixes);
window.addEventListener('resize', debounce(initMobileFixes, 200));

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
window.atualizarPrecoPizza = atualizarPrecoPizza;
window.toggleAdicional = toggleAdicional;
window.aumentarQuantidade = aumentarQuantidade;
window.diminuirQuantidade = diminuirQuantidade;
window.adicionarAoCarrinho = adicionarAoCarrinho;
window.alterarQuantidade = alterarQuantidade;
window.removerItemCarrinho = removerItemCarrinho;
window.duplicarItemCarrinho = duplicarItemCarrinho;
window.editarItemCarrinho = editarItemCarrinho;
window.initMobileFixes = initMobileFixes;
window.abrirModalMontagem = abrirModalMontagem;
window.selecionarTamanho = selecionarTamanho;
window.toggleItemMontagem = toggleItemMontagem;
window.atualizarPrecoMontagem = atualizarPrecoMontagem;

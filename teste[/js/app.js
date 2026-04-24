// ============================================
// ===== VARIÁVEIS GLOBAIS ===================
// ============================================

let produtos = [];
let categorias = ['Hambúrguer', 'Pizza', 'Refeição', 'Porção', 'Bebidas'];
let carrinho = [];
let adminLogado = false;
let produtoSelecionado = null;
let quantidadeSelecionada = 1;
let categoriaAtual = 'todos';

// ============================================
// ===== UTILITÁRIOS =========================
// ============================================

function formatarPreco(valor) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(valor);
}

function mostrarToast(mensagem, tipo = 'sucesso') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
        <i class="fas ${tipo === 'sucesso' ? 'fa-check-circle' : 'fa-info-circle'}" style="color: var(--cor-sucesso)"></i>
        <span>${mensagem}</span>
    `;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function debounce(fn, delay) {
    let t;
    return (...args) => {
        clearTimeout(t);
        t = setTimeout(() => fn(...args), delay);
    };
}

// ============================================
// ===== INICIALIZAÇÃO =======================
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    carregarDados();
    carregarTemaSalvo();
    atualizarAlturaHeader();
    
    renderizarTodasCategorias();
    renderizarProdutos();
    renderizarCarrinho();
    verificarHorario();
    setupAtalhoSecreto();
    
    window.addEventListener('resize', debounce(atualizarAlturaHeader, 200));
    setInterval(verificarHorario, 60000);
});

function carregarDados() {
    // Carregar produtos do localStorage
    const savedProdutos = localStorage.getItem('produtos');
    if (savedProdutos) {
        produtos = JSON.parse(savedProdutos);
    } else {
        criarProdutosExemplo();
    }
    
    // Carregar categorias
    const savedCategorias = localStorage.getItem('categorias');
    if (savedCategorias) {
        categorias = JSON.parse(savedCategorias);
    }
    
    // Carregar carrinho
    const savedCarrinho = localStorage.getItem('carrinho');
    if (savedCarrinho) {
        carrinho = JSON.parse(savedCarrinho);
    }
}

function salvarDados() {
    localStorage.setItem('produtos', JSON.stringify(produtos));
    localStorage.setItem('categorias', JSON.stringify(categorias));
    localStorage.setItem('carrinho', JSON.stringify(carrinho));
}

function criarProdutosExemplo() {
    produtos = [
        { id: '1', nome: 'X-Bacon Supremo', descricao: 'Pão, carne 180g, bacon, queijo, alface, tomate', preco: 32.90, categoria: 'Hambúrguer', imagem: '', disponivel: true, destaque: true },
        { id: '2', nome: 'X-Salada', descricao: 'Pão, carne, queijo, alface, tomate', preco: 25.90, categoria: 'Hambúrguer', imagem: '', disponivel: true, destaque: false },
        { id: '3', nome: 'Pizza Calabresa', descricao: 'Molho, mussarela, calabresa, cebola', preco: 45.00, categoria: 'Pizza', imagem: '', disponivel: true, destaque: true },
        { id: '4', nome: 'Refeição Executiva', descricao: 'Arroz, feijão, bife, salada', preco: 28.90, categoria: 'Refeição', imagem: '', disponivel: true, destaque: false },
        { id: '5', nome: 'Batata Frita', descricao: 'Porção de batata frita crocante', preco: 15.00, categoria: 'Porção', imagem: '', disponivel: true, destaque: false },
        { id: '6', nome: 'Coca-Cola 2L', descricao: 'Refrigerante Coca-Cola 2 litros', preco: 12.00, categoria: 'Bebidas', imagem: '', disponivel: true, destaque: false }
    ];
    salvarDados();
}

function atualizarAlturaHeader() {
    const header = document.querySelector('.header');
    if (header) {
        document.documentElement.style.setProperty('--header-height', header.offsetHeight + 'px');
    }
}

// ============================================
// ===== CATEGORIAS ==========================
// ============================================

function getIconeCategoria(cat) {
    const icones = {
        'Hambúrguer': '🍔',
        'Pizza': '🍕',
        'Refeição': '🍽️',
        'Porção': '🍟',
        'Bebidas': '🥤'
    };
    return icones[cat] || '📦';
}

function renderizarTodasCategorias() {
    const container = document.getElementById('categoriasTabs');
    container.innerHTML = '';
    
    // Tab "Todos"
    const tabTodos = document.createElement('div');
    tabTodos.className = 'categoria-tab ativo';
    tabTodos.innerHTML = '📱 Todos';
    tabTodos.onclick = () => filtrarPorCategoria('todos', tabTodos);
    container.appendChild(tabTodos);
    
    // Tabs das categorias
    categorias.forEach(cat => {
        const tab = document.createElement('div');
        tab.className = 'categoria-tab';
        tab.innerHTML = getIconeCategoria(cat) + ' ' + cat;
        tab.onclick = () => filtrarPorCategoria(cat, tab);
        container.appendChild(tab);
    });
    
    verificarSetinhas();
    container.addEventListener('scroll', debounce(verificarSetinhas, 100));
    window.addEventListener('resize', debounce(verificarSetinhas, 200));
}

function verificarSetinhas() {
    const container = document.getElementById('categoriasTabs');
    const wrapper = document.querySelector('.categorias-wrapper');
    if (!container || !wrapper) return;
    
    const btnLeft = wrapper.querySelector('.categoria-nav-left');
    const btnRight = wrapper.querySelector('.categoria-nav-right');
    if (!btnLeft || !btnRight) return;
    
    // Esconder setinhas no mobile
    if (window.innerWidth <= 768) {
        btnLeft.style.display = 'none';
        btnRight.style.display = 'none';
        return;
    }
    
    const podeScrollar = container.scrollWidth > container.clientWidth;
    const noInicio = container.scrollLeft <= 5;
    const noFim = container.scrollLeft + container.clientWidth >= container.scrollWidth - 5;
    
    btnLeft.style.display = (podeScrollar && !noInicio) ? 'flex' : 'none';
    btnRight.style.display = (podeScrollar && !noFim) ? 'flex' : 'none';
}

function scrollCategorias(distancia) {
    const container = document.getElementById('categoriasTabs');
    if (container) {
        container.scrollBy({ left: distancia, behavior: 'smooth' });
        setTimeout(verificarSetinhas, 400);
    }
}

function filtrarPorCategoria(categoria, tabElement) {
    categoriaAtual = categoria;
    
    document.querySelectorAll('.categoria-tab').forEach(tab => {
        tab.classList.remove('ativo');
    });
    if (tabElement) tabElement.classList.add('ativo');
    
    // Centralizar tab clicada
    if (tabElement && window.innerWidth > 768) {
        const container = document.getElementById('categoriasTabs');
        const containerRect = container.getBoundingClientRect();
        const tabRect = tabElement.getBoundingClientRect();
        const scrollPara = container.scrollLeft + (tabRect.left - containerRect.left) - (containerRect.width / 2) + (tabRect.width / 2);
        container.scrollTo({ left: Math.max(0, scrollPara), behavior: 'smooth' });
    }
    
    renderizarProdutos();
}

// ============================================
// ===== PRODUTOS ============================
// ============================================

function renderizarProdutos() {
    const container = document.getElementById('produtosGrid');
    container.innerHTML = '';
    
    let produtosFiltrados = produtos;
    if (categoriaAtual !== 'todos') {
        produtosFiltrados = produtos.filter(p => p.categoria === categoriaAtual);
    }
    
    if (!adminLogado) {
        produtosFiltrados = produtosFiltrados.filter(p => p.disponivel);
    }
    
    if (produtosFiltrados.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 50px; color: var(--cor-texto-claro);">
                <i class="fas fa-utensils" style="font-size: 3rem; opacity: 0.5;"></i>
                <p>Nenhum produto encontrado</p>
            </div>
        `;
        return;
    }
    
    produtosFiltrados.forEach(produto => {
        const card = document.createElement('div');
        card.className = `produto-card ${!produto.disponivel ? 'indisponivel' : ''}`;
        const imagemUrl = produto.imagem || 'https://via.placeholder.com/300x180?text=Produto';
        
        card.innerHTML = `
            ${produto.destaque ? '<div class="badge-destaque">🔥 Destaque</div>' : ''}
            <img class="produto-img" src="${imagemUrl}" alt="${produto.nome}" onerror="this.src='https://via.placeholder.com/300x180?text=Imagem'">
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
    
    if (produtosDestaque.length > 0 && !adminLogado) {
        section.style.display = 'block';
        const grid = document.getElementById('destaquesGrid');
        grid.innerHTML = '';
        
        produtosDestaque.slice(0, 4).forEach(produto => {
            const card = document.createElement('div');
            card.className = 'produto-card';
            card.style.background = 'rgba(255,255,255,0.15)';
            card.innerHTML = `
                <div class="produto-info">
                    <div class="produto-nome" style="color: white;">${produto.nome}</div>
                    <div class="produto-preco" style="color: white;">${formatarPreco(produto.preco)}</div>
                    <button class="btn-add" style="background: white; color: var(--cor-primaria);" onclick="abrirModalProduto('${produto.id}')">+</button>
                </div>
            `;
            grid.appendChild(card);
        });
    } else {
        section.style.display = 'none';
    }
}

// ============================================
// ===== MODAL PRODUTO =======================
// ============================================

function abrirModalProduto(produtoId) {
    produtoSelecionado = produtos.find(p => p.id === produtoId);
    if (!produtoSelecionado) return;
    
    quantidadeSelecionada = 1;
    
    document.getElementById('modalProdutoNome').innerText = produtoSelecionado.nome;
    document.getElementById('modalProdutoDesc').innerText = produtoSelecionado.descricao || '';
    document.getElementById('modalProdutoPreco').innerHTML = formatarPreco(produtoSelecionado.preco);
    document.getElementById('quantidadeProduto').innerText = '1';
    document.getElementById('obsItem').value = '';
    
    const img = document.getElementById('modalProdutoImg');
    img.src = produtoSelecionado.imagem || 'https://via.placeholder.com/300x180?text=Produto';
    
    document.getElementById('modalProduto').style.display = 'flex';
}

function fecharModalProduto() {
    document.getElementById('modalProduto').style.display = 'none';
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
    
    const itemCarrinho = {
        id: Date.now(),
        produtoId: produtoSelecionado.id,
        nome: produtoSelecionado.nome,
        precoUnitario: produtoSelecionado.preco,
        quantidade: quantidadeSelecionada,
        observacao: document.getElementById('obsItem').value
    };
    
    carrinho.push(itemCarrinho);
    salvarDados();
    renderizarCarrinho();
    fecharModalProduto();
    mostrarToast(`${produtoSelecionado.nome} adicionado!`, 'sucesso');
}

// ============================================
// ===== CARRINHO ============================
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
        div.innerHTML = `
            <div class="item-header">
                <span class="item-nome">${item.quantidade}x ${item.nome}</span>
                <span class="item-preco">${formatarPreco(subtotal)}</span>
            </div>
            ${item.observacao ? `<div class="item-obs">📝 ${item.observacao}</div>` : ''}
            <div class="item-footer">
                <div class="quantidade-control">
                    <button class="quantidade-btn" onclick="alterarQuantidade(${idx}, -1)">-</button>
                    <span>${item.quantidade}</span>
                    <button class="quantidade-btn" onclick="alterarQuantidade(${idx}, 1)">+</button>
                </div>
                <button class="btn-remover-item" onclick="removerItemCarrinho(${idx})">🗑️</button>
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
        salvarDados();
        renderizarCarrinho();
    }
}

function removerItemCarrinho(index) {
    const item = carrinho[index];
    carrinho.splice(index, 1);
    salvarDados();
    renderizarCarrinho();
    mostrarToast(`${item.nome} removido`, 'info');
}

// ============================================
// ===== CHECKOUT ============================
// ============================================

function abrirCheckout() {
    if (carrinho.length === 0) {
        mostrarToast('Carrinho vazio!', 'alerta');
        return;
    }
    
    const total = carrinho.reduce((sum, item) => sum + (item.precoUnitario * item.quantidade), 0);
    document.getElementById('checkoutSubtotal').innerHTML = formatarPreco(total);
    document.getElementById('checkoutFreteValor').innerHTML = formatarPreco(0);
    document.getElementById('checkoutTotal').innerHTML = formatarPreco(total);
    document.getElementById('checkoutFrete').value = 'R$ 0,00';
    
    document.getElementById('modalCheckout').style.display = 'flex';
}

function fecharModalCheckout() {
    document.getElementById('modalCheckout').style.display = 'none';
}

function toggleCamposEntrega() {
    const tipo = document.getElementById('checkoutTipoEntrega').value;
    const camposEntrega = document.getElementById('camposEntrega');
    camposEntrega.style.display = tipo === 'entrega' ? 'block' : 'none';
}

function toggleCampoTroco() {
    const pagamento = document.getElementById('checkoutPagamento').value;
    document.getElementById('campoTroco').style.display = pagamento === 'dinheiro' ? 'block' : 'none';
}

function buscarCep() {
    const cep = document.getElementById('checkoutCep').value.replace(/\D/g, '');
    if (cep.length !== 8) {
        mostrarToast('CEP inválido', 'alerta');
        return;
    }
    
    mostrarToast('Buscando CEP...', 'info');
    fetch(`https://viacep.com.br/ws/${cep}/json/`)
        .then(res => res.json())
        .then(data => {
            if (!data.erro) {
                document.getElementById('checkoutRua').value = data.logradouro;
                document.getElementById('checkoutBairro').value = data.bairro;
                document.getElementById('checkoutCidade').value = `${data.localidade} - ${data.uf}`;
                mostrarToast('CEP encontrado!', 'sucesso');
            } else {
                mostrarToast('CEP não encontrado', 'alerta');
            }
        })
        .catch(() => mostrarToast('Erro ao buscar CEP', 'erro'));
}

function confirmarPedido() {
    const nome = document.getElementById('checkoutNome').value;
    const telefone = document.getElementById('checkoutTelefone').value;
    
    if (!nome || !telefone) {
        mostrarToast('Preencha nome e telefone', 'alerta');
        return;
    }
    
    const total = carrinho.reduce((sum, item) => sum + (item.precoUnitario * item.quantidade), 0);
    const itensTexto = carrinho.map(item => `${item.quantidade}x ${item.nome} - ${formatarPreco(item.precoUnitario * item.quantidade)}`).join('\n');
    const obsGeral = document.getElementById('observacaoGeral').value;
    
    let mensagem = `🍕 *NOVO PEDIDO* 🍕\n\n`;
    mensagem += `*Cliente:* ${nome}\n`;
    mensagem += `*Telefone:* ${telefone}\n\n`;
    mensagem += `*ITENS:*\n${itensTexto}\n\n`;
    mensagem += `*Total:* ${formatarPreco(total)}\n\n`;
    
    if (obsGeral) mensagem += `*Observação:* ${obsGeral}\n`;
    
    const whatsappUrl = `https://wa.me/5511999999999?text=${encodeURIComponent(mensagem)}`;
    window.open(whatsappUrl, '_blank');
    
    // Limpar carrinho
    carrinho = [];
    salvarDados();
    renderizarCarrinho();
    fecharModalCheckout();
    mostrarToast('Pedido enviado!', 'sucesso');
}

// ============================================
// ===== ADMIN ===============================
// ============================================

function abrirModalLogin() {
    document.getElementById('modalLogin').style.display = 'flex';
}

function fecharModalLogin() {
    document.getElementById('modalLogin').style.display = 'none';
    document.getElementById('erroLogin').style.display = 'none';
}

function toggleSenha() {
    const senhaInput = document.getElementById('senhaAdmin');
    senhaInput.type = senhaInput.type === 'password' ? 'text' : 'password';
}

function verificarLogin() {
    const senha = document.getElementById('senhaAdmin').value;
    if (senha === 'admin123') {
        adminLogado = true;
        fecharModalLogin();
        abrirModalAdmin();
        renderizarProdutos();
        mostrarToast('Admin logado!', 'sucesso');
    } else {
        document.getElementById('erroLogin').style.display = 'block';
    }
}

function abrirModalAdmin() {
    document.getElementById('modalAdmin').style.display = 'flex';
    carregarAdminProdutos();
    carregarAdminCategorias();
}

function fecharModalAdmin() {
    document.getElementById('modalAdmin').style.display = 'none';
}

function logout() {
    adminLogado = false;
    fecharModalAdmin();
    renderizarProdutos();
    mostrarToast('Logout realizado', 'info');
}

function mostrarAbaAdmin(aba) {
    document.getElementById('adminProdutos').style.display = 'none';
    document.getElementById('adminCategorias').style.display = 'none';
    document.getElementById('adminAdicionais').style.display = 'none';
    document.getElementById('adminPedidos').style.display = 'none';
    document.getElementById('adminConfig').style.display = 'none';
    
    if (aba === 'produtos') document.getElementById('adminProdutos').style.display = 'block';
    if (aba === 'categorias') document.getElementById('adminCategorias').style.display = 'block';
    if (aba === 'adicionais') document.getElementById('adminAdicionais').style.display = 'block';
    if (aba === 'pedidos') document.getElementById('adminPedidos').style.display = 'block';
    if (aba === 'config') document.getElementById('adminConfig').style.display = 'block';
    
    if (aba === 'categorias') carregarAdminCategorias();
}

function carregarAdminProdutos() {
    const container = document.getElementById('adminProdutosLista');
    container.innerHTML = '';
    
    produtos.forEach(produto => {
        const div = document.createElement('div');
        div.className = 'carrinho-item';
        div.innerHTML = `
            <div class="item-header">
                <span><strong>${produto.nome}</strong> - ${formatarPreco(produto.preco)}</span>
                <div>
                    <button onclick="editarProduto('${produto.id}')" style="background: none; border: none; color: var(--cor-primaria); cursor: pointer;">✏️</button>
                    <button onclick="excluirProduto('${produto.id}')" style="background: none; border: none; color: var(--cor-erro); cursor: pointer;">🗑️</button>
                </div>
            </div>
            <div style="font-size: 0.8rem; color: var(--cor-texto-claro);">${produto.categoria} • ${produto.disponivel ? '✅ Disponível' : '❌ Indisponível'}</div>
        `;
        container.appendChild(div);
    });
}

function carregarAdminCategorias() {
    const container = document.getElementById('listaCategorias');
    container.innerHTML = '';
    
    categorias.forEach(cat => {
        const div = document.createElement('div');
        div.className = 'carrinho-item';
        div.innerHTML = `
            <div class="item-header">
                <span>${getIconeCategoria(cat)} ${cat}</span>
                <button onclick="removerCategoria('${cat}')" style="background: none; border: none; color: var(--cor-erro); cursor: pointer;">🗑️</button>
            </div>
        `;
        container.appendChild(div);
    });
}

function abrirModalCadastroProduto() {
    document.getElementById('cadastroProdutoTitulo').innerText = '➕ Novo Produto';
    document.getElementById('editProdutoId').value = '';
    document.getElementById('produtoNome').value = '';
    document.getElementById('produtoDesc').value = '';
    document.getElementById('produtoPreco').value = '';
    document.getElementById('produtoImagem').value = '';
    document.getElementById('produtoDisponivel').checked = true;
    document.getElementById('produtoDestaque').checked = false;
    
    // Carregar categorias no select
    const select = document.getElementById('produtoCategoria');
    select.innerHTML = '';
    categorias.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        select.appendChild(option);
    });
    
    document.getElementById('modalCadastroProduto').style.display = 'flex';
}

function fecharModalCadastroProduto() {
    document.getElementById('modalCadastroProduto').style.display = 'none';
}

function salvarProduto() {
    const id = document.getElementById('editProdutoId').value;
    const produto = {
        id: id || Date.now().toString(),
        nome: document.getElementById('produtoNome').value,
        descricao: document.getElementById('produtoDesc').value,
        preco: parseFloat(document.getElementById('produtoPreco').value),
        categoria: document.getElementById('produtoCategoria').value,
        imagem: document.getElementById('produtoImagem').value,
        disponivel: document.getElementById('produtoDisponivel').checked,
        destaque: document.getElementById('produtoDestaque').checked
    };
    
    if (!produto.nome || !produto.preco) {
        mostrarToast('Preencha nome e preço', 'alerta');
        return;
    }
    
    if (id) {
        const index = produtos.findIndex(p => p.id === id);
        if (index !== -1) produtos[index] = produto;
    } else {
        produtos.push(produto);
    }
    
    salvarDados();
    fecharModalCadastroProduto();
    carregarAdminProdutos();
    renderizarProdutos();
    mostrarToast('Produto salvo!', 'sucesso');
}

function editarProduto(id) {
    const produto = produtos.find(p => p.id === id);
    if (produto) {
        document.getElementById('cadastroProdutoTitulo').innerText = '✏️ Editar Produto';
        document.getElementById('editProdutoId').value = produto.id;
        document.getElementById('produtoNome').value = produto.nome;
        document.getElementById('produtoDesc').value = produto.descricao || '';
        document.getElementById('produtoPreco').value = produto.preco;
        document.getElementById('produtoImagem').value = produto.imagem || '';
        document.getElementById('produtoDisponivel').checked = produto.disponivel;
        document.getElementById('produtoDestaque').checked = produto.destaque || false;
        
        const select = document.getElementById('produtoCategoria');
        select.innerHTML = '';
        categorias.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat;
            option.textContent = cat;
            if (cat === produto.categoria) option.selected = true;
            select.appendChild(option);
        });
        
        document.getElementById('modalCadastroProduto').style.display = 'flex';
    }
}

function excluirProduto(id) {
    if (confirm('Tem certeza?')) {
        produtos = produtos.filter(p => p.id !== id);
        salvarDados();
        carregarAdminProdutos();
        renderizarProdutos();
        mostrarToast('Produto excluído', 'info');
    }
}

function adicionarCategoria() {
    const nova = document.getElementById('novaCategoria').value.trim();
    if (nova && !categorias.includes(nova)) {
        categorias.push(nova);
        salvarDados();
        carregarAdminCategorias();
        renderizarTodasCategorias();
        renderizarProdutos();
        document.getElementById('novaCategoria').value = '';
        mostrarToast('Categoria adicionada!', 'sucesso');
    }
}

function removerCategoria(cat) {
    if (confirm(`Remover "${cat}"?`)) {
        categorias = categorias.filter(c => c !== cat);
        salvarDados();
        carregarAdminCategorias();
        renderizarTodasCategorias();
        renderizarProdutos();
        mostrarToast('Categoria removida', 'info');
    }
}

function salvarConfiguracoes() {
    mostrarToast('Configurações salvas!', 'sucesso');
}

function abrirGerenciarDestaques() {
    mostrarToast('Gerenciar destaques', 'info');
}

// ============================================
// ===== TEMA ================================
// ============================================

function toggleTema() {
    const html = document.documentElement;
    const themeIcon = document.getElementById('themeIcon');
    const themeText = document.getElementById('themeText');
    
    if (html.getAttribute('data-theme') === 'dark') {
        html.removeAttribute('data-theme');
        themeIcon.className = 'fas fa-moon';
        themeText.textContent = 'Escuro';
        localStorage.setItem('tema', 'light');
    } else {
        html.setAttribute('data-theme', 'dark');
        themeIcon.className = 'fas fa-sun';
        themeText.textContent = 'Claro';
        localStorage.setItem('tema', 'dark');
    }
}

function carregarTemaSalvo() {
    const tema = localStorage.getItem('tema');
    if (tema === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        document.getElementById('themeIcon').className = 'fas fa-sun';
        document.getElementById('themeText').textContent = 'Claro';
    }
}

// ============================================
// ===== HORÁRIO =============================
// ============================================

function verificarHorario() {
    const agora = new Date();
    const hora = agora.getHours();
    const statusDiv = document.getElementById('statusHorarioHeader');
    
    if (hora >= 11 && hora < 23) {
        statusDiv.innerHTML = '🟢 ABERTO';
        statusDiv.className = 'status-horario aberto';
    } else {
        statusDiv.innerHTML = '🔴 FECHADO';
        statusDiv.className = 'status-horario fechado';
    }
}

// ============================================
// ===== ATALHO SECRETO ADMIN ================
// ============================================

function setupAtalhoSecreto() {
    const logoArea = document.querySelector('.logo-area');
    if (!logoArea) return;
    
    logoArea.style.cursor = 'pointer';
    
    logoArea.addEventListener('dblclick', () => {
        abrirModalLogin();
    });
    
    let toques = 0;
    let timeout;
    
    logoArea.addEventListener('touchstart', (e) => {
        toques++;
        if (toques === 1) {
            timeout = setTimeout(() => { toques = 0; }, 300);
        } else if (toques === 2) {
            clearTimeout(timeout);
            e.preventDefault();
            abrirModalLogin();
            toques = 0;
        }
    });
}

// ============================================
// ===== EXPOR FUNÇÕES GLOBAIS ===============
// ============================================

window.toggleTema = toggleTema;
window.abrirModalLogin = abrirModalLogin;
window.fecharModalLogin = fecharModalLogin;
window.toggleSenha = toggleSenha;
window.verificarLogin = verificarLogin;
window.abrirModalAdmin = abrirModalAdmin;
window.fecharModalAdmin = fecharModalAdmin;
window.logout = logout;
window.mostrarAbaAdmin = mostrarAbaAdmin;
window.abrirModalCadastroProduto = abrirModalCadastroProduto;
window.fecharModalCadastroProduto = fecharModalCadastroProduto;
window.salvarProduto = salvarProduto;
window.editarProduto = editarProduto;
window.excluirProduto = excluirProduto;
window.adicionarCategoria = adicionarCategoria;
window.removerCategoria = removerCategoria;
window.salvarConfiguracoes = salvarConfiguracoes;
window.abrirGerenciarDestaques = abrirGerenciarDestaques;
window.abrirModalProduto = abrirModalProduto;
window.fecharModalProduto = fecharModalProduto;
window.aumentarQuantidade = aumentarQuantidade;
window.diminuirQuantidade = diminuirQuantidade;
window.adicionarAoCarrinho = adicionarAoCarrinho;
window.alterarQuantidade = alterarQuantidade;
window.removerItemCarrinho = removerItemCarrinho;
window.abrirCheckout = abrirCheckout;
window.fecharModalCheckout = fecharModalCheckout;
window.toggleCamposEntrega = toggleCamposEntrega;
window.toggleCampoTroco = toggleCampoTroco;
window.buscarCep = buscarCep;
window.confirmarPedido = confirmarPedido;
window.scrollCategorias = scrollCategorias;

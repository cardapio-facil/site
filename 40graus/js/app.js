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
let horarios = [...HORARIOS_PADRAO];
let feriados = [...FERIADOS_PADRAO];
let cupons = [...CUPONS_PADRAO];
let cupomAplicado = null; 

let adminLogado = false;
let nivelAcesso = null;
let produtoSelecionado = null;
let produtoEditando = null;

let quantidadeSelecionada = 1;
let saboresSelecionados = [];
let adicionaisSelecionados = [];

let categoriaAtual = 'todos';

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
    if (data.horarios) horarios = data.horarios;
    if (data.feriados) feriados = data.feriados;
    if (data.cupons) cupons = data.cupons;
    if (data.usoCupons && data.cupons) {
        cupons.forEach(function(cupom) {
            if (data.usoCupons[cupom.id]) {
                cupom.usos = data.usoCupons[cupom.id].usos || cupom.usos;
            }
        });
    }
    
    if (produtos.length === 0) criarProdutosExemplo();
    if (montagens.length === 0) {
        montagens = [...MONTAGENS_PADRAO];
        salvarMontagensFirebase(montagens);
    }
    
    atualizarAlturaHeader();
    window.addEventListener('resize', debounce(atualizarAlturaHeader, 200));
    
    renderizarTodasCategorias();
    renderizarProdutos();
    setTimeout(() => {
    atualizarCarrinhoMobileBar();
}, 500);
    renderizarCarrinho();
    verificarHorario();
    atualizarCuponsHeader();
    setupAtalhoSecreto();

    let isMobile = window.innerWidth <= 900;
    window.addEventListener('resize', () => {
        const agoraMobile = window.innerWidth <= 900;
        if (agoraMobile !== isMobile) {
            isMobile = agoraMobile;
            if (isMobile) {
                fecharCarrinhoMobile();
            }
        }
    });
    window.addEventListener('orientationchange', fecharCarrinhoMobile);
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
        { id: 'prod1', nome: 'X-Bacon Supremo', descricao: 'Pão, carne 180g, bacon, queijo, alface, tomate', preco: 3290, categoria: 'hamburguer', imagem: '', disponivel: true, destaque: true },
        { id: 'prod2', nome: 'X-Salada', descricao: 'Pão, carne, queijo, alface, tomate', preco: 2590, categoria: 'hamburguer', imagem: '', disponivel: true, destaque: false },
        { id: 'prod3', nome: 'Pizza Grande', descricao: 'Pizza grande 8 fatias - Escolha até 2 sabores', preco: 4500, categoria: 'pizza', imagem: '', disponivel: true, destaque: true },
        { id: 'prod4', nome: 'Pizza Calabresa', descricao: 'Molho, mussarela, calabresa, cebola', preco: 4800, categoria: 'pizza', imagem: '', disponivel: true, destaque: false },
        { id: 'prod5', nome: 'Pizza Portuguesa', descricao: 'Molho, mussarela, presunto, ovos, cebola, azeitona', preco: 5200, categoria: 'pizza', imagem: '', disponivel: true, destaque: false },
        { id: 'prod6', nome: 'Pizza Frango com Catupiry', descricao: 'Molho, mussarela, frango, catupiry', preco: 5500, categoria: 'pizza', imagem: '', disponivel: true, destaque: true },
        { id: 'prod7', nome: 'Pizza Marguerita', descricao: 'Molho, mussarela, tomate, manjericão', preco: 5000, categoria: 'pizza', imagem: '', disponivel: true, destaque: false },
        { id: 'prod8', nome: 'Refeição Executiva', descricao: 'Arroz, feijão, bife, salada', preco: 2890, categoria: 'refeicao', imagem: '', disponivel: true, destaque: false },
        { id: 'prod9', nome: 'Batata Frita', descricao: 'Porção de batata frita crocante', preco: 1500, categoria: 'porcao', imagem: '', disponivel: true, destaque: false },
        { id: 'prod10', nome: 'Coca-Cola 2L', descricao: 'Refrigerante Coca-Cola 2 litros', preco: 1200, categoria: 'bebidas', imagem: '', disponivel: true, destaque: false }
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
    if (wrapper) return;
    
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

function scrollCategorias(distancia) {
    const container = document.getElementById('categoriasTabs');
    container.scrollBy({ left: distancia, behavior: 'smooth' });
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
    
    btnLeft.classList.toggle('visivel', podeScrollar && !noInicio);
    btnRight.classList.toggle('visivel', podeScrollar && !noFim);
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
    
    // ✅ AGUARDA RENDERIZAR
    setTimeout(() => {
        const produtosGrid = document.getElementById('produtosGrid');
        if (produtosGrid) {
            produtosGrid.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest'
            });
        }
    }, 150);
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
    
    // Verifica disponibilidade por horário
    const statusLoja = verificarStatusLoja();
    const agora = new Date();
    
    // Montagens
    montagensFiltradas.forEach(montagem => {
        const card = document.createElement('div');
        
        // Verifica se está disponível por horário
        const catDisponivel = !adminLogado ? isCategoriaDisponivel(montagem.categoria, agora) : true;
        const lojaDisponivel = statusLoja.aberto;
        const disponivel = lojaDisponivel && catDisponivel;
        
        card.className = `produto-card montagem-card ${!disponivel && !adminLogado ? 'fora-horario' : ''}`;
        card.dataset.categoria = montagem.categoria;
        
        const imagemUrl = montagem.imagem || LOGO_PADRAO;
        
        // Selo de horário
        let seloHtml = '';
        if (!disponivel && !adminLogado) {
            const selo = getSeloForaHorario(montagem.categoria);
            seloHtml = `<div class="selo-horario ${getCorClasseSelo(selo.cor)}">${selo.texto}</div>`;
        }
        
        card.innerHTML = `
           <div class="badge-montagem"><i class="fas fa-puzzle-piece"></i> Você escolhe</div>
            ${montagem.destaque ? '<div class="badge-destaque direita"><i class="fas fa-fire"></i> Destaque</div>' : ''}
            ${seloHtml}
            <img class="produto-img" src="${imagemUrl}" alt="${montagem.nome}" onerror="this.src='${LOGO_PADRAO}';">
            <div class="produto-info">
                <div class="produto-nome">${montagem.nome}</div>
                <div class="produto-desc">${montagem.descricao || ''}</div>
                <div class="produto-footer">
                    <span class="produto-preco">A partir de ${formatarPreco(montagem.precoBase)}</span>
                    ${disponivel ? `<button class="btn-add btn-montagem" onclick="event.stopPropagation(); abrirModalMontagem('${montagem.id}')">+</button>` : '<button class="btn-add" disabled style="background:#ccc;">🕐</button>'}
                </div>
            </div>
        `;
        
        if (disponivel) {
            card.onclick = () => abrirModalMontagem(montagem.id);
        }
        container.appendChild(card);
    });




    // Ordenar: disponíveis primeiro, bloqueados depois
    produtosFiltrados.sort(function(a, b) {
        function getPrioridade(produto) {
            if (produto.disponivel === false) return 2;
            if (!adminLogado && statusLoja.aberto && !isCategoriaDisponivel(produto.categoria, agora)) return 1;
            return 0;
        }
        
        return getPrioridade(a) - getPrioridade(b);
    });

    produtosFiltrados.forEach(produto => {
        const card = document.createElement('div');
        
        const catDisponivel = !adminLogado ? isCategoriaDisponivel(produto.categoria, agora) : true;
        const lojaDisponivel = statusLoja.aberto;
        const disponivel = lojaDisponivel && catDisponivel && produto.disponivel;
        
        card.className = `produto-card ${!disponivel && !adminLogado ? 'fora-horario' : ''} ${!produto.disponivel ? 'indisponivel' : ''}`;
        card.dataset.categoria = produto.categoria;
        
        const imagemUrl = produto.imagem || LOGO_PADRAO;
        
        let seloHtml = '';
        if (!disponivel && !adminLogado && produto.disponivel) {
            const selo = getSeloForaHorario(produto.categoria);
            seloHtml = `<div class="selo-horario ${getCorClasseSelo(selo.cor)}">${selo.texto}</div>`;
        }
        
        card.innerHTML = `
            ${produto.destaque ? '<div class="badge-destaque"><i class="fas fa-fire"></i> Destaque</div>' : ''}
            ${seloHtml}
            <img class="produto-img" src="${imagemUrl}" alt="${produto.nome}" onerror="this.src='${LOGO_PADRAO}';">
            <div class="produto-info">
                <div class="produto-nome">${produto.nome}</div>
                <div class="produto-desc">${produto.descricao || ''}</div>
                <div class="produto-footer">
                    <span class="produto-preco">${produto.categoria === 'pizza' && (produto.precoP || produto.precoM || produto.precoG || produto.precoGG) ? 'A partir de ' + formatarPreco(obterMenorPreco(produto)) : formatarPreco(produto.preco)}</span>
                    ${disponivel ? `<button class="btn-add" onclick="event.stopPropagation(); abrirModalProduto('${produto.id}')">+</button>` : '<button class="btn-add" disabled style="background:#ccc;">🕐</button>'}
                </div>
            </div>
        `;
        
        if (disponivel) {
            card.onclick = () => abrirModalProduto(produto.id);
        }
        container.appendChild(card);
    });
    renderizarDestaques();
    initMobileFixes();
}

function getCorClasseSelo(corHex) {
    const mapa = {
        '#f39c12': 'laranja',
        '#e67e22': 'laranja',
        '#3498db': 'azul',
        '#2980b9': 'azul',
        '#9b59b6': 'roxo',
        '#8e44ad': 'roxo',
        '#e74c3c': 'vermelho',
        '#c0392b': 'vermelho',
        '#607d8b': 'cinza',
        '#7f8c8d': 'cinza'
    };
    return mapa[corHex] || 'cinza';
}

function renderizarDestaques() {
    const section = document.getElementById('destaquesSection');
    const statusLoja = verificarStatusLoja();
    const agora = new Date();
    
const produtosDestaque = produtos.filter(p => {
    if (!p.destaque || !p.disponivel || p.exibirDestaque === false) return false;
    if (!adminLogado) {
        return statusLoja.aberto && isCategoriaDisponivel(p.categoria, agora);
    }
    return true;
});

const montagensDestaque = montagens.filter(m => {
    if (!m.destaque || !m.disponivel || m.exibirDestaque === false) return false;
    if (!adminLogado) {
        return statusLoja.aberto && isCategoriaDisponivel(m.categoria, agora);
    }
    return true;
});
    
    const totalDestaques = produtosDestaque.length + montagensDestaque.length;
    
    if (totalDestaques > 0) {
        section.style.display = 'block';
        const grid = document.getElementById('destaquesGrid');
        grid.innerHTML = '';
        
        montagensDestaque.slice(0, 2).forEach(montagem => {
            const card = document.createElement('div');
            card.className = 'produto-card';
            card.style.background = 'rgba(255,255,255,0.15)';
            card.style.backdropFilter = 'blur(10px)';
            card.onclick = () => abrirModalMontagem(montagem.id);
            
            card.innerHTML = `
               <div class="badge-montagem" style="font-size: 0.6rem; padding: 2px 8px;"><i class="fas fa-puzzle-piece"></i> Você escolhe </div>
                <img class="produto-img" src="${montagem.imagem || LOGO_PADRAO}" alt="${montagem.nome}" style="height: 120px;" onerror="this.src='${LOGO_PADRAO}'">
                <div class="produto-info">
                    <div class="produto-nome" style="color: white;">${montagem.nome}</div>
                   <div class="produto-preco" style="color: white;">A partir de ${formatarPreco(obterMenorPrecoMontagem(montagem))}</div>
                    <button class="btn-add" style="background: white; color: var(--cor-primaria);" onclick="event.stopPropagation(); abrirModalMontagem('${montagem.id}')">+</button>
                </div>
            `;
            grid.appendChild(card);
        });
        
        produtosDestaque.slice(0, 4 - montagensDestaque.length).forEach(produto => {
            const card = document.createElement('div');
            card.className = 'produto-card';
            card.style.background = 'rgba(255,255,255,0.15)';
            card.style.backdropFilter = 'blur(10px)';
            card.onclick = () => abrirModalProduto(produto.id);
            
            card.innerHTML = `
                <img class="produto-img" src="${produto.imagem || LOGO_PADRAO}" alt="${produto.nome}" style="height: 120px;" onerror="this.src='${LOGO_PADRAO}'">
                <div class="produto-info">
                    <div class="produto-nome" style="color: white;">${produto.nome}</div>
                   <div class="produto-preco" style="color: white;">${formatarPreco(obterMenorPreco(produto))}</div>
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
// ===== MODAL DE PRODUTO =====================
// ============================================

function abrirModalProduto(produtoId) {
    produtoSelecionado = produtos.find(p => p.id === produtoId);
    if (!produtoSelecionado) return;
    
    montagemSelecionada = null;
    tamanhoSelecionado = null;
    itensMontagemSelecionados = [];
    
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
    
      // Esconder tudo primeiro
    document.getElementById('saboresPizzaDiv').style.display = 'none';
    document.getElementById('adicionaisDiv').style.display = 'none';
    document.getElementById('montagemDiv').style.display = 'none';
    
    // Tamanhos para Pizza (PRIMEIRO)
    if (produtoSelecionado.categoria === 'pizza') {
        const tamanhos = [];
        if (produtoSelecionado.precoP) tamanhos.push({ id: 'P', nome: 'Pequeno (P)', preco: produtoSelecionado.precoP });
        if (produtoSelecionado.precoM) tamanhos.push({ id: 'M', nome: 'Medio (M)', preco: produtoSelecionado.precoM });
        if (produtoSelecionado.precoG) tamanhos.push({ id: 'G', nome: 'Grande (G)', preco: produtoSelecionado.precoG });
        if (produtoSelecionado.precoGG) tamanhos.push({ id: 'GG', nome: 'Gigante (GG)', preco: produtoSelecionado.precoGG });
        
        if (tamanhos.length > 0) {
            const montagemDiv = document.getElementById('montagemDiv');
            montagemDiv.style.display = 'block';
            montagemDiv.innerHTML = '';
            
            const tamanhoSection = document.createElement('div');
            tamanhoSection.className = 'montagem-section';
            tamanhoSection.innerHTML = '<h4>Escolha o tamanho</h4>';
            
            const tamanhoLista = document.createElement('div');
            tamanhoLista.className = 'montagem-lista';
            
            tamanhos.forEach((tamanho, idx) => {
                const div = document.createElement('div');
                div.className = 'montagem-item-radio';
                div.innerHTML = `
                    <input type="radio" name="tamanhoPizza" value="${tamanho.id}" data-preco="${tamanho.preco}" ${idx === 0 ? 'checked' : ''} onchange="selecionarTamanhoPizza(this)">
                    <span>${tamanho.nome} - ${formatarPreco(tamanho.preco)}</span>
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
            
            document.getElementById('modalProdutoPreco').innerHTML = formatarPreco(tamanhos[0].preco);
            produtoSelecionado._tamanhoSelecionado = tamanhos[0];
        }
    }
    
    // Adicionais (DEPOIS)
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
                <span>${adicional.nome} ${adicional.preco > 0 ? '(+' + formatarPreco(adicional.preco) + ')' : ''}</span>
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
    }

function selecionarTamanhoPizza(radio) {
    if (!produtoSelecionado || produtoSelecionado.categoria !== 'pizza') return;
    
    const preco = parseInt(radio.dataset.preco);
    const tamanho = {
        id: radio.value,
        nome: radio.parentElement.querySelector('span').textContent.split(' - ')[0],
        preco: preco
    };
    
    produtoSelecionado._tamanhoSelecionado = tamanho;
    
    let precoFinal = preco;
    adicionaisSelecionados.forEach(a => { precoFinal += a.preco; });
    
    document.getElementById('modalProdutoPreco').innerHTML = formatarPreco(precoFinal);
}


function fecharModalProduto() {
    document.getElementById('modalProduto').style.display = 'none';
    window.editandoCarrinhoIndex = null;
    
    if (produtoSelecionado) produtoSelecionado._tamanhoSelecionado = null;
    
    produtoSelecionado = null;
    montagemSelecionada = null;
    tamanhoSelecionado = null;
    itensMontagemSelecionados = [];
    saboresSelecionados = [];
    adicionaisSelecionados = [];
    
    const btnAdicionar = document.querySelector('#modalProduto .btn-adicionar-carrinho');
    if (btnAdicionar) btnAdicionar.innerHTML = '<i class="fas fa-cart-plus"></i> Adicionar ao Carrinho';
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
    
    document.getElementById('saboresPizzaDiv').style.display = 'none';
    document.getElementById('adicionaisDiv').style.display = 'none';
    
    const montagemDiv = document.getElementById('montagemDiv');
    montagemDiv.style.display = 'block';
    montagemDiv.innerHTML = '';
    
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
                <input type="radio" name="tamanhoMontagem" value="${tamanho.id}" ${idx === 0 ? 'checked' : ''} onchange="selecionarTamanho('${tamanho.id}')">
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
                <input type="checkbox" value="${item.id}" data-grupo="${grupo.id}" data-nome="${item.nome}" data-preco="${item.preco}" onchange="toggleItemMontagem(this, '${grupo.id}', '${item.id}', '${item.nome.replace(/'/g, "\\'")}', ${item.preco}, ${grupo.limite})">
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
        const selecionadosNoGrupo = itensMontagemSelecionados.filter(i => i.grupoId === grupoId);
        if (selecionadosNoGrupo.length >= limite) {
            checkbox.checked = false;
            mostrarToast('Limite atingido', `Você só pode escolher até ${limite} item(ns) em "${grupo.nome}"`, 'alerta');
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
    if (tamanhoSelecionado) preco += tamanhoSelecionado.preco;
    itensMontagemSelecionados.forEach(item => { preco += item.preco || 0; });
    
    document.getElementById('modalProdutoPreco').innerHTML = formatarPreco(preco);
}

// ============================================
// ===== ADICIONAR AO CARRINHO ===============
// ============================================

function adicionarAoCarrinho() {
    if (montagemSelecionada) {
        for (const grupo of montagemSelecionada.grupos) {
            if (grupo.obrigatorio) {
                const selecionados = itensMontagemSelecionados.filter(i => i.grupoId === grupo.id);
                if (selecionados.length === 0) {
                    mostrarToast('Item obrigatorio', 'Selecione pelo menos 1 item em "' + grupo.nome + '"', 'alerta');
                    return;
                }
            }
        }
        
        let precoFinal = montagemSelecionada.precoBase;
        if (tamanhoSelecionado) precoFinal += tamanhoSelecionado.preco;
        itensMontagemSelecionados.forEach(item => { precoFinal += item.preco || 0; });
        
        let descricaoMontagem = [];
        
        
        montagemSelecionada.grupos.forEach(grupo => {
            const itensDoGrupo = itensMontagemSelecionados.filter(i => i.grupoId === grupo.id);
            if (itensDoGrupo.length > 0) {
                descricaoMontagem.push(grupo.nome + ': ' + itensDoGrupo.map(i => i.nome + (i.preco > 0 ? ' (+' + formatarPreco(i.preco) + ')' : '')).join(', '));
            }
        });
        
        const nomeFinal = montagemSelecionada.nome + (tamanhoSelecionado ? ' (' + tamanhoSelecionado.nome + ')' : '');
        
        const itemCarrinho = {
            id: montagemSelecionada.id + '-' + Date.now(),
            produtoId: montagemSelecionada.id,
            tipo: 'montagem',
            nome: nomeFinal,
            precoUnitario: precoFinal,
            precoBase: montagemSelecionada.precoBase,
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
            mostrarToast(nomeFinal + ' adicionado ao carrinho!', 'sucesso');
        }
        
        montagemSelecionada = null;
        tamanhoSelecionado = null;
        itensMontagemSelecionados = [];
        
    } else if (produtoSelecionado) {
        let precoFinal;
        let nomeFinal = produtoSelecionado.nome;
        
        // Pizza com tamanho
        if (produtoSelecionado.categoria === 'pizza' && produtoSelecionado._tamanhoSelecionado) {
            precoFinal = produtoSelecionado._tamanhoSelecionado.preco;
            nomeFinal = produtoSelecionado.nome + ' ' + produtoSelecionado._tamanhoSelecionado.id;
        } else {
            precoFinal = produtoSelecionado.preco;
        }
        
        adicionaisSelecionados.forEach(adicional => {
            precoFinal += adicional.preco;
        });
        
        const itemCarrinho = {
            id: produtoSelecionado.id + '-' + Date.now(),
            produtoId: produtoSelecionado.id,
            tipo: 'produto',
            nome: nomeFinal,
            precoUnitario: precoFinal,
            precoBase: produtoSelecionado.preco,
            quantidade: quantidadeSelecionada,
            observacao: document.getElementById('obsItem').value,
            adicionais: adicionaisSelecionados.map(a => ({
                nome: a.nome,
                preco: a.preco
            })),
            tamanhoPizza: produtoSelecionado._tamanhoSelecionado || null
        };
        
        if (window.editandoCarrinhoIndex !== undefined && window.editandoCarrinhoIndex !== null) {
            carrinho[window.editandoCarrinhoIndex] = itemCarrinho;
            window.editandoCarrinhoIndex = null;
            mostrarToast('Item atualizado!', 'sucesso');
        } else {
            carrinho.push(itemCarrinho);
            mostrarToast(nomeFinal + ' adicionado ao carrinho!', 'sucesso');
        }
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
const precoBase = item.precoBase || item.precoUnitario;
const subtotal = item.precoUnitario * item.quantidade;
total += subtotal;
        
        const div = document.createElement('div');
        div.className = 'carrinho-item';
        
        let detalhesHtml = '';
if (item.tipo === 'montagem' && item.montagemDetalhes) {
    detalhesHtml = '<div class="item-adicionais" style="font-size: 0.75rem;">';
    if (item.montagemDetalhes.tamanho) {
        var t = item.montagemDetalhes.tamanho;
        detalhesHtml += t.nome + (t.preco > 0 ? ' (+' + formatarPreco(t.preco) + ')' : '') + '<br>';
    }
    var descricao = item.montagemDetalhes.descricao || [];
    descricao.forEach(function(linha) {
        detalhesHtml += linha + '<br>';
    });
    detalhesHtml += '</div>';
}
        
        let adicionaisHtml = '';
        if (item.adicionais && item.adicionais.length) {
            adicionaisHtml = `<div class="item-adicionais">➕ ${item.adicionais.map(a => {
                const precoExibicao = a.preco < 100 ? a.preco * 100 : a.preco;
                return `${a.nome}${a.preco > 0 ? ` (+${formatarPreco(precoExibicao)})` : ''}`;
            }).join(', ')}</div>`;
        }
        
      div.innerHTML = `
    <div class="item-header">
        <span class="item-nome">${item.quantidade}x ${item.nome}</span>
        <span class="item-preco">${formatarPreco(subtotal)}</span>
    </div>
    ${detalhesHtml}
    ${adicionaisHtml}
    ${(item.precoBase && item.precoBase !== item.precoUnitario) ? `<div class="item-adicionais" style="font-size:0.7rem; color:#888;">Preço base: ${formatarPreco(item.precoBase)}</div>` : ''}
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
   
    atualizarTotalCarrinho();
    atualizarCarrinhoMobileBar();
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
        abrirModalMontagem(item.produtoId);
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
            document.querySelectorAll('#saboresLista input[type="checkbox"]').forEach(cb => {
                cb.checked = saboresSelecionados.some(s => s.id === cb.value);
            });
            document.querySelectorAll('#adicionaisLista input[type="checkbox"]').forEach(cb => {
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
// ===== VERIFICAÇÃO DE HORÁRIO ==============
// ============================================

function verificarHorario() {
    const status = verificarStatusLoja();
    
    const statusDiv = document.getElementById('statusHorarioHeader');
if (status.aberto) {
    statusDiv.innerHTML = '<i class="fas fa-door-open"></i> ABERTO';
    statusDiv.className = 'status-horario aberto';
} else {
    statusDiv.innerHTML = '<i class="fas fa-door-closed"></i> FECHADO';
    statusDiv.className = 'status-horario fechado';
}
    
    // Atualiza cards visíveis
    atualizarInterfaceHorarios();
    
    return status.aberto;
}

function atualizarInterfaceHorarios() {
    document.querySelectorAll('.produto-card').forEach(card => {
        const categoria = card.dataset.categoria;
        if (!categoria) return;
        
        const status = verificarStatusLoja();
        const agora = new Date();
        const disponivel = status.aberto && isCategoriaDisponivel(categoria, agora);
        
        card.classList.toggle('fora-horario', !disponivel);
    });
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
        if (typeof abrirModalLogin === 'function') abrirModalLogin();
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
            if (typeof abrirModalLogin === 'function') abrirModalLogin();
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
document.addEventListener('DOMContentLoaded', () => { setTimeout(initMobileFixes, 500); });

// ============================================
// ===== 🆕 FUNÇÕES DE CUPOM =================
// ============================================

function aplicarCupom() {
    const codigo = document.getElementById('codigoCupom').value.trim();
    
    if (!codigo) {
        mostrarToast('Digite um código', 'Informe o código do cupom', 'alerta');
        return;
    }
    
    // Calcula subtotal atual
    const subtotalCentavos = carrinho.reduce((sum, item) => 
        sum + (item.precoUnitario * item.quantidade), 0);
    
    if (subtotalCentavos === 0) {
        mostrarToast('Carrinho vazio', 'Adicione itens ao carrinho primeiro', 'alerta');
        return;
    }
    
    // Valida o cupom
    const resultado = validarCupom(codigo, subtotalCentavos);
    
    const cupomInfo = document.getElementById('cupomInfo');
    
    if (!resultado.valido) {
        cupomInfo.innerHTML = `<p style="color: #e53935;">❌ ${resultado.mensagem}</p>`;
        mostrarToast('Cupom inválido', resultado.mensagem, 'erro');
        cupomAplicado = null;
        atualizarResumoCupom();
        return;
    }
    
    // Cupom válido!
    cupomAplicado = {
        codigo: codigo.toUpperCase(),
        descontoCentavos: resultado.descontoCentavos,
        cupom: resultado.cupom
    };
    
    cupomInfo.innerHTML = `<p style="color: #2e7d32;">✅ ${resultado.mensagem}</p>`;
    mostrarToast('Cupom aplicado!', resultado.mensagem, 'sucesso');
    
    atualizarResumoCupom();
    atualizarTotalCarrinho();
}

function removerCupom() {
    cupomAplicado = null;
    document.getElementById('codigoCupom').value = '';
    document.getElementById('cupomInfo').innerHTML = '';
    atualizarResumoCupom();
    atualizarTotalCarrinho();
    mostrarToast('Cupom removido', 'O desconto foi removido do carrinho', 'info');
}

function atualizarResumoCupom() {
    const descontoResumo = document.getElementById('descontoResumo');
    const valorDesconto = document.getElementById('valorDesconto');
    
    if (cupomAplicado) {
        descontoResumo.style.display = 'block';
        valorDesconto.textContent = `-${formatarPreco(cupomAplicado.descontoCentavos)}`;
    } else {
        descontoResumo.style.display = 'none';
    }
}

function atualizarTotalCarrinho() {
    const subtotalCentavos = carrinho.reduce((sum, item) => 
        sum + (item.precoUnitario * item.quantidade), 0);
    
    let totalFinal = subtotalCentavos;
    
    if (cupomAplicado) {
        totalFinal = Math.max(0, subtotalCentavos - cupomAplicado.descontoCentavos);
    }
    
    document.getElementById('totalCarrinho').innerHTML = formatarPreco(totalFinal);
}

// ============================================
// 🆕 CARRINHO MOBILE (DRAWER)
// ============================================

function abrirCarrinhoMobile() {
    if (carrinho.length === 0) {
        mostrarToast('Carrinho vazio', 'Adicione itens primeiro', 'info');
        return;
    }

    const overlay = document.getElementById('carrinhoMobileOverlay');
    const sidebar = document.querySelector('.sidebar');

    overlay.classList.add('aberto');
    sidebar.classList.add('aberto');

    document.body.style.overflow = 'hidden';

    // 🔥 animação suave de entrada
    sidebar.classList.add('animando');
    setTimeout(() => sidebar.classList.remove('animando'), 300);
}

function fecharCarrinhoMobile() {
    const overlay = document.getElementById('carrinhoMobileOverlay');
    const sidebar = document.querySelector('.sidebar');

    overlay.classList.remove('aberto');
    sidebar.classList.remove('aberto');

    document.body.style.overflow = '';
}


function atualizarCarrinhoMobileBar() {
    const barra = document.getElementById('carrinhoMobileBar');
    const elQtd = document.getElementById('carrinhoMobileQtd');
    const elTotal = document.getElementById('carrinhoMobileTotal');

    if (!barra || !elQtd || !elTotal) return;

    // ⬇️ SÓ NO MOBILE
    const isMobile = window.innerWidth <= 900;
    if (!isMobile) {
        barra.classList.remove('show');
        return;
    }

    const qtd = carrinho.reduce((total, item) => total + item.quantidade, 0);
    let total = carrinho.reduce((soma, item) => soma + (item.precoUnitario * item.quantidade), 0);

    if (cupomAplicado) {
        total = Math.max(0, total - cupomAplicado.descontoCentavos);
    }

    elQtd.textContent = `${qtd} ${qtd === 1 ? 'item' : 'itens'}`;
    elTotal.textContent = formatarPreco(total);

    // Mostrar ou esconder baseado nos itens
    if (qtd > 0) {
        barra.classList.add('show');
    } else {
        barra.classList.remove('show');
    }
}

// ============================================
// ===== CUPONS NO HEADER =====================
// ============================================

function atualizarCuponsHeader() {
    const cuponsHeader = document.getElementById('cuponsHeader');
    const tooltip = document.getElementById('cuponsHeaderTooltip');
    
    if (!cuponsHeader || !tooltip) return;
    
    const cuponsExibir = cupons.filter(function(c) {
    if (!c.ativo || c.exibirNoSite !== true) return false;
    
    // Verifica se atingiu limite
    if (c.tipoLimiteUso === 'limitado' && c.usos >= c.limiteUso) return false;
    if (c.tipoLimiteUso === 'unico' && c.usos >= 1) return false;
    
    return true;
});
    
    if (cuponsExibir.length === 0) {
        cuponsHeader.style.display = 'none';
        return;
    }
    
    cuponsHeader.style.display = 'block';
    
    tooltip.innerHTML = '';
    
    cuponsExibir.forEach(function(cupom) {
        const item = document.createElement('div');
        item.className = 'cupom-tooltip-item';
        
        let descontoTexto = '';
        if (cupom.tipoDesconto === 'percentual') {
            descontoTexto = cupom.valorDesconto + '% de desconto';
        } else {
            descontoTexto = formatarPreco(cupom.valorDesconto) + ' de desconto';
        }
        
        let infoHtml = 
            '<span class="cupom-tooltip-codigo">' + cupom.codigo + '</span>' +
            '<div class="cupom-tooltip-info">' +
                '<i class="fas fa-tag"></i> ' + descontoTexto;
        
        if (cupom.dataExpiracao) {
            infoHtml += '<br><i class="fas fa-calendar"></i> Valido ate ' + cupom.dataExpiracao;
        }
        
        if (cupom.valorMinimoPedido) {
            infoHtml += '<br><i class="fas fa-shopping-cart"></i> Pedido minimo: ' + formatarPreco(cupom.valorMinimoPedido);
        }
        
        infoHtml += '</div>';
        
        item.innerHTML = infoHtml;
        tooltip.appendChild(item);
    });
    
    const btnCupons = document.getElementById('cuponsHeaderBtn');
    
    btnCupons.addEventListener('click', function(e) {
        e.stopPropagation();
        tooltip.classList.toggle('visivel');
    });
    
    document.addEventListener('click', function(e) {
        if (!cuponsHeader.contains(e.target)) {
            tooltip.classList.remove('visivel');
        }
    });
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            tooltip.classList.remove('visivel');
        }
    });
}

function toggleAdicional(checkbox, nome, preco) {
    if (checkbox.checked) {
        adicionaisSelecionados.push({ nome, preco });
    } else {
        adicionaisSelecionados = adicionaisSelecionados.filter(
            adicional => adicional.nome !== nome
        );
    }

    if (!produtoSelecionado) return;

    // Se for pizza, recalcula com o tamanho selecionado
    if (produtoSelecionado.categoria === 'pizza' && produtoSelecionado._tamanhoSelecionado) {
        let precoFinal = produtoSelecionado._tamanhoSelecionado.preco;
        adicionaisSelecionados.forEach(a => { precoFinal += a.preco; });
        document.getElementById('modalProdutoPreco').innerHTML = formatarPreco(precoFinal);
        return;
    }

    // Outros produtos
    let precoFinal = produtoSelecionado.preco;
    adicionaisSelecionados.forEach(adicional => {
        precoFinal += adicional.preco;
    });

    const modalPreco = document.getElementById('modalProdutoPreco');
    if (modalPreco) {
        modalPreco.innerHTML = formatarPreco(precoFinal);
    }
}

function obterMenorPreco(produto) {
    if (produto.categoria !== 'pizza') return produto.preco;
    
    const precos = [];
    if (produto.precoP) precos.push(produto.precoP);
    if (produto.precoM) precos.push(produto.precoM);
    if (produto.precoG) precos.push(produto.precoG);
    if (produto.precoGG) precos.push(produto.precoGG);
    
    if (precos.length > 0) return Math.min(...precos);
    return produto.preco;
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

function obterMenorPrecoMontagem(montagem) {
    if (!montagem.tamanhos || montagem.tamanhos.length === 0) return montagem.precoBase;
    
    const precos = montagem.tamanhos.map(function(t) {
        return montagem.precoBase + t.preco;
    });
    
    return Math.min.apply(null, precos);
}

// ===== EXPOR =====
window.obterMenorPreco = obterMenorPreco;
window.toggleTema = toggleTema;
window.abrirModalProduto = abrirModalProduto;
window.fecharModalProduto = fecharModalProduto;
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
window.verificarHorario = verificarHorario;
window.aplicarCupom = aplicarCupom;
window.removerCupom = removerCupom;
window.atualizarResumoCupom = atualizarResumoCupom;
window.abrirCarrinhoMobile = abrirCarrinhoMobile;
window.fecharCarrinhoMobile = fecharCarrinhoMobile;
window.atualizarCarrinhoMobileBar = atualizarCarrinhoMobileBar;
window.selecionarTamanhoPizza = selecionarTamanhoPizza;

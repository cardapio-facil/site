// ============================================
// ===== FUNÇÕES DE ADMINISTRAÇÃO ============
// ============================================

// ===== LOGIN =====
function abrirModalLogin() {
    document.getElementById('modalLogin').style.display = 'flex';
    document.getElementById('senhaAdmin').value = '';
    document.getElementById('erroLogin').style.display = 'none';
    
    // Foca no campo de senha e adiciona evento de Enter
    setTimeout(() => {
        const senhaInput = document.getElementById('senhaAdmin');
        if (senhaInput) {
            senhaInput.focus();
            
            // Remove evento antigo para não duplicar
            senhaInput.removeEventListener('keypress', loginEnterHandler);
            // Adiciona o evento de Enter
            senhaInput.addEventListener('keypress', loginEnterHandler);
        }
    }, 100);
}

// Função auxiliar para capturar o Enter
function loginEnterHandler(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        verificarLogin();
    }
}

function fecharModalLogin() {
    document.getElementById('modalLogin').style.display = 'none';
}

function toggleSenha() {
    const input = document.getElementById('senhaAdmin');
    input.type = input.type === 'password' ? 'text' : 'password';
}

function verificarLogin() {
    const senha = document.getElementById('senhaAdmin').value;
    
    if (senha === SENHA_MASTER) {
        adminLogado = true;
        nivelAcesso = 'master';
        fecharModalLogin();
        mostrarToast('Bem-vindo, Master!', 'sucesso');
        atualizarInterfaceAdmin();
        abrirModalAdmin();
    } else if (senha === SENHA_VIEW) {
        adminLogado = true;
        nivelAcesso = 'view';
        fecharModalLogin();
        mostrarToast('Modo visualização', 'info');
        atualizarInterfaceAdmin();
        abrirModalAdmin();
    } else {
        document.getElementById('erroLogin').style.display = 'block';
        mostrarToast('Senha incorreta!', 'erro');
    }
}

function atualizarInterfaceAdmin() {
    const adminBtn = document.getElementById('adminBtn');
    if (adminLogado) {
        adminBtn.innerHTML = '👑 Admin (Logado)';
        adminBtn.classList.add('logado');
        adminBtn.style.display = 'inline-block';  // ← Mostra o botão
    } else {
        adminBtn.innerHTML = '👤 Área Admin';
        adminBtn.classList.remove('logado');
        adminBtn.style.display = 'none';  // ← ESCONDE completamente
    }
    
    const gerenciarBtn = document.getElementById('gerenciarDestaquesBtn');
    if (gerenciarBtn) {
        gerenciarBtn.style.display = adminLogado ? 'inline-flex' : 'none';
    }
    
    renderizarProdutos();
}

function logout() {
    adminLogado = false;
    nivelAcesso = null;
    atualizarInterfaceAdmin();
    fecharModalAdmin();
    mostrarToast('Logout realizado', 'info');
}

// ===== MODAL ADMIN =====
function abrirModalAdmin() {
    if (!adminLogado) {
        abrirModalLogin();
        return;
    }
    
    carregarAdminProdutos();
    carregarAdminCategorias();
    carregarAdminAdicionais();
    carregarAdminPedidos();
    carregarAdminConfig();
    
    document.getElementById('modalAdmin').style.display = 'flex';
}

function fecharModalAdmin() {
    document.getElementById('modalAdmin').style.display = 'none';
}

function mostrarAbaAdmin(aba) {
    document.getElementById('adminProdutos').style.display = aba === 'produtos' ? 'block' : 'none';
    document.getElementById('adminCategorias').style.display = aba === 'categorias' ? 'block' : 'none';
    document.getElementById('adminAdicionais').style.display = aba === 'adicionais' ? 'block' : 'none';
    document.getElementById('adminPedidos').style.display = aba === 'pedidos' ? 'block' : 'none';
    document.getElementById('adminConfig').style.display = aba === 'config' ? 'block' : 'none';
    
    document.querySelectorAll('.admin-tabs .categoria-tab').forEach(tab => {
        tab.classList.remove('ativo');
    });
    
    const tabs = document.querySelectorAll('.admin-tabs .categoria-tab');
    const index = ['produtos', 'categorias', 'adicionais', 'pedidos', 'config'].indexOf(aba);
    if (index >= 0) tabs[index].classList.add('ativo');
}

// ===== ADMIN PRODUTOS =====
function carregarAdminProdutos() {
    const container = document.getElementById('adminProdutosLista');
    container.innerHTML = '';
    
    const selectCategoria = document.getElementById('produtoCategoria');
    selectCategoria.innerHTML = '';
    categorias.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = getNomeCategoria(cat);
        selectCategoria.appendChild(option);
    });
    
    produtos.forEach(produto => {
        const div = document.createElement('div');
        div.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px;
            border-bottom: 1px solid var(--cor-borda);
        `;
        div.innerHTML = `
            <div>
                <strong>${produto.nome}</strong><br>
                <small>${getNomeCategoria(produto.categoria)} | ${formatarPreco(produto.preco)}</small>
                <small>${produto.disponivel ? '✅ Disponível' : '❌ Indisponível'}</small>
            </div>
            <div>
                <button onclick="editarProduto('${produto.id}')" style="background:none; border:none; cursor:pointer; font-size:1.2rem;">✏️</button>
                <button onclick="excluirProduto('${produto.id}')" style="background:none; border:none; cursor:pointer; color:red; font-size:1.2rem;">🗑️</button>
            </div>
        `;
        container.appendChild(div);
    });
}

function abrirModalCadastroProduto() {
    if (nivelAcesso !== 'master') {
        mostrarToast('Apenas Master pode cadastrar produtos', 'alerta');
        return;
    }
    
    produtoEditando = null;
    document.getElementById('cadastroProdutoTitulo').innerHTML = '➕ Novo Produto';
    document.getElementById('editProdutoId').value = '';
    document.getElementById('produtoNome').value = '';
    document.getElementById('produtoDesc').value = '';
    document.getElementById('produtoPreco').value = '';
    document.getElementById('produtoImagem').value = '';
    document.getElementById('produtoDisponivel').checked = true;
    document.getElementById('produtoDestaque').checked = false;
    
    // 🍕 Esconde o campo de sabores (não é mais usado)
    const saboresCadastro = document.getElementById('saboresCadastro');
    if (saboresCadastro) {
        saboresCadastro.style.display = 'none';
    }
    
    document.getElementById('modalCadastroProduto').style.display = 'flex';
}

function editarProduto(id) {
    if (nivelAcesso !== 'master') {
        mostrarToast('Apenas Master pode editar produtos', 'alerta');
        return;
    }
    
    const produto = produtos.find(p => p.id === id);
    if (!produto) return;
    
    produtoEditando = produto;
    document.getElementById('cadastroProdutoTitulo').innerHTML = '✏️ Editar Produto';
    document.getElementById('editProdutoId').value = produto.id;
    document.getElementById('produtoNome').value = produto.nome;
    document.getElementById('produtoDesc').value = produto.descricao || '';
    document.getElementById('produtoPreco').value = produto.preco;
    document.getElementById('produtoImagem').value = produto.imagem || '';
    document.getElementById('produtoDisponivel').checked = produto.disponivel;
    document.getElementById('produtoDestaque').checked = produto.destaque || false;
    document.getElementById('produtoCategoria').value = produto.categoria;
    
    // 🍕 Esconde o campo de sabores (não é mais usado)
    const saboresCadastro = document.getElementById('saboresCadastro');
    if (saboresCadastro) {
        saboresCadastro.style.display = 'none';
    }
    
    document.getElementById('modalCadastroProduto').style.display = 'flex';
}

function fecharModalCadastroProduto() {
    document.getElementById('modalCadastroProduto').style.display = 'none';
}

async function salvarProduto() {
    if (nivelAcesso !== 'master') {
        mostrarToast('Apenas Master pode salvar produtos', 'alerta');
        return;
    }
    
    const nome = document.getElementById('produtoNome').value.trim();
    const preco = parseFloat(document.getElementById('produtoPreco').value);
    const categoria = document.getElementById('produtoCategoria').value;
    
    if (!nome || isNaN(preco)) {
        mostrarToast('Preencha nome e preço corretamente', 'alerta');
        return;
    }
    
    const produto = {
        id: produtoEditando ? produtoEditando.id : gerarId(),
        nome: nome,
        descricao: document.getElementById('produtoDesc').value,
        preco: preco,
        categoria: categoria,
        imagem: document.getElementById('produtoImagem').value,
        disponivel: document.getElementById('produtoDisponivel').checked,
        destaque: document.getElementById('produtoDestaque').checked
    };
    
    // 🍕 Remove o campo sabores (não é mais usado, cada produto de pizza já é um sabor)
    // O campo sabores não é mais salvo
    
    if (produtoEditando) {
        const index = produtos.findIndex(p => p.id === produtoEditando.id);
        produtos[index] = produto;
    } else {
        produtos.push(produto);
    }
    
    const sucesso = await salvarProdutosFirebase(produtos);
    if (sucesso) {
        mostrarToast('Produto salvo com sucesso!', 'sucesso');
        fecharModalCadastroProduto();
        renderizarProdutos();
        abrirModalAdmin();
    }
}

async function excluirProduto(id) {
    if (nivelAcesso !== 'master') {
        mostrarToast('Apenas Master pode excluir produtos', 'alerta');
        return;
    }
    
    if (confirm('Tem certeza que deseja excluir este produto?')) {
        produtos = produtos.filter(p => p.id !== id);
        const sucesso = await salvarProdutosFirebase(produtos);
        if (sucesso) {
            mostrarToast('Produto excluído!', 'sucesso');
            renderizarProdutos();
            abrirModalAdmin();
        }
    }
}

// ===== ADMIN CATEGORIAS =====
function carregarAdminCategorias() {
    const container = document.getElementById('listaCategorias');
    container.innerHTML = '';
    
    categorias.forEach((cat) => {
        const div = document.createElement('div');
        div.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px;
            border-bottom: 1px solid var(--cor-borda);
        `;
        
        // 🍕 Para a categoria pizza, mostra um ícone de cadeado e NÃO mostra botão de excluir
        if (cat === 'pizza') {
            div.innerHTML = `
                <span>🔒 ${getIconeCategoria(cat)} ${getNomeCategoria(cat)} <small style="color: #e65100;">(fixa)</small></span>
                <span style="color: #999; font-size: 0.8rem;">🔒 Protegida</span>
            `;
        } else {
            div.innerHTML = `
                <span>${getIconeCategoria(cat)} ${getNomeCategoria(cat)}</span>
                <button onclick="excluirCategoria('${cat}')" style="background:none; border:none; color:red; cursor:pointer;">🗑️</button>
            `;
        }
        
        container.appendChild(div);
    });
}

async function adicionarCategoria() {
    if (nivelAcesso !== 'master') {
        mostrarToast('Apenas Master pode adicionar categorias', 'alerta');
        return;
    }
    
    const novaCat = document.getElementById('novaCategoria').value.trim().toLowerCase().replace(/\s/g, '-');
    
    // 🍕 Bloqueia tentativa de criar categoria "pizza" duplicada
    if (novaCat === 'pizza') {
        mostrarToast('Ação bloqueada', 'A categoria Pizza já existe e é fixa no sistema', 'alerta');
        return;
    }
    
    if (novaCat && !categorias.includes(novaCat)) {
        categorias.push(novaCat);
        const sucesso = await salvarCategoriasFirebase(categorias);
        if (sucesso) {
            mostrarToast('Categoria adicionada!', 'sucesso');
            renderizarTodasCategorias();
            carregarAdminCategorias();
            document.getElementById('novaCategoria').value = '';
        }
    }
}

async function excluirCategoria(cat) {
    if (nivelAcesso !== 'master') {
        mostrarToast('Apenas Master pode excluir categorias', 'alerta');
        return;
    }
    
    // 🍕 Bloqueia exclusão da categoria pizza
    if (cat === 'pizza') {
        mostrarToast('Ação bloqueada', 'A categoria Pizza é fixa e não pode ser excluída', 'alerta');
        return;
    }
    
    if (confirm(`Excluir categoria ${cat}?`)) {
        categorias = categorias.filter(c => c !== cat);
        const sucesso = await salvarCategoriasFirebase(categorias);
        if (sucesso) {
            mostrarToast('Categoria excluída!', 'sucesso');
            renderizarTodasCategorias();
            carregarAdminCategorias();
        }
    }
}

// ===== ADMIN ADICIONAIS =====
function carregarAdminAdicionais() {
    const select = document.getElementById('categoriaAdicional');
    select.innerHTML = '';
    categorias.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = getNomeCategoria(cat);
        select.appendChild(option);
    });
    
    const container = document.getElementById('listaAdicionais');
    container.innerHTML = '';
    
    for (const [categoria, adicionais] of Object.entries(adicionaisPorCategoria)) {
        const catDiv = document.createElement('div');
        catDiv.style.marginBottom = '15px';
        catDiv.innerHTML = `<strong>${getNomeCategoria(categoria)}</strong>`;
        container.appendChild(catDiv);
        
        adicionais.forEach((adicional, idx) => {
            const div = document.createElement('div');
            div.style.cssText = `
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 8px;
                margin-left: 15px;
                border-bottom: 1px solid #eee;
            `;
            div.innerHTML = `
                <span>${adicional.nome} ${adicional.preco > 0 ? `(+${formatarPreco(adicional.preco)})` : ''}</span>
                <button onclick="excluirAdicional('${categoria}', ${idx})" style="background:none; border:none; color:red; cursor:pointer;">🗑️</button>
            `;
            container.appendChild(div);
        });
    }
}

async function adicionarAdicional() {
    if (nivelAcesso !== 'master') {
        mostrarToast('Apenas Master pode adicionar adicionais', 'alerta');
        return;
    }
    
    const categoria = document.getElementById('categoriaAdicional').value;
    const nome = document.getElementById('nomeAdicional').value.trim();
    const preco = parseFloat(document.getElementById('precoAdicional').value) || 0;
    
    if (!nome) {
        mostrarToast('Digite o nome do adicional', 'alerta');
        return;
    }
    
    if (!adicionaisPorCategoria[categoria]) adicionaisPorCategoria[categoria] = [];
    adicionaisPorCategoria[categoria].push({ nome, preco });
    
    const sucesso = await salvarAdicionaisFirebase(adicionaisPorCategoria);
    if (sucesso) {
        mostrarToast('Adicional adicionado!', 'sucesso');
        document.getElementById('nomeAdicional').value = '';
        document.getElementById('precoAdicional').value = '';
        carregarAdminAdicionais();
    }
}

async function excluirAdicional(categoria, index) {
    if (nivelAcesso !== 'master') {
        mostrarToast('Apenas Master pode excluir adicionais', 'alerta');
        return;
    }
    
    adicionaisPorCategoria[categoria].splice(index, 1);
    const sucesso = await salvarAdicionaisFirebase(adicionaisPorCategoria);
    if (sucesso) {
        mostrarToast('Adicional removido!', 'sucesso');
        carregarAdminAdicionais();
    }
}

// ===== ADMIN PEDIDOS =====
async function carregarAdminPedidos() {
    const data = await carregarDadosFirebase();
    const pedidos = data.pedidos || {};
    
    const container = document.getElementById('listaPedidosAdmin');
    container.innerHTML = '';
    
    const pedidosArray = Object.values(pedidos).sort((a, b) => b.id - a.id);
    
    pedidosArray.forEach(pedido => {
        const div = document.createElement('div');
        div.style.cssText = `
            padding: 15px;
            border-bottom: 1px solid var(--cor-borda);
            margin-bottom: 10px;
            background: #f9f9f9;
            border-radius: 8px;
        `;
        
        const dataPedido = new Date(pedido.data).toLocaleString('pt-BR');
        
        let statusCor = '#f39c12';
        if (pedido.status === 'entregue') statusCor = '#2ecc71';
        if (pedido.status === 'cancelado') statusCor = '#e74c3c';
        
        div.innerHTML = `
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <strong>Pedido #${pedido.numero || pedido.id.slice(-4)}</strong>
                <span style="background: ${statusCor}; color: white; padding: 2px 10px; border-radius: 20px; font-size: 0.8rem;">
                    ${pedido.status || 'novo'}
                </span>
            </div>
            <div><i class="fas fa-user"></i> ${pedido.cliente?.nome || 'N/A'}</div>
            <div><i class="fas fa-phone"></i> ${pedido.cliente?.telefone || 'N/A'}</div>
            <div><i class="fas fa-clock"></i> ${dataPedido}</div>
            <div style="margin-top: 10px;"><strong>Itens:</strong></div>
            ${pedido.itens?.map(item => `
                <div style="margin-left: 10px; font-size: 0.9rem;">
                    ${item.quantidade}x ${item.nome} - ${formatarPreco(item.precoUnitario * item.quantidade)}
                    ${item.sabores && item.sabores.length ? `<br><small>🍕 Sabores: ${item.sabores.map(s => s.nome).join(' e ')}</small>` : ''}
                    ${item.adicionais && item.adicionais.length ? `<br><small>➕ ${item.adicionais.map(a => a.nome).join(', ')}</small>` : ''}
                    ${item.observacao ? `<br><small>📝 ${item.observacao}</small>` : ''}
                </div>
            `).join('') || ''}
            <div style="margin-top: 10px; font-weight: bold; text-align: right;">
                Total: ${formatarPreco(pedido.total)}
            </div>
            ${pedido.status !== 'entregue' && pedido.status !== 'cancelado' ? `
                <div style="margin-top: 10px; display: flex; gap: 10px;">
                    <button onclick="atualizarStatusPedido('${pedido.id}', 'entregue')" 
                        style="padding: 8px 15px; background: var(--cor-sucesso); color: white; border: none; border-radius: 8px; cursor: pointer;">
                        ✅ Marcar Entregue
                    </button>
                    <button onclick="atualizarStatusPedido('${pedido.id}', 'cancelado')" 
                        style="padding: 8px 15px; background: var(--cor-erro); color: white; border: none; border-radius: 8px; cursor: pointer;">
                        ❌ Cancelar
                    </button>
                </div>
            ` : ''}
        `;
        container.appendChild(div);
    });
}

async function atualizarStatusPedido(id, status) {
    if (nivelAcesso !== 'master') {
        mostrarToast('Apenas Master pode alterar status', 'alerta');
        return;
    }
    
    const sucesso = await atualizarStatusPedidoFirebase(id, status);
    if (sucesso) {
        mostrarToast(`Pedido ${status}!`, 'sucesso');
        carregarAdminPedidos();
    }
}

// ===== ADMIN CONFIG =====
function carregarAdminConfig() {
    document.getElementById('configHoraAbre').value = configRestaurante.horaAbre;
    document.getElementById('configHoraFecha').value = configRestaurante.horaFecha;
    document.getElementById('configTipoFrete').value = configRestaurante.tipoFrete;
    document.getElementById('configFreteFixo').value = configRestaurante.freteFixo;
    document.getElementById('configFreteFixo').style.display = configRestaurante.tipoFrete === 'fixo' ? 'inline-block' : 'none';
}

function toggleFreteFixo() {
    const tipo = document.getElementById('configTipoFrete').value;
    document.getElementById('configFreteFixo').style.display = tipo === 'fixo' ? 'inline-block' : 'none';
}

async function salvarConfiguracoes() {
    if (nivelAcesso !== 'master') {
        mostrarToast('Apenas Master pode salvar configurações', 'alerta');
        return;
    }
    
    configRestaurante.horaAbre = document.getElementById('configHoraAbre').value;
    configRestaurante.horaFecha = document.getElementById('configHoraFecha').value;
    configRestaurante.tipoFrete = document.getElementById('configTipoFrete').value;
    configRestaurante.freteFixo = parseFloat(document.getElementById('configFreteFixo').value) || 0;
    
    const sucesso = await salvarConfigFirebase(configRestaurante);
    if (sucesso) {
        mostrarToast('Configurações salvas!', 'sucesso');
        verificarHorario();
    }
}

// ===== ADMIN DESTAQUES =====
function abrirGerenciarDestaques() {
    if (nivelAcesso !== 'master') {
        mostrarToast('Apenas Master pode gerenciar destaques', 'alerta');
        return;
    }
    
    const container = document.getElementById('listaProdutosDestaques');
    container.innerHTML = '';
    
    produtos.forEach(produto => {
        const div = document.createElement('div');
        div.style.cssText = `
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 10px;
            border-bottom: 1px solid var(--cor-borda);
        `;
        div.innerHTML = `
            <input type="checkbox" id="destaque_${produto.id}" ${produto.destaque ? 'checked' : ''}>
            <label for="destaque_${produto.id}">${produto.nome} - ${formatarPreco(produto.preco)}</label>
        `;
        container.appendChild(div);
    });
    
    document.getElementById('modalGerenciarDestaques').style.display = 'flex';
}

function fecharModalGerenciarDestaques() {
    document.getElementById('modalGerenciarDestaques').style.display = 'none';
}

async function salvarDestaques() {
    if (nivelAcesso !== 'master') {
        mostrarToast('Apenas Master pode salvar destaques', 'alerta');
        return;
    }
    
    produtos.forEach(produto => {
        const checkbox = document.getElementById(`destaque_${produto.id}`);
        if (checkbox) {
            produto.destaque = checkbox.checked;
        }
    });
    
    const sucesso = await salvarProdutosFirebase(produtos);
    if (sucesso) {
        mostrarToast('Destaques atualizados!', 'sucesso');
        fecharModalGerenciarDestaques();
        renderizarProdutos();
    }
}

// ===== EXPOR FUNÇÕES GLOBALMENTE =====
window.abrirModalLogin = abrirModalLogin;
window.fecharModalLogin = fecharModalLogin;
window.toggleSenha = toggleSenha;
window.verificarLogin = verificarLogin;
window.logout = logout;
window.abrirModalAdmin = abrirModalAdmin;
window.fecharModalAdmin = fecharModalAdmin;
window.mostrarAbaAdmin = mostrarAbaAdmin;
window.abrirModalCadastroProduto = abrirModalCadastroProduto;
window.fecharModalCadastroProduto = fecharModalCadastroProduto;
window.salvarProduto = salvarProduto;
window.editarProduto = editarProduto;
window.excluirProduto = excluirProduto;
window.adicionarCategoria = adicionarCategoria;
window.excluirCategoria = excluirCategoria;
window.adicionarAdicional = adicionarAdicional;
window.excluirAdicional = excluirAdicional;
window.atualizarStatusPedido = atualizarStatusPedido;
window.toggleFreteFixo = toggleFreteFixo;
window.salvarConfiguracoes = salvarConfiguracoes;
window.abrirGerenciarDestaques = abrirGerenciarDestaques;
window.fecharModalGerenciarDestaques = fecharModalGerenciarDestaques;
window.salvarDestaques = salvarDestaques;

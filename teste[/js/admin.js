// ============================================
// ===== FUNÇÕES DE ADMINISTRAÇÃO ============
// ============================================

// ===== LOGIN =====
function abrirModalLogin() {
    document.getElementById('modalLogin').style.display = 'flex';
    document.getElementById('senhaAdmin').value = '';
    document.getElementById('erroLogin').style.display = 'none';
    
    setTimeout(() => {
        const senhaInput = document.getElementById('senhaAdmin');
        if (senhaInput) {
            senhaInput.focus();
            senhaInput.removeEventListener('keypress', loginEnterHandler);
            senhaInput.addEventListener('keypress', loginEnterHandler);
        }
    }, 100);
}

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
        adminBtn.style.display = 'inline-block';
    } else {
        adminBtn.innerHTML = '👤 Área Admin';
        adminBtn.classList.remove('logado');
        adminBtn.style.display = 'none';
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
    carregarAdminMontagens();
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
    document.getElementById('adminMontagens').style.display = aba === 'montagens' ? 'block' : 'none';
    document.getElementById('adminConfig').style.display = aba === 'config' ? 'block' : 'none';
    
    document.querySelectorAll('.admin-tabs .categoria-tab').forEach(tab => {
        tab.classList.remove('ativo');
    });
    
    const tabs = document.querySelectorAll('.admin-tabs .categoria-tab');
    const index = ['produtos', 'categorias', 'adicionais', 'montagens', 'config'].indexOf(aba);
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
        
        const visivel = categoriasVisiveis[cat] !== false;
        
        if (cat === 'pizza') {
            div.innerHTML = `
                <span>🔒 ${getIconeCategoria(cat)} ${getNomeCategoria(cat)} <small style="color: #e65100;">(fixa)</small></span>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <label style="font-size: 0.8rem; cursor: pointer;">
                        <input type="checkbox" ${visivel ? 'checked' : ''} onchange="toggleVisibilidadeCategoria('${cat}', this.checked)" ${nivelAcesso !== 'master' ? 'disabled' : ''}>
                        Visível
                    </label>
                    <span style="color: #999; font-size: 0.8rem;">🔒</span>
                </div>
            `;
        } else {
            div.innerHTML = `
                <span>${getIconeCategoria(cat)} ${getNomeCategoria(cat)}</span>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <label style="font-size: 0.8rem; cursor: pointer;">
                        <input type="checkbox" ${visivel ? 'checked' : ''} onchange="toggleVisibilidadeCategoria('${cat}', this.checked)" ${nivelAcesso !== 'master' ? 'disabled' : ''}>
                        Visível
                    </label>
                    <button onclick="excluirCategoria('${cat}')" style="background:none; border:none; color:red; cursor:pointer;">🗑️</button>
                </div>
            `;
        }
        
        container.appendChild(div);
    });
}

async function toggleVisibilidadeCategoria(cat, visivel) {
    if (nivelAcesso !== 'master') {
        mostrarToast('Apenas Master pode alterar visibilidade', 'alerta');
        return;
    }
    
    categoriasVisiveis[cat] = visivel;
    
    const sucesso = await salvarCategoriasVisiveisFirebase(categoriasVisiveis);
    if (sucesso) {
        const status = visivel ? 'visível' : 'oculta';
        mostrarToast(`Categoria ${getNomeCategoria(cat)} agora está ${status}`, 'sucesso');
        renderizarTodasCategorias();
    }
}

async function adicionarCategoria() {
    if (nivelAcesso !== 'master') {
        mostrarToast('Apenas Master pode adicionar categorias', 'alerta');
        return;
    }
    
    const novaCat = document.getElementById('novaCategoria').value.trim().toLowerCase().replace(/\s/g, '-');
    
    if (novaCat === 'pizza') {
        mostrarToast('Ação bloqueada', 'A categoria Pizza já existe e é fixa no sistema', 'alerta');
        return;
    }
    
    if (novaCat && !categorias.includes(novaCat)) {
        categorias.push(novaCat);
        categoriasVisiveis[novaCat] = true;
        await salvarCategoriasVisiveisFirebase(categoriasVisiveis);
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

// ============================================
// ===== 🛠️ ADMIN MONTAGENS ==================
// ============================================

let montagemEditando = null;

function carregarAdminMontagens() {
    const container = document.getElementById('listaMontagens');
    container.innerHTML = '';
    
    if (montagens.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; color: var(--cor-texto-claro);">
                <i class="fas fa-puzzle-piece" style="font-size: 3rem; opacity: 0.3;"></i>
                <p>Nenhuma montagem cadastrada</p>
                <p style="font-size: 0.8rem;">Crie sua primeira montagem para "Monte o Produto"</p>
            </div>
        `;
        return;
    }
    
    montagens.forEach(montagem => {
        const totalItens = montagem.grupos.reduce((sum, g) => sum + g.itens.length, 0);
        
        const div = document.createElement('div');
        div.style.cssText = `
            padding: 15px;
            border: 1px solid var(--cor-borda);
            border-radius: 12px;
            margin-bottom: 10px;
            background: #fafafa;
        `;
        div.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: start;">
                <div>
                    <strong style="font-size: 1.1rem;">🧩 ${montagem.nome}</strong>
                    <div style="margin-top: 5px; font-size: 0.85rem; color: var(--cor-texto-claro);">
                        📂 ${getNomeCategoria(montagem.categoria)} | 
                        💰 Base: ${formatarPreco(montagem.precoBase)} | 
                        📏 ${montagem.tamanhos?.length || 0} tamanhos | 
                        📦 ${montagem.grupos.length} grupos | 
                        📋 ${totalItens} itens
                    </div>
                    <div style="margin-top: 3px;">
                        ${montagem.disponivel ? '✅ Ativo' : '❌ Inativo'} 
                        ${montagem.destaque ? '⭐ Destaque' : ''}
                    </div>
                </div>
                <div style="display: flex; gap: 5px;">
                    <button onclick="editarMontagem('${montagem.id}')" class="btn-editar-admin" title="Editar">✏️</button>
                    <button onclick="excluirMontagem('${montagem.id}')" class="btn-excluir-admin" title="Excluir">🗑️</button>
                </div>
            </div>
        `;
        container.appendChild(div);
    });
}

function abrirModalNovaMontagem() {
    if (nivelAcesso !== 'master') {
        mostrarToast('Apenas Master pode criar montagens', 'alerta');
        return;
    }
    
    montagemEditando = null;
    document.getElementById('modalMontagemTitulo').innerHTML = '➕ Nova Montagem';
    document.getElementById('editMontagemId').value = '';
    document.getElementById('montagemNome').value = '';
    document.getElementById('montagemDesc').value = '';
    document.getElementById('montagemPrecoBase').value = '';
    document.getElementById('montagemImagem').value = '';
    document.getElementById('montagemDisponivel').checked = true;
    document.getElementById('montagemDestaque').checked = false;
    
    // Preenche select de categoria
    const selectCat = document.getElementById('montagemCategoria');
    selectCat.innerHTML = '';
    categorias.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = getNomeCategoria(cat);
        selectCat.appendChild(option);
    });
    
    // Limpa grupos
    document.getElementById('gruposContainer').innerHTML = '';
    document.getElementById('tamanhosContainer').innerHTML = '';
    
    document.getElementById('modalCadastroMontagem').style.display = 'flex';
}

function editarMontagem(id) {
    if (nivelAcesso !== 'master') {
        mostrarToast('Apenas Master pode editar montagens', 'alerta');
        return;
    }
    
    const montagem = montagens.find(m => m.id === id);
    if (!montagem) return;
    
    montagemEditando = montagem;
    document.getElementById('modalMontagemTitulo').innerHTML = '✏️ Editar Montagem';
    document.getElementById('editMontagemId').value = montagem.id;
    document.getElementById('montagemNome').value = montagem.nome;
    document.getElementById('montagemDesc').value = montagem.descricao || '';
    document.getElementById('montagemPrecoBase').value = montagem.precoBase;
    document.getElementById('montagemImagem').value = montagem.imagem || '';
    document.getElementById('montagemDisponivel').checked = montagem.disponivel;
    document.getElementById('montagemDestaque').checked = montagem.destaque || false;
    
    // Preenche select de categoria
    const selectCat = document.getElementById('montagemCategoria');
    selectCat.innerHTML = '';
    categorias.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = getNomeCategoria(cat);
        if (cat === montagem.categoria) option.selected = true;
        selectCat.appendChild(option);
    });
    
    // Renderiza tamanhos
    renderizarTamanhosMontagem(montagem);
    
    // Renderiza grupos
    renderizarGruposMontagem(montagem);
    
    document.getElementById('modalCadastroMontagem').style.display = 'flex';
}

function fecharModalCadastroMontagem() {
    document.getElementById('modalCadastroMontagem').style.display = 'none';
}

// ===== TAMANHOS =====
function adicionarTamanho() {
    const container = document.getElementById('tamanhosContainer');
    
    const div = document.createElement('div');
    div.className = 'montagem-admin-item';
    div.innerHTML = `
        <input type="text" placeholder="Nome do tamanho" class="input-field" style="flex: 2;">
        <input type="number" placeholder="Preço adicional" step="0.01" value="0" class="input-field-small" style="flex: 1;">
        <button onclick="this.parentElement.remove()" style="background: none; border: none; color: red; cursor: pointer; font-size: 1.2rem;">🗑️</button>
    `;
    container.appendChild(div);
}

function renderizarTamanhosMontagem(montagem) {
    const container = document.getElementById('tamanhosContainer');
    container.innerHTML = '';
    
    if (montagem.tamanhos) {
        montagem.tamanhos.forEach(tamanho => {
            const div = document.createElement('div');
            div.className = 'montagem-admin-item';
            div.innerHTML = `
                <input type="text" value="${tamanho.nome}" class="input-field" style="flex: 2;">
                <input type="number" value="${tamanho.preco}" step="0.01" class="input-field-small" style="flex: 1;">
                <button onclick="this.parentElement.remove()" style="background: none; border: none; color: red; cursor: pointer; font-size: 1.2rem;">🗑️</button>
            `;
            container.appendChild(div);
        });
    }
}

// ===== GRUPOS =====
function adicionarGrupo() {
    const container = document.getElementById('gruposContainer');
    const grupoId = 'grp_' + Date.now();
    
    const div = document.createElement('div');
    div.className = 'grupo-montagem-box';
    div.dataset.grupoId = grupoId;
    div.innerHTML = `
        <div style="display: flex; gap: 10px; align-items: center; margin-bottom: 10px;">
            <input type="text" placeholder="Nome do grupo (ex: Carnes)" class="input-field" style="flex: 2;" onchange="atualizarTituloGrupo(this)">
            <input type="number" placeholder="Limite" value="1" min="1" class="input-field-small" style="width: 80px;">
            <label style="font-size: 0.8rem; white-space: nowrap;">
                <input type="checkbox" checked> Obrigatório
            </label>
            <button onclick="this.closest('.grupo-montagem-box').remove()" style="background: none; border: none; color: red; cursor: pointer; font-size: 1.2rem;">🗑️</button>
        </div>
        <strong class="grupo-titulo" style="font-size: 0.85rem; color: #e65100;">Novo Grupo</strong>
        <div class="itens-grupo-container" style="margin-top: 8px; padding-left: 15px;"></div>
        <button onclick="adicionarItemGrupo(this)" style="margin-top: 8px; padding: 6px 12px; background: #e3f2fd; border: none; border-radius: 8px; cursor: pointer; font-size: 0.8rem;">
            + Adicionar Item
        </button>
        <hr style="margin-top: 10px; border-color: #eee;">
    `;
    container.appendChild(div);
}

function atualizarTituloGrupo(input) {
    const titulo = input.closest('.grupo-montagem-box').querySelector('.grupo-titulo');
    if (titulo) {
        titulo.textContent = input.value || 'Novo Grupo';
    }
}

function adicionarItemGrupo(btn) {
    const container = btn.previousElementSibling;
    
    const div = document.createElement('div');
    div.className = 'montagem-admin-item';
    div.style.marginBottom = '5px';
    div.innerHTML = `
        <input type="text" placeholder="Nome do item" class="input-field" style="flex: 2;">
        <input type="number" placeholder="Preço" step="0.01" value="0" class="input-field-small" style="width: 100px;">
        <label style="font-size: 0.7rem;"><input type="checkbox" checked> Ativo</label>
        <button onclick="this.parentElement.remove()" style="background: none; border: none; color: red; cursor: pointer;">✕</button>
    `;
    container.appendChild(div);
}

function renderizarGruposMontagem(montagem) {
    const container = document.getElementById('gruposContainer');
    container.innerHTML = '';
    
    montagem.grupos.forEach(grupo => {
        const div = document.createElement('div');
        div.className = 'grupo-montagem-box';
        div.dataset.grupoId = grupo.id;
        div.innerHTML = `
            <div style="display: flex; gap: 10px; align-items: center; margin-bottom: 10px;">
                <input type="text" value="${grupo.nome}" class="input-field" style="flex: 2;" onchange="atualizarTituloGrupo(this)">
                <input type="number" value="${grupo.limite}" min="1" class="input-field-small" style="width: 80px;">
                <label style="font-size: 0.8rem; white-space: nowrap;">
                    <input type="checkbox" ${grupo.obrigatorio ? 'checked' : ''}> Obrigatório
                </label>
                <button onclick="this.closest('.grupo-montagem-box').remove()" style="background: none; border: none; color: red; cursor: pointer; font-size: 1.2rem;">🗑️</button>
            </div>
            <strong class="grupo-titulo" style="font-size: 0.85rem; color: #e65100;">${grupo.nome}</strong>
            <div class="itens-grupo-container" style="margin-top: 8px; padding-left: 15px;"></div>
            <button onclick="adicionarItemGrupo(this)" style="margin-top: 8px; padding: 6px 12px; background: #e3f2fd; border: none; border-radius: 8px; cursor: pointer; font-size: 0.8rem;">
                + Adicionar Item
            </button>
            <hr style="margin-top: 10px; border-color: #eee;">
        `;
        
        // Renderiza itens do grupo
        const itensContainer = div.querySelector('.itens-grupo-container');
        grupo.itens.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'montagem-admin-item';
            itemDiv.style.marginBottom = '5px';
            itemDiv.innerHTML = `
                <input type="text" value="${item.nome}" class="input-field" style="flex: 2;">
                <input type="number" value="${item.preco}" step="0.01" class="input-field-small" style="width: 100px;">
                <label style="font-size: 0.7rem;"><input type="checkbox" ${item.disponivel !== false ? 'checked' : ''}> Ativo</label>
                <button onclick="this.parentElement.remove()" style="background: none; border: none; color: red; cursor: pointer;">✕</button>
            `;
            itensContainer.appendChild(itemDiv);
        });
        
        container.appendChild(div);
    });
}

async function salvarMontagem() {
    if (nivelAcesso !== 'master') {
        mostrarToast('Apenas Master pode salvar montagens', 'alerta');
        return;
    }
    
    const nome = document.getElementById('montagemNome').value.trim();
    const precoBase = parseFloat(document.getElementById('montagemPrecoBase').value);
    const categoria = document.getElementById('montagemCategoria').value;
    
    if (!nome || isNaN(precoBase)) {
        mostrarToast('Preencha nome e preço base', 'alerta');
        return;
    }
    
    // Coleta tamanhos
    const tamanhos = [];
    document.querySelectorAll('#tamanhosContainer .montagem-admin-item').forEach(item => {
        const inputs = item.querySelectorAll('input');
        const nomeTamanho = inputs[0]?.value?.trim();
        if (nomeTamanho) {
            tamanhos.push({
                id: 'tam_' + gerarId(),
                nome: nomeTamanho,
                preco: parseFloat(inputs[1]?.value) || 0
            });
        }
    });
    
    // Coleta grupos e itens
    const grupos = [];
    document.querySelectorAll('#gruposContainer .grupo-montagem-box').forEach(box => {
        const inputs = box.querySelectorAll(':scope > div:first-child input');
        const nomeGrupo = inputs[0]?.value?.trim();
        if (!nomeGrupo) return;
        
        const grupoId = box.dataset.grupoId || 'grp_' + gerarId();
        const limite = parseInt(inputs[1]?.value) || 1;
        const obrigatorio = box.querySelector(':scope > div:first-child input[type="checkbox"]')?.checked || false;
        
        const itens = [];
        box.querySelectorAll('.itens-grupo-container .montagem-admin-item').forEach(itemDiv => {
            const itemInputs = itemDiv.querySelectorAll('input');
            const nomeItem = itemInputs[0]?.value?.trim();
            if (nomeItem) {
                itens.push({
                    id: 'itm_' + gerarId(),
                    nome: nomeItem,
                    preco: parseFloat(itemInputs[1]?.value) || 0,
                    disponivel: itemInputs[2]?.checked !== false
                });
            }
        });
        
        grupos.push({
            id: grupoId,
            nome: nomeGrupo,
            limite: limite,
            obrigatorio: obrigatorio,
            itens: itens
        });
    });
    
    if (grupos.length === 0) {
        mostrarToast('Adicione pelo menos 1 grupo', 'alerta');
        return;
    }
    
    const montagem = {
        id: montagemEditando ? montagemEditando.id : 'mont_' + gerarId(),
        nome: nome,
        descricao: document.getElementById('montagemDesc').value,
        categoria: categoria,
        precoBase: precoBase,
        imagem: document.getElementById('montagemImagem').value,
        disponivel: document.getElementById('montagemDisponivel').checked,
        destaque: document.getElementById('montagemDestaque').checked,
        tamanhos: tamanhos,
        grupos: grupos
    };
    
    if (montagemEditando) {
        const index = montagens.findIndex(m => m.id === montagemEditando.id);
        montagens[index] = montagem;
    } else {
        montagens.push(montagem);
    }
    
    const sucesso = await salvarMontagensFirebase(montagens);
    if (sucesso) {
        mostrarToast('Montagem salva com sucesso!', 'sucesso');
        fecharModalCadastroMontagem();
        renderizarProdutos();
        abrirModalAdmin();
    }
}

async function excluirMontagem(id) {
    if (nivelAcesso !== 'master') {
        mostrarToast('Apenas Master pode excluir montagens', 'alerta');
        return;
    }
    
    if (confirm('Tem certeza que deseja excluir esta montagem?')) {
        montagens = montagens.filter(m => m.id !== id);
        const sucesso = await salvarMontagensFirebase(montagens);
        if (sucesso) {
            mostrarToast('Montagem excluída!', 'sucesso');
            renderizarProdutos();
            abrirModalAdmin();
        }
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
    
    // Produtos normais
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
            <label for="destaque_${produto.id}">📦 ${produto.nome} - ${formatarPreco(produto.preco)}</label>
        `;
        container.appendChild(div);
    });
    
    // Montagens
    montagens.forEach(montagem => {
        const div = document.createElement('div');
        div.style.cssText = `
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 10px;
            border-bottom: 1px solid var(--cor-borda);
            background: #fff8e1;
        `;
        div.innerHTML = `
            <input type="checkbox" id="destaque_mont_${montagem.id}" ${montagem.destaque ? 'checked' : ''}>
            <label for="destaque_mont_${montagem.id}">🧩 ${montagem.nome} - A partir de ${formatarPreco(montagem.precoBase)}</label>
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
    
    montagens.forEach(montagem => {
        const checkbox = document.getElementById(`destaque_mont_${montagem.id}`);
        if (checkbox) {
            montagem.destaque = checkbox.checked;
        }
    });
    
    await salvarProdutosFirebase(produtos);
    const sucesso = await salvarMontagensFirebase(montagens);
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
window.toggleVisibilidadeCategoria = toggleVisibilidadeCategoria;
window.adicionarAdicional = adicionarAdicional;
window.excluirAdicional = excluirAdicional;
window.toggleFreteFixo = toggleFreteFixo;
window.salvarConfiguracoes = salvarConfiguracoes;
window.abrirGerenciarDestaques = abrirGerenciarDestaques;
window.fecharModalGerenciarDestaques = fecharModalGerenciarDestaques;
window.salvarDestaques = salvarDestaques;
window.abrirModalNovaMontagem = abrirModalNovaMontagem;
window.editarMontagem = editarMontagem;
window.fecharModalCadastroMontagem = fecharModalCadastroMontagem;
window.salvarMontagem = salvarMontagem;
window.excluirMontagem = excluirMontagem;
window.adicionarTamanho = adicionarTamanho;
window.adicionarGrupo = adicionarGrupo;
window.adicionarItemGrupo = adicionarItemGrupo;
window.atualizarTituloGrupo = atualizarTituloGrupo;

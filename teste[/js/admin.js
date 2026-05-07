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

async function verificarLogin() {
    const senha = document.getElementById('senhaAdmin').value;
    
    // Buscar senhas do Firebase
    const snap = await database.ref(`restaurantes/${RESTAURANTE_ID}/config`).once('value');
    const config = snap.val() || {};
    const senhaMaster = config.senhaMaster || SENHA_MASTER;
    const senhaView = config.senhaView || SENHA_VIEW;
    
     if (senha === String(senhaMaster)) {
        adminLogado = true;
        nivelAcesso = 'master';
        fecharModalLogin();
        mostrarToast('Bem-vindo, Master!', 'sucesso');
        atualizarInterfaceAdmin();
        abrirModalAdmin();
    } else if (senha === String(senhaView)) {
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
        padding: 12px 15px;
        border-bottom: 1px solid var(--cor-borda);
        background: #ffffff;
        transition: all 0.2s ease;
    `;
    div.addEventListener('mouseenter', () => {
        div.style.background = '#fafafa';
    });
    div.addEventListener('mouseleave', () => {
        div.style.background = '#ffffff';
    });

    div.innerHTML = `
        <div style="flex: 1; min-width: 0;">
            <strong style="display: block; margin-bottom: 3px;">${produto.nome}</strong>
            <small style="color: var(--cor-texto-claro);">
                ${getNomeCategoria(produto.categoria)} | ${formatarPreco(produto.preco)}
            </small>
        </div>
        <div style="display: flex; align-items: center; gap: 8px; flex-shrink: 0;">
            <!-- Botão Disponibilidade -->
            <button onclick="toggleDisponibilidadeProduto('${produto.id}')" 
                    class="btn-disponibilidade-admin" 
                    title="${produto.disponivel ? 'Disponível - Clique para indisponibilizar' : 'Indisponível - Clique para disponibilizar'}"
                    style="
                        width: 38px; height: 38px; border-radius: 50%; border: none;
                        cursor: pointer; font-size: 1rem; display: flex; align-items: center; justify-content: center;
                        transition: all 0.3s ease;
                        background: ${produto.disponivel ? 'rgba(76, 175, 80, 0.15)' : 'rgba(244, 67, 54, 0.15)'};
                        color: ${produto.disponivel ? '#4CAF50' : '#f44336'};
                    ">
                <i class="fas ${produto.disponivel ? 'fa-eye' : 'fa-eye-slash'}"></i>
            </button>
            
            <!-- Botão Editar -->
            <button onclick="editarProduto('${produto.id}')" 
                    class="btn-editar-admin" 
                    title="Editar produto"
                    style="
                        width: 38px; height: 38px; border-radius: 50%; border: none;
                        cursor: pointer; font-size: 0.95rem; display: flex; align-items: center; justify-content: center;
                        transition: all 0.3s ease;
                        background: rgba(33, 150, 243, 0.1);
                        color: #2196F3;
                    ">
                <i class="fas fa-pen-to-square"></i>
            </button>
            
            <!-- Botão Excluir -->
            <button onclick="excluirProduto('${produto.id}')" 
                    class="btn-excluir-admin" 
                    title="Excluir produto"
                    style="
                        width: 38px; height: 38px; border-radius: 50%; border: none;
                        cursor: pointer; font-size: 0.95rem; display: flex; align-items: center; justify-content: center;
                        transition: all 0.3s ease;
                        background: rgba(244, 67, 54, 0.1);
                        color: #f44336;
                    ">
                <i class="fas fa-trash-can"></i>
            </button>
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
    document.getElementById('produtoPreco').value = centavosParaFloat(produto.preco);
    document.getElementById('produtoImagem').value = produto.imagem || '';
    document.getElementById('produtoDisponivel').checked = produto.disponivel;
    document.getElementById('produtoDestaque').checked = produto.destaque || false;
    document.getElementById('produtoCategoria').value = produto.categoria;
    
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
    const precoInput = parseFloat(document.getElementById('produtoPreco').value);
    const categoria = document.getElementById('produtoCategoria').value;
    
    if (!nome || isNaN(precoInput)) {
        mostrarToast('Preencha nome e preço corretamente', 'alerta');
        return;
    }
    
    const precoCentavos = floatParaCentavos(precoInput);
    
    const produto = {
        id: produtoEditando ? produtoEditando.id : gerarId(),
        nome: nome,
        descricao: document.getElementById('produtoDesc').value,
        preco: precoCentavos,
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
    const precoInput = parseFloat(document.getElementById('precoAdicional').value) || 0;
    
    if (!nome) {
        mostrarToast('Digite o nome do adicional', 'alerta');
        return;
    }
    
    const precoCentavos = floatParaCentavos(precoInput);
    
    if (!adicionaisPorCategoria[categoria]) adicionaisPorCategoria[categoria] = [];
    adicionaisPorCategoria[categoria].push({ nome, preco: precoCentavos });
    
    const sucesso = await salvarAdicionaisFirebase(adicionaisPorCategoria);
    if (sucesso) {
        mostrarToast('Adicional adicionado!', 'sucesso');
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
// ===== 🛠️ ADMIN MONTAGENS (COMPLETO) ========
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
            </div>
        `;
        return;
    }
    
    montagens.forEach(montagem => {
        const div = document.createElement('div');
        div.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 15px;
            border-bottom: 1px solid var(--cor-borda);
            background: #ffffff;
            transition: all 0.2s ease;
        `;
        div.addEventListener('mouseenter', () => { div.style.background = '#fafafa'; });
        div.addEventListener('mouseleave', () => { div.style.background = '#ffffff'; });

        div.innerHTML = `
            <div style="flex: 1; min-width: 0;">
                <strong style="display: block; margin-bottom: 3px;">
                    <i class="fas fa-puzzle-piece" style="color: #9c27b0; margin-right: 4px;"></i>${montagem.nome}
                </strong>
                <small style="color: var(--cor-texto-claro);">
                    <i class="fas fa-folder" style="margin-right: 4px;"></i>${getNomeCategoria(montagem.categoria)} | 
                    <i class="fas fa-dollar-sign" style="margin-right: 4px;"></i>Base: ${formatarPreco(montagem.precoBase)}
                </small>
            </div>
            <div style="display: flex; align-items: center; gap: 8px; flex-shrink: 0;">
                <button onclick="toggleDisponibilidadeMontagem('${montagem.id}')" 
                        title="${montagem.disponivel ? 'Disponível' : 'Indisponível'}"
                        style="
                            width: 38px; height: 38px; border-radius: 50%; border: none;
                            cursor: pointer; font-size: 1rem; display: flex; align-items: center; justify-content: center;
                            transition: all 0.3s ease;
                            background: ${montagem.disponivel ? 'rgba(76, 175, 80, 0.15)' : 'rgba(244, 67, 54, 0.15)'};
                            color: ${montagem.disponivel ? '#4CAF50' : '#f44336'};
                        ">
                    <i class="fas ${montagem.disponivel ? 'fa-eye' : 'fa-eye-slash'}"></i>
                </button>
                
                <button onclick="editarMontagem('${montagem.id}')" 
                        title="Editar montagem"
                        style="
                            width: 38px; height: 38px; border-radius: 50%; border: none;
                            cursor: pointer; font-size: 0.95rem; display: flex; align-items: center; justify-content: center;
                            transition: all 0.3s ease;
                            background: rgba(33, 150, 243, 0.1);
                            color: #2196F3;
                        "
                        onmouseover="this.style.background='#2196F3'; this.style.color='#fff'; this.style.transform='scale(1.1)'"
                        onmouseout="this.style.background='rgba(33, 150, 243, 0.1)'; this.style.color='#2196F3'; this.style.transform='scale(1)'">
                    <i class="fas fa-pen-to-square"></i>
                </button>
                
                ${nivelAcesso === 'master' ? `
                <button onclick="excluirMontagem('${montagem.id}')" 
                        title="Excluir montagem"
                        style="
                            width: 38px; height: 38px; border-radius: 50%; border: none;
                            cursor: pointer; font-size: 0.95rem; display: flex; align-items: center; justify-content: center;
                            transition: all 0.3s ease;
                            background: rgba(244, 67, 54, 0.1);
                            color: #f44336;
                        "
                        onmouseover="this.style.background='#f44336'; this.style.color='#fff'; this.style.transform='scale(1.1)'"
                        onmouseout="this.style.background='rgba(244, 67, 54, 0.1)'; this.style.color='#f44336'; this.style.transform='scale(1)'">
                    <i class="fas fa-trash-can"></i>
                </button>
                ` : ''}
            </div>
        `;
        container.appendChild(div);
    });
}

async function toggleDisponibilidadeMontagem(montagemId) {
    const montagem = montagens.find(m => m.id === montagemId);
    if (!montagem) return;
    
    montagem.disponivel = !montagem.disponivel;
    
    const sucesso = await salvarMontagensFirebase(montagens);
    if (sucesso) {
        const status = montagem.disponivel ? 'disponível' : 'indisponível';
        mostrarToast(`${montagem.nome} agora está ${status}`, 'sucesso');
        carregarAdminMontagens();
        renderizarProdutos();
    } else {
        montagem.disponivel = !montagem.disponivel;
        mostrarToast('Erro ao alterar disponibilidade', 'erro');
    }
}

function abrirModalNovaMontagem() {
    if (nivelAcesso !== 'master') {
        mostrarToast('Apenas Master pode criar montagens', 'alerta');
        return;
    }
    
    montagemEditando = null;
    document.getElementById('modalMontagemTitulo').innerHTML = '<i class="fas fa-plus-circle"></i> Nova Montagem';
    document.getElementById('editMontagemId').value = '';
    document.getElementById('montagemNome').value = '';
    document.getElementById('montagemDesc').value = '';
    document.getElementById('montagemPrecoBase').value = '';
    document.getElementById('montagemImagem').value = '';
    document.getElementById('montagemDisponivel').checked = true;
    document.getElementById('montagemDestaque').checked = false;
    
    const selectCat = document.getElementById('montagemCategoria');
    selectCat.innerHTML = '';
    categorias.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = getNomeCategoria(cat);
        selectCat.appendChild(option);
    });
    
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
    document.getElementById('modalMontagemTitulo').innerHTML = '<i class="fas fa-pen-to-square"></i> Editar Montagem';
    document.getElementById('editMontagemId').value = montagem.id;
    document.getElementById('montagemNome').value = montagem.nome;
    document.getElementById('montagemDesc').value = montagem.descricao || '';
    document.getElementById('montagemPrecoBase').value = centavosParaFloat(montagem.precoBase);
    document.getElementById('montagemImagem').value = montagem.imagem || '';
    document.getElementById('montagemDisponivel').checked = montagem.disponivel;
    document.getElementById('montagemDestaque').checked = montagem.destaque || false;
    
    const selectCat = document.getElementById('montagemCategoria');
    selectCat.innerHTML = '';
    categorias.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = getNomeCategoria(cat);
        if (cat === montagem.categoria) option.selected = true;
        selectCat.appendChild(option);
    });
    
    renderizarTamanhosMontagem(montagem);
    renderizarGruposMontagem(montagem);
    document.getElementById('modalCadastroMontagem').style.display = 'flex';
}

function fecharModalCadastroMontagem() {
    document.getElementById('modalCadastroMontagem').style.display = 'none';
}

// ============================================
// ===== TAMANHOS =============================
// ============================================

function adicionarTamanho() {
    const container = document.getElementById('tamanhosContainer');
    const div = document.createElement('div');
    div.style.cssText = `
        display: flex; align-items: center; gap: 10px;
        padding: 10px 12px; background: #fafafa;
        border: 1px solid #eee; border-radius: 8px;
        margin-bottom: 6px; transition: all 0.2s ease;
    `;
    div.innerHTML = `
        <div style="
            width: 36px; height: 36px; border-radius: 8px;
            background: rgba(33, 150, 243, 0.1); display: flex; 
            align-items: center; justify-content: center; flex-shrink: 0;
        ">
            <i class="fas fa-ruler" style="color: #2196F3; font-size: 0.9rem;"></i>
        </div>
        <input type="text" placeholder="Nome do tamanho" style="flex: 2; padding: 8px 10px; border: 1px solid #e0e0e0; border-radius: 6px; font-size: 0.9rem;">
        <div style="display: flex; align-items: center; gap: 4px; flex-shrink: 0;">
            <span style="color: #999; font-size: 0.85rem;">R$</span>
            <input type="number" placeholder="0.00" step="0.01" value="0" 
                   style="width: 90px; padding: 8px; border: 1px solid #e0e0e0; border-radius: 6px; font-size: 0.9rem; text-align: right;">
        </div>
        <button onclick="this.parentElement.remove()" 
                style="
                    width: 32px; height: 32px; border-radius: 50%; border: none;
                    cursor: pointer; display: flex; align-items: center; justify-content: center;
                    background: rgba(244, 67, 54, 0.08); color: #f44336;
                    transition: all 0.3s ease; flex-shrink: 0;
                "
                onmouseover="this.style.background='#f44336'; this.style.color='#fff'"
                onmouseout="this.style.background='rgba(244, 67, 54, 0.08)'; this.style.color='#f44336'">
            <i class="fas fa-xmark"></i>
        </button>
    `;
    container.appendChild(div);
}

function renderizarTamanhosMontagem(montagem) {
    const container = document.getElementById('tamanhosContainer');
    container.innerHTML = '';
    
    if (montagem.tamanhos) {
        montagem.tamanhos.forEach(tamanho => {
            const div = document.createElement('div');
            div.style.cssText = `
                display: flex; align-items: center; gap: 10px;
                padding: 10px 12px; background: #fafafa;
                border: 1px solid #eee; border-radius: 8px;
                margin-bottom: 6px; transition: all 0.2s ease;
            `;
            div.innerHTML = `
                <div style="
                    width: 36px; height: 36px; border-radius: 8px;
                    background: rgba(33, 150, 243, 0.1); display: flex; 
                    align-items: center; justify-content: center; flex-shrink: 0;
                ">
                    <i class="fas fa-ruler" style="color: #2196F3; font-size: 0.9rem;"></i>
                </div>
                <input type="text" value="${tamanho.nome}" style="flex: 2; padding: 8px 10px; border: 1px solid #e0e0e0; border-radius: 6px; font-size: 0.9rem;">
                <div style="display: flex; align-items: center; gap: 4px; flex-shrink: 0;">
                    <span style="color: #999; font-size: 0.85rem;">R$</span>
                    <input type="number" value="${centavosParaFloat(tamanho.preco)}" step="0.01" 
                           style="width: 90px; padding: 8px; border: 1px solid #e0e0e0; border-radius: 6px; font-size: 0.9rem; text-align: right;">
                </div>
                <button onclick="this.parentElement.remove()" 
                        style="
                            width: 32px; height: 32px; border-radius: 50%; border: none;
                            cursor: pointer; display: flex; align-items: center; justify-content: center;
                            background: rgba(244, 67, 54, 0.08); color: #f44336;
                            transition: all 0.3s ease; flex-shrink: 0;
                        "
                        onmouseover="this.style.background='#f44336'; this.style.color='#fff'"
                        onmouseout="this.style.background='rgba(244, 67, 54, 0.08)'; this.style.color='#f44336'">
                    <i class="fas fa-xmark"></i>
                </button>
            `;
            container.appendChild(div);
        });
    }
}

// ============================================
// ===== GRUPOS E ITENS =======================
// ============================================

function adicionarGrupo() {
    const container = document.getElementById('gruposContainer');
    const grupoId = 'grp_' + Date.now();
    
    const div = document.createElement('div');
    div.style.cssText = `
        background: #ffffff; border: 1px solid #e0e0e0; border-radius: 12px;
        padding: 20px; margin-bottom: 16px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.04); transition: all 0.2s ease;
    `;
    div.dataset.grupoId = grupoId;
    div.innerHTML = `
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid #f0f0f0;">
            <div style="
                width: 40px; height: 40px; border-radius: 10px;
                background: linear-gradient(135deg, #667eea, #764ba2);
                display: flex; align-items: center; justify-content: center; flex-shrink: 0;
            ">
                <i class="fas fa-layer-group" style="color: #fff; font-size: 1rem;"></i>
            </div>
            <input type="text" placeholder="Nome do grupo" onchange="atualizarTituloGrupo(this)"
                   style="flex: 1; padding: 8px 12px; border: 1px solid #e0e0e0; border-radius: 8px; font-size: 1rem; font-weight: 600; color: #333;">
            <div style="display: flex; align-items: center; gap: 4px;">
                <i class="fas fa-hashtag" style="color: #999; font-size: 0.8rem;"></i>
                <input type="number" value="1" min="1" style="width: 55px; padding: 8px; border: 1px solid #e0e0e0; border-radius: 8px; font-size: 0.9rem; text-align: center;">
            </div>
            <label style="display: flex; align-items: center; gap: 6px; cursor: pointer; padding: 6px 10px; background: rgba(244, 67, 54, 0.08); border-radius: 8px; font-size: 0.8rem; font-weight: 500;">
                <input type="checkbox" checked style="width: 16px; height: 16px; accent-color: #f44336;">
                <i class="fas fa-asterisk" style="color: #f44336; font-size: 0.6rem;"></i> Obrigatório
            </label>
            <button onclick="this.closest('[data-grupo-id]').remove()" 
                    style="width: 36px; height: 36px; border-radius: 50%; border: none; cursor: pointer;
                           display: flex; align-items: center; justify-content: center;
                           background: rgba(244, 67, 54, 0.08); color: #f44336; transition: all 0.3s ease;"
                    onmouseover="this.style.background='#f44336'; this.style.color='#fff'"
                    onmouseout="this.style.background='rgba(244, 67, 54, 0.08)'; this.style.color='#f44336'">
                <i class="fas fa-trash-can"></i>
            </button>
        </div>
        
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; padding: 8px 12px; background: #f8f9fa; border-radius: 8px;">
            <span style="font-size: 0.8rem; color: #666; font-weight: 500;">
                <i class="fas fa-list-check" style="margin-right: 4px;"></i>Itens do grupo
            </span>
            <button onclick="desmarcarTodosItensGrupo(this)" 
                    style="padding: 5px 12px; background: rgba(244, 67, 54, 0.08); border: 1px solid rgba(244, 67, 54, 0.2); 
                           border-radius: 20px; color: #f44336; cursor: pointer; font-size: 0.75rem; font-weight: 500; transition: all 0.2s ease;"
                    onmouseover="this.style.background='#f44336'; this.style.color='#fff'"
                    onmouseout="this.style.background='rgba(244, 67, 54, 0.08)'; this.style.color='#f44336'">
                <i class="fas fa-toggle-off"></i> Desmarcar Todos
            </button>
        </div>
        
        <div class="itens-grupo-container" style="display: flex; flex-direction: column; gap: 6px; margin-bottom: 12px;"></div>
        
        <button onclick="adicionarItemGrupo(this)" 
                style="width: 100%; padding: 10px; background: rgba(102, 126, 234, 0.06); border: 2px dashed #667eea; 
                       border-radius: 10px; color: #667eea; cursor: pointer; font-size: 0.85rem; font-weight: 500; transition: all 0.2s ease;"
                onmouseover="this.style.background='rgba(102, 126, 234, 0.12)'; this.style.borderStyle='solid'"
                onmouseout="this.style.background='rgba(102, 126, 234, 0.06)'; this.style.borderStyle='dashed'">
            <i class="fas fa-plus-circle"></i> Adicionar Item
        </button>
    `;
    container.appendChild(div);
}

function atualizarTituloGrupo(input) {
    const grupoBox = input.closest('[data-grupo-id]');
    if (!grupoBox) return;
    const label = grupoBox.querySelector('.itens-grupo-container')?.previousElementSibling?.querySelector('span');
    if (label) label.innerHTML = `<i class="fas fa-list-check" style="margin-right: 4px;"></i>Itens de "${input.value || 'Novo Grupo'}"`;
}

function adicionarItemGrupo(btn) {
    const container = btn.previousElementSibling;
    const itemDiv = document.createElement('div');
    itemDiv.style.cssText = `
        display: flex; align-items: center; gap: 8px; padding: 10px 12px;
        background: #fafafa; border: 1px solid #eee; border-radius: 8px; transition: all 0.2s ease;
    `;
    itemDiv.innerHTML = `
        <div style="width: 32px; height: 32px; border-radius: 8px; background: rgba(76, 175, 80, 0.1);
                    display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
            <i class="fas fa-cube" style="color: #4CAF50; font-size: 0.8rem;"></i>
        </div>
        <input type="text" placeholder="Nome do item" style="flex: 2; padding: 8px 10px; border: 1px solid #e0e0e0; border-radius: 6px; font-size: 0.85rem;">
        <div style="display: flex; align-items: center; gap: 4px; flex-shrink: 0;">
            <span style="color: #999; font-size: 0.8rem;">R$</span>
            <input type="number" step="0.01" value="0" style="width: 75px; padding: 8px; border: 1px solid #e0e0e0; border-radius: 6px; font-size: 0.85rem; text-align: right;">
        </div>
        <label style="display: flex; align-items: center; gap: 4px; cursor: pointer; padding: 6px 8px; border-radius: 6px;
                       font-size: 0.7rem; font-weight: 500; background: rgba(76, 175, 80, 0.08); flex-shrink: 0;">
            <input type="checkbox" checked style="width: 14px; height: 14px; accent-color: #4CAF50;"> Ativo
        </label>
        <button onclick="this.parentElement.remove()" 
                style="width: 30px; height: 30px; border-radius: 50%; border: none; cursor: pointer;
                       display: flex; align-items: center; justify-content: center;
                       background: rgba(244, 67, 54, 0.06); color: #f44336; transition: all 0.3s ease; flex-shrink: 0;"
                onmouseover="this.style.background='#f44336'; this.style.color='#fff'"
                onmouseout="this.style.background='rgba(244, 67, 54, 0.06)'; this.style.color='#f44336'">
            <i class="fas fa-xmark"></i>
        </button>
    `;
    container.appendChild(itemDiv);
}

function renderizarGruposMontagem(montagem) {
    const container = document.getElementById('gruposContainer');
    container.innerHTML = '';
    
    montagem.grupos.forEach(grupo => {
        const div = document.createElement('div');
        div.style.cssText = `
            background: #ffffff; border: 1px solid #e0e0e0; border-radius: 12px;
            padding: 20px; margin-bottom: 16px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.04); transition: all 0.2s ease;
        `;
        div.dataset.grupoId = grupo.id;
        div.addEventListener('mouseenter', () => { div.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'; });
        div.addEventListener('mouseleave', () => { div.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)'; });
        
        div.innerHTML = `
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid #f0f0f0;">
                <div style="
                    width: 40px; height: 40px; border-radius: 10px;
                    background: linear-gradient(135deg, #667eea, #764ba2);
                    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
                ">
                    <i class="fas fa-layer-group" style="color: #fff; font-size: 1rem;"></i>
                </div>
                <input type="text" value="${grupo.nome}" onchange="atualizarTituloGrupo(this)"
                       style="flex: 1; padding: 8px 12px; border: 1px solid #e0e0e0; border-radius: 8px; font-size: 1rem; font-weight: 600; color: #333;">
                <div style="display: flex; align-items: center; gap: 4px;">
                    <i class="fas fa-hashtag" style="color: #999; font-size: 0.8rem;"></i>
                    <input type="number" value="${grupo.limite}" min="1" style="width: 55px; padding: 8px; border: 1px solid #e0e0e0; border-radius: 8px; font-size: 0.9rem; text-align: center;">
                </div>
                <label style="display: flex; align-items: center; gap: 6px; cursor: pointer; padding: 6px 10px;
                               background: ${grupo.obrigatorio ? 'rgba(244, 67, 54, 0.08)' : '#f5f5f5'}; border-radius: 8px; font-size: 0.8rem; font-weight: 500;">
                    <input type="checkbox" ${grupo.obrigatorio ? 'checked' : ''} style="width: 16px; height: 16px; accent-color: #f44336;">
                    <i class="fas fa-asterisk" style="color: ${grupo.obrigatorio ? '#f44336' : '#ccc'}; font-size: 0.6rem;"></i> Obrigatório
                </label>
                <button onclick="this.closest('[data-grupo-id]').remove()" 
                        style="width: 36px; height: 36px; border-radius: 50%; border: none; cursor: pointer;
                               display: flex; align-items: center; justify-content: center;
                               background: rgba(244, 67, 54, 0.08); color: #f44336; transition: all 0.3s ease;"
                        onmouseover="this.style.background='#f44336'; this.style.color='#fff'"
                        onmouseout="this.style.background='rgba(244, 67, 54, 0.08)'; this.style.color='#f44336'">
                    <i class="fas fa-trash-can"></i>
                </button>
            </div>
            
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; padding: 8px 12px; background: #f8f9fa; border-radius: 8px;">
                <span style="font-size: 0.8rem; color: #666; font-weight: 500;">
                    <i class="fas fa-list-check" style="margin-right: 4px;"></i>Itens de "${grupo.nome}"
                </span>
                <button onclick="desmarcarTodosItensGrupo(this)" 
                        style="padding: 5px 12px; background: rgba(244, 67, 54, 0.08); border: 1px solid rgba(244, 67, 54, 0.2); 
                               border-radius: 20px; color: #f44336; cursor: pointer; font-size: 0.75rem; font-weight: 500; transition: all 0.2s ease;"
                        onmouseover="this.style.background='#f44336'; this.style.color='#fff'"
                        onmouseout="this.style.background='rgba(244, 67, 54, 0.08)'; this.style.color='#f44336'">
                    <i class="fas fa-toggle-off"></i> Desmarcar Todos
                </button>
            </div>
            
            <div class="itens-grupo-container" style="display: flex; flex-direction: column; gap: 6px; margin-bottom: 12px;"></div>
            
            <button onclick="adicionarItemGrupo(this)" 
                    style="width: 100%; padding: 10px; background: rgba(102, 126, 234, 0.06); border: 2px dashed #667eea; 
                           border-radius: 10px; color: #667eea; cursor: pointer; font-size: 0.85rem; font-weight: 500; transition: all 0.2s ease;"
                    onmouseover="this.style.background='rgba(102, 126, 234, 0.12)'; this.style.borderStyle='solid'"
                    onmouseout="this.style.background='rgba(102, 126, 234, 0.06)'; this.style.borderStyle='dashed'">
                <i class="fas fa-plus-circle"></i> Adicionar Item
            </button>
        `;
        
        const itensContainer = div.querySelector('.itens-grupo-container');
        grupo.itens.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.style.cssText = `
                display: flex; align-items: center; gap: 8px; padding: 10px 12px;
                background: #fafafa; border: 1px solid #eee; border-radius: 8px; transition: all 0.2s ease;
            `;
            itemDiv.addEventListener('mouseenter', () => { itemDiv.style.background = '#f0f0f0'; });
            itemDiv.addEventListener('mouseleave', () => { itemDiv.style.background = '#fafafa'; });
            
            itemDiv.innerHTML = `
                <div style="width: 32px; height: 32px; border-radius: 8px;
                            background: ${item.disponivel !== false ? 'rgba(76, 175, 80, 0.1)' : 'rgba(158, 158, 158, 0.1)'};
                            display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                    <i class="fas fa-cube" style="color: ${item.disponivel !== false ? '#4CAF50' : '#9e9e9e'}; font-size: 0.8rem;"></i>
                </div>
                <input type="text" value="${item.nome}" style="flex: 2; padding: 8px 10px; border: 1px solid #e0e0e0; border-radius: 6px; font-size: 0.85rem;">
                <div style="display: flex; align-items: center; gap: 4px; flex-shrink: 0;">
                    <span style="color: #999; font-size: 0.8rem;">R$</span>
                    <input type="number" value="${centavosParaFloat(item.preco)}" step="0.01" style="width: 75px; padding: 8px; border: 1px solid #e0e0e0; border-radius: 6px; font-size: 0.85rem; text-align: right;">
                </div>
                <label style="display: flex; align-items: center; gap: 4px; cursor: pointer; padding: 6px 8px; border-radius: 6px;
                               font-size: 0.7rem; font-weight: 500; flex-shrink: 0;
                               background: ${item.disponivel !== false ? 'rgba(76, 175, 80, 0.08)' : 'rgba(158, 158, 158, 0.05)'};">
                    <input type="checkbox" ${item.disponivel !== false ? 'checked' : ''} style="width: 14px; height: 14px; accent-color: #4CAF50;"> Ativo
                </label>
                <button onclick="this.parentElement.remove()" 
                        style="width: 30px; height: 30px; border-radius: 50%; border: none; cursor: pointer;
                               display: flex; align-items: center; justify-content: center;
                               background: rgba(244, 67, 54, 0.06); color: #f44336; transition: all 0.3s ease; flex-shrink: 0;"
                        onmouseover="this.style.background='#f44336'; this.style.color='#fff'"
                        onmouseout="this.style.background='rgba(244, 67, 54, 0.06)'; this.style.color='#f44336'">
                    <i class="fas fa-xmark"></i>
                </button>
            `;
            itensContainer.appendChild(itemDiv);
        });
        
        container.appendChild(div);
    });
}

function desmarcarTodosItensGrupo(botao) {
    const grupoBox = botao.closest('[data-grupo-id]');
    if (!grupoBox) return;
    
    const checkboxes = grupoBox.querySelectorAll('.itens-grupo-container input[type="checkbox"]');
    let contador = 0;
    checkboxes.forEach(cb => {
        if (cb.checked) {
            cb.checked = false;
            contador++;
        }
    });
    
    if (contador > 0) {
        mostrarToast(`${contador} item(ns) desmarcado(s)`, 'info');
    }
}

// ============================================
// ===== SALVAR E EXCLUIR =====================
// ============================================

async function salvarMontagem() {
    if (nivelAcesso !== 'master') {
        mostrarToast('Apenas Master pode salvar montagens', 'alerta');
        return;
    }
    
    const nome = document.getElementById('montagemNome').value.trim();
    const precoBaseInput = parseFloat(document.getElementById('montagemPrecoBase').value);
    const categoria = document.getElementById('montagemCategoria').value;
    
    if (!nome || isNaN(precoBaseInput)) {
        mostrarToast('Preencha nome e preço base', 'alerta');
        return;
    }
    
    const precoBaseCentavos = floatParaCentavos(precoBaseInput);
    
    const tamanhos = [];
    document.querySelectorAll('#tamanhosContainer > div').forEach(item => {
        const inputs = item.querySelectorAll('input');
        const nomeTamanho = inputs[0]?.value?.trim();
        if (nomeTamanho) {
            const precoTamanhoInput = parseFloat(inputs[1]?.value) || 0;
            tamanhos.push({
                id: 'tam_' + gerarId(),
                nome: nomeTamanho,
                preco: floatParaCentavos(precoTamanhoInput)
            });
        }
    });
    
    const grupos = [];
    document.querySelectorAll('#gruposContainer [data-grupo-id]').forEach(box => {
        const cabecalhoInputs = box.querySelectorAll(':scope > div:first-child input');
        const nomeGrupo = cabecalhoInputs[0]?.value?.trim();
        if (!nomeGrupo) return;
        
        const grupoId = box.dataset.grupoId || 'grp_' + gerarId();
        const limite = parseInt(cabecalhoInputs[1]?.value) || 1;
        const obrigatorio = cabecalhoInputs[2]?.checked || false;
        
        const itens = [];
        box.querySelectorAll('.itens-grupo-container > div').forEach(itemDiv => {
            const itemInputs = itemDiv.querySelectorAll('input');
            const nomeItem = itemInputs[0]?.value?.trim();
            if (nomeItem) {
                const precoItemInput = parseFloat(itemInputs[1]?.value) || 0;
                itens.push({
                    id: 'itm_' + gerarId(),
                    nome: nomeItem,
                    preco: floatParaCentavos(precoItemInput),
                    disponivel: itemInputs[2]?.checked !== false
                });
            }
        });
        
        grupos.push({ id: grupoId, nome: nomeGrupo, limite, obrigatorio, itens });
    });
    
    if (grupos.length === 0) {
        mostrarToast('Adicione pelo menos 1 grupo', 'alerta');
        return;
    }
    
    const montagem = {
        id: montagemEditando ? montagemEditando.id : 'mont_' + gerarId(),
        nome, descricao: document.getElementById('montagemDesc').value,
        categoria, precoBase: precoBaseCentavos,
        imagem: document.getElementById('montagemImagem').value,
        disponivel: document.getElementById('montagemDisponivel').checked,
        destaque: document.getElementById('montagemDestaque').checked,
        tamanhos, grupos
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


// ============================================
// ===== 🆕 ADMIN HORÁRIOS ===================
// ============================================

let horarioEditando = null;

function abrirModalGerenciarHorarios() {
    if (nivelAcesso !== 'master') {
        mostrarToast('Apenas Master pode gerenciar horários', 'alerta');
        return;
    }
    
    horarioEditando = null;
    document.getElementById('editHorarioId').value = '';
    document.getElementById('horarioNome').value = '';
    document.getElementById('horarioInicio').value = '';
    document.getElementById('horarioFim').value = '';
    document.getElementById('horarioViradaDia').checked = false;
    
    // Limpa checkboxes de dias
    document.querySelectorAll('#diasSemanaCheckboxes input[type="checkbox"]').forEach(cb => {
        cb.checked = false;
    });
    document.getElementById('todosDias').checked = false;
    
    // Preenche categorias
    carregarCheckboxesCategorias();
    
    // Lista horários cadastrados
    carregarListaHorarios();
    
    document.getElementById('modalGerenciarHorarios').style.display = 'flex';
}

function fecharModalGerenciarHorarios() {
    document.getElementById('modalGerenciarHorarios').style.display = 'none';
}

function carregarCheckboxesCategorias() {
    const container = document.getElementById('categoriasHorarioCheckboxes');
    container.innerHTML = '';
    
    categorias.forEach(cat => {
        const label = document.createElement('label');
        label.className = 'checkbox-label';
        label.innerHTML = `
            <input type="checkbox" value="${cat}">
            ${getIconeCategoria(cat)} ${getNomeCategoria(cat)}
        `;
        container.appendChild(label);
    });
}

function atualizarCheckboxTodos(checkbox) {
    const todosCheckbox = document.getElementById('todosDias');
    const todosChecked = document.querySelectorAll('#diasSemanaCheckboxes input[type="checkbox"]:not(#todosDias):checked');
    
    if (todosCheckbox) {
        todosCheckbox.checked = todosChecked.length === 7;
    }
}

function toggleTodosDias(checkbox) {
    document.querySelectorAll('#diasSemanaCheckboxes input[type="checkbox"]:not(#todosDias)').forEach(cb => {
        cb.checked = checkbox.checked;
    });
}

function carregarListaHorarios() {
    const container = document.getElementById('listaHorariosCadastrados');
    container.innerHTML = '';
    
    if (horarios.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--cor-texto-claro); padding: 20px;">Nenhum horário cadastrado</p>';
        return;
    }
    
    const diasSemanaNomes = ['', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
    
    horarios.forEach(horario => {
        const dias = horario.diasSemana.map(d => diasSemanaNomes[d]).join(', ');
        const categoriasLista = horario.categorias.map(c => getNomeCategoria(c)).join(', ');
        
        const div = document.createElement('div');
        div.className = 'card-horario';
        div.innerHTML = `
            <div class="card-horario-info">
                <div class="card-horario-titulo">🕐 ${horario.nome}</div>
                <div class="card-horario-sub">${horario.horaInicio} às ${horario.horaFim} | ${dias}</div>
                <div class="card-horario-sub" style="font-size: 0.7rem;">📂 ${categoriasLista || 'Nenhuma categoria'}</div>
            </div>
            <div class="card-horario-actions">
                <button onclick="editarHorario('${horario.id}')" class="btn-editar-admin">✏️</button>
                <button onclick="excluirHorario('${horario.id}')" class="btn-excluir-admin">🗑️</button>
            </div>
        `;
        container.appendChild(div);
    });
}

function editarHorario(id) {
    if (nivelAcesso !== 'master') {
        mostrarToast('Apenas Master pode editar horários', 'alerta');
        return;
    }
    
    const horario = horarios.find(h => h.id === id);
    if (!horario) return;
    
    horarioEditando = horario;
    document.getElementById('editHorarioId').value = horario.id;
    document.getElementById('horarioNome').value = horario.nome;
    document.getElementById('horarioInicio').value = horario.horaInicio;
    document.getElementById('horarioFim').value = horario.horaFim;
    document.getElementById('horarioViradaDia').checked = horario.permiteViradaDia || false;
    
    // Dias da semana
    document.querySelectorAll('#diasSemanaCheckboxes input[type="checkbox"]').forEach(cb => {
        if (cb.id === 'todosDias') {
            cb.checked = horario.diasSemana.length === 7;
        } else {
            cb.checked = horario.diasSemana.includes(parseInt(cb.value));
        }
    });
    
    // Categorias
    carregarCheckboxesCategorias();
    document.querySelectorAll('#categoriasHorarioCheckboxes input[type="checkbox"]').forEach(cb => {
        cb.checked = horario.categorias.includes(cb.value);
    });
    
    // Scroll para o topo do modal
    document.getElementById('modalGerenciarHorarios').scrollTop = 0;
}

async function salvarHorario() {
    if (nivelAcesso !== 'master') {
        mostrarToast('Apenas Master pode salvar horários', 'alerta');
        return;
    }
    
    const nome = document.getElementById('horarioNome').value.trim();
    const horaInicio = document.getElementById('horarioInicio').value;
    const horaFim = document.getElementById('horarioFim').value;
    
    if (!nome || !horaInicio || !horaFim) {
        mostrarToast('Preencha todos os campos', 'alerta');
        return;
    }
    
    // Dias selecionados
    const diasSemana = [];
    document.querySelectorAll('#diasSemanaCheckboxes input[type="checkbox"]:checked').forEach(cb => {
        if (cb.id !== 'todosDias') {
            diasSemana.push(parseInt(cb.value));
        }
    });
    
    if (diasSemana.length === 0) {
        mostrarToast('Selecione pelo menos um dia', 'alerta');
        return;
    }
    
    // Categorias selecionadas
    const categoriasSelecionadas = [];
    document.querySelectorAll('#categoriasHorarioCheckboxes input[type="checkbox"]:checked').forEach(cb => {
        categoriasSelecionadas.push(cb.value);
    });
    
    const horario = {
        id: horarioEditando ? horarioEditando.id : 'hor_' + gerarId(),
        nome,
        horaInicio,
        horaFim,
        permiteViradaDia: document.getElementById('horarioViradaDia').checked,
        diasSemana,
        categorias: categoriasSelecionadas
    };
    
    if (horarioEditando) {
        const index = horarios.findIndex(h => h.id === horarioEditando.id);
        horarios[index] = horario;
    } else {
        horarios.push(horario);
    }
    
    const sucesso = await salvarHorariosFirebase(horarios);
    if (sucesso) {
        mostrarToast('Horário salvo!', 'sucesso');
        carregarListaHorarios();
        carregarAdminConfig();
        
        // Limpa formulário
        horarioEditando = null;
        document.getElementById('editHorarioId').value = '';
        document.getElementById('horarioNome').value = '';
        document.getElementById('horarioInicio').value = '';
        document.getElementById('horarioFim').value = '';
        document.getElementById('horarioViradaDia').checked = false;
        document.querySelectorAll('#diasSemanaCheckboxes input[type="checkbox"]').forEach(cb => cb.checked = false);
        document.querySelectorAll('#categoriasHorarioCheckboxes input[type="checkbox"]').forEach(cb => cb.checked = false);
    }
}

async function excluirHorario(id) {
    if (nivelAcesso !== 'master') {
        mostrarToast('Apenas Master pode excluir horários', 'alerta');
        return;
    }
    
    if (confirm('Tem certeza que deseja excluir este horário?')) {
        // Remove da loja também
        configRestaurante.horariosLoja = configRestaurante.horariosLoja.filter(h => h !== id);
        
        horarios = horarios.filter(h => h.id !== id);
        
        await salvarHorariosFirebase(horarios);
        await salvarConfigFirebase(configRestaurante);
        
        mostrarToast('Horário excluído!', 'sucesso');
        carregarListaHorarios();
        carregarAdminConfig();
    }
}

// ============================================
// ===== 🆕 ADMIN FERIADOS ===================
// ============================================

let feriadoEditando = null;

function abrirModalGerenciarFeriados() {
    if (nivelAcesso !== 'master') {
        mostrarToast('Apenas Master pode gerenciar feriados', 'alerta');
        return;
    }
    
    feriadoEditando = null;
    document.getElementById('editFeriadoId').value = '';
    document.getElementById('feriadoNome').value = '';
    document.getElementById('feriadoData').value = '';
    document.getElementById('feriadoRecorrente').checked = true;
    
    carregarListaFeriados();
    
    document.getElementById('modalGerenciarFeriados').style.display = 'flex';
}

function fecharModalGerenciarFeriados() {
    document.getElementById('modalGerenciarFeriados').style.display = 'none';
}

function carregarListaFeriados() {
    const container = document.getElementById('listaFeriadosCadastrados');
    container.innerHTML = '';
    
    if (feriados.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--cor-texto-claro); padding: 20px;">Nenhum feriado cadastrado</p>';
        return;
    }
    
    feriados.forEach(feriado => {
        const div = document.createElement('div');
        div.className = 'card-feriado';
        div.innerHTML = `
            <div class="card-feriado-info">
                <div class="card-feriado-titulo">📅 ${feriado.nome}</div>
                <div class="card-feriado-sub">${feriado.data} ${feriado.recorrente ? '(recorrente)' : ''}</div>
            </div>
            <div class="card-feriado-actions">
                <button onclick="editarFeriado('${feriado.id}')" class="btn-editar-admin">✏️</button>
                <button onclick="excluirFeriado('${feriado.id}')" class="btn-excluir-admin">🗑️</button>
            </div>
        `;
        container.appendChild(div);
    });
}

function editarFeriado(id) {
    if (nivelAcesso !== 'master') {
        mostrarToast('Apenas Master pode editar feriados', 'alerta');
        return;
    }
    
    const feriado = feriados.find(f => f.id === id);
    if (!feriado) return;
    
    feriadoEditando = feriado;
    document.getElementById('editFeriadoId').value = feriado.id;
    document.getElementById('feriadoNome').value = feriado.nome;
    
    // Formata a data
    if (feriado.recorrente) {
        document.getElementById('feriadoData').value = '2024-' + feriado.data;
    } else {
        document.getElementById('feriadoData').value = feriado.data;
    }
    
    document.getElementById('feriadoRecorrente').checked = feriado.recorrente;
}

async function salvarFeriado() {
    if (nivelAcesso !== 'master') {
        mostrarToast('Apenas Master pode salvar feriados', 'alerta');
        return;
    }
    
    const nome = document.getElementById('feriadoNome').value.trim();
    const dataInput = document.getElementById('feriadoData').value;
    const recorrente = document.getElementById('feriadoRecorrente').checked;
    
    if (!nome || !dataInput) {
        mostrarToast('Preencha nome e data', 'alerta');
        return;
    }
    
    let dataFormatada;
    if (recorrente) {
        // Pega só MM-DD
        const partes = dataInput.split('-');
        dataFormatada = partes[1] + '-' + partes[2];
    } else {
        dataFormatada = dataInput;
    }
    
    const feriado = {
        id: feriadoEditando ? feriadoEditando.id : 'fer_' + gerarId(),
        nome,
        data: dataFormatada,
        recorrente
    };
    
    if (feriadoEditando) {
        const index = feriados.findIndex(f => f.id === feriadoEditando.id);
        feriados[index] = feriado;
    } else {
        feriados.push(feriado);
    }
    
    const sucesso = await salvarFeriadosFirebase(feriados);
    if (sucesso) {
        mostrarToast('Feriado salvo!', 'sucesso');
        carregarListaFeriados();
        carregarAdminConfig();
        
        // Limpa formulário
        feriadoEditando = null;
        document.getElementById('editFeriadoId').value = '';
        document.getElementById('feriadoNome').value = '';
        document.getElementById('feriadoData').value = '';
        document.getElementById('feriadoRecorrente').checked = true;
        
        // Reseta cache de feriado
        feriadoHoje = false;
        ultimoDiaVerificado = '';
    }
}

async function excluirFeriado(id) {
    if (nivelAcesso !== 'master') {
        mostrarToast('Apenas Master pode excluir feriados', 'alerta');
        return;
    }
    
    if (confirm('Tem certeza que deseja excluir este feriado?')) {
        feriados = feriados.filter(f => f.id !== id);
        const sucesso = await salvarFeriadosFirebase(feriados);
        if (sucesso) {
            mostrarToast('Feriado excluído!', 'sucesso');
            carregarListaFeriados();
            
            // Reseta cache
            feriadoHoje = false;
            ultimoDiaVerificado = '';
        }
    }
}

// ============================================
// ===== 🆕 ADMIN CUPONS ======================
// ============================================

let cupomEditando = null;

function abrirModalGerenciarCupons() {
    if (nivelAcesso !== 'master') {
        mostrarToast('Apenas Master pode gerenciar cupons', 'alerta');
        return;
    }
    
    cupomEditando = null;
    limparFormCupom();
    carregarListaCupons();
    
    document.getElementById('modalGerenciarCupons').style.display = 'flex';
}

function fecharModalGerenciarCupons() {
    document.getElementById('modalGerenciarCupons').style.display = 'none';
}

function limparFormCupom() {
    document.getElementById('editCupomId').value = '';
    document.getElementById('cupomCodigo').value = '';
    document.getElementById('cupomTipoDesconto').value = 'percentual';
    document.getElementById('cupomValorDesconto').value = '';
    document.getElementById('cupomAtivo').checked = true;
    document.getElementById('cupomTipoLimite').value = 'ilimitado';
    document.getElementById('cupomLimiteUso').value = '50';
    document.getElementById('cupomLimitePorUsuario').value = '1';
    document.getElementById('cupomValorMinimo').value = '';
    document.getElementById('cupomDataInicio').value = '';
    document.getElementById('cupomDataExpiracao').value = '';
}

function carregarListaCupons() {
    const container = document.getElementById('listaCuponsCadastrados');
    container.innerHTML = '';
    
    if (!cupons || cupons.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--cor-texto-claro); padding: 20px;">Nenhum cupom cadastrado</p>';
        return;
    }
    
    cupons.forEach(cupom => {
        const tipoLimite = cupom.tipoLimiteUso === 'unico' ? 'Único' : 
                          cupom.tipoLimiteUso === 'limitado' ? `${cupom.usos}/${cupom.limiteUso}` : 'Ilimitado';
        
        const div = document.createElement('div');
        div.style.cssText = `
            padding: 15px;
            border: 1px solid var(--cor-borda);
            border-radius: 12px;
            margin-bottom: 10px;
            background: ${cupom.ativo ? '#fafafa' : '#f5f5f5'};
            opacity: ${cupom.ativo ? 1 : 0.7};
        `;
        div.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: start;">
                <div>
                    <strong style="font-size: 1.1rem;">🎫 ${cupom.codigo}</strong>
                    ${!cupom.ativo ? '<span style="color: #e53935; margin-left: 10px;">(Inativo)</span>' : ''}
                    <div style="margin-top: 5px; font-size: 0.85rem; color: var(--cor-texto-claro);">
                        💰 ${formatarDescontoCupom(cupom)} | 📊 ${tipoLimite}
                        ${cupom.valorMinimoPedido ? ` | Mín: ${formatarPreco(cupom.valorMinimoPedido)}` : ''}
                    </div>
                    ${cupom.dataExpiracao ? `<div style="font-size: 0.8rem; color: #999;">⏰ Expira: ${cupom.dataExpiracao}</div>` : ''}
                </div>
                <div style="display: flex; gap: 5px;">
                    <button onclick="editarCupom('${cupom.id}')" class="btn-editar-admin">✏️</button>
                    <button onclick="excluirCupom('${cupom.id}')" class="btn-excluir-admin">🗑️</button>
                </div>
            </div>
        `;
        container.appendChild(div);
    });
}

function editarCupom(id) {
    if (nivelAcesso !== 'master') {
        mostrarToast('Apenas Master pode editar cupons', 'alerta');
        return;
    }
    
    const cupom = cupons.find(c => c.id === id);
    if (!cupom) return;
    
    cupomEditando = cupom;
    document.getElementById('editCupomId').value = cupom.id;
    document.getElementById('cupomCodigo').value = cupom.codigo;
    document.getElementById('cupomTipoDesconto').value = cupom.tipoDesconto;
    
    if (cupom.tipoDesconto === 'percentual') {
        document.getElementById('cupomValorDesconto').value = cupom.valorDesconto;
    } else {
        document.getElementById('cupomValorDesconto').value = centavosParaFloat(cupom.valorDesconto);
    }
    
    document.getElementById('cupomAtivo').checked = cupom.ativo;
    document.getElementById('cupomTipoLimite').value = cupom.tipoLimiteUso || 'ilimitado';
    document.getElementById('cupomLimiteUso').value = cupom.limiteUso || 50;
    document.getElementById('cupomLimitePorUsuario').value = cupom.limitePorUsuario || 1;
    document.getElementById('cupomValorMinimo').value = cupom.valorMinimoPedido ? centavosParaFloat(cupom.valorMinimoPedido) : '';
    document.getElementById('cupomDataInicio').value = cupom.dataInicio || '';
    document.getElementById('cupomDataExpiracao').value = cupom.dataExpiracao || '';
    
    toggleCamposLimiteCupom();
}

async function salvarCupom() {
    if (nivelAcesso !== 'master') {
        mostrarToast('Apenas Master pode salvar cupons', 'alerta');
        return;
    }
    
    const codigo = document.getElementById('cupomCodigo').value.trim().toUpperCase();
    const tipoDesconto = document.getElementById('cupomTipoDesconto').value;
    const valorDescontoStr = document.getElementById('cupomValorDesconto').value;
    
    if (!codigo || !valorDescontoStr) {
        mostrarToast('Preencha código e valor', 'alerta');
        return;
    }
    
    // Verificar se código já existe (em outro cupom)
    const cupomExistente = cupons.find(c => c.codigo === codigo && (!cupomEditando || c.id !== cupomEditando.id));
    if (cupomExistente) {
        mostrarToast('Código já existe', 'Já existe um cupom com este código', 'alerta');
        return;
    }
    
    const valorDesconto = parseValorDesconto(valorDescontoStr, tipoDesconto);
    
    const cupom = {
        id: cupomEditando ? cupomEditando.id : 'cup_' + gerarId(),
        codigo: codigo,
        tipoDesconto: tipoDesconto,
        valorDesconto: valorDesconto,
        ativo: document.getElementById('cupomAtivo').checked,
        tipoLimiteUso: document.getElementById('cupomTipoLimite').value,
        limiteUso: parseInt(document.getElementById('cupomLimiteUso').value) || 50,
        limitePorUsuario: parseInt(document.getElementById('cupomLimitePorUsuario').value) || null,
        valorMinimoPedido: document.getElementById('cupomValorMinimo').value 
            ? floatParaCentavos(parseFloat(document.getElementById('cupomValorMinimo').value)) 
            : null,
        dataInicio: document.getElementById('cupomDataInicio').value || null,
        dataExpiracao: document.getElementById('cupomDataExpiracao').value || null,
        usos: cupomEditando ? (cupomEditando.usos || 0) : 0,
        historicoUso: cupomEditando ? (cupomEditando.historicoUso || []) : []
    };
    
    if (cupomEditando) {
        const index = cupons.findIndex(c => c.id === cupomEditando.id);
        cupons[index] = cupom;
    } else {
        cupons.push(cupom);
    }
    
    const sucesso = await salvarCuponsFirebase(cupons);
    if (sucesso) {
        mostrarToast('Cupom salvo!', 'sucesso');
        limparFormCupom();
        carregarListaCupons();
    }
}

async function excluirCupom(id) {
    if (nivelAcesso !== 'master') {
        mostrarToast('Apenas Master pode excluir cupons', 'alerta');
        return;
    }
    
    if (confirm('Tem certeza que deseja excluir este cupom?')) {
        cupons = cupons.filter(c => c.id !== id);
        const sucesso = await salvarCuponsFirebase(cupons);
        if (sucesso) {
            mostrarToast('Cupom excluído!', 'sucesso');
            carregarListaCupons();
        }
    }
}

function toggleCamposLimiteCupom() {
    const tipoLimite = document.getElementById('cupomTipoLimite').value;
    document.getElementById('campoLimiteUso').style.display = tipoLimite === 'limitado' ? 'block' : 'none';
}
// ============================================
// ===== ADMIN CONFIG ========================
// ============================================

function carregarAdminConfig() {
    // Status manual
    document.getElementById('configStatusManual').value = configRestaurante.statusManual || 'aberto';
    
    // Horários da loja
    carregarCheckboxesHorariosLoja();
    
    // Tipo de frete
    document.getElementById('configTipoFrete').value = configRestaurante.tipoFrete;
    
    const freteFixoInput = document.getElementById('configFreteFixo');
    freteFixoInput.value = centavosParaFloat(configRestaurante.freteFixo || 0);
    freteFixoInput.style.display = configRestaurante.tipoFrete === 'fixo' ? 'inline-block' : 'none';
    
    const freteFixoField = document.getElementById('configFreteFixoField');
    if (freteFixoField) {
        freteFixoField.style.display = configRestaurante.tipoFrete === 'fixo' ? 'block' : 'none';
    }
}

function carregarCheckboxesHorariosLoja() {
    const container = document.getElementById('configHorariosLoja');
    container.innerHTML = '';
    
    if (horarios.length === 0) {
        container.innerHTML = '<p style="color: var(--cor-texto-claro); font-size: 0.85rem;">Nenhum horário cadastrado</p>';
        return;
    }
    
    horarios.forEach(horario => {
        const label = document.createElement('label');
        label.className = 'checkbox-label';
        label.innerHTML = `
            <input type="checkbox" value="${horario.id}" 
                   ${configRestaurante.horariosLoja.includes(horario.id) ? 'checked' : ''}
                   onchange="toggleHorarioLoja('${horario.id}', this.checked)">
            🕐 ${horario.nome} (${horario.horaInicio}-${horario.horaFim})
        `;
        container.appendChild(label);
    });
}

function toggleHorarioLoja(horarioId, checked) {
    if (checked) {
        if (!configRestaurante.horariosLoja.includes(horarioId)) {
            configRestaurante.horariosLoja.push(horarioId);
        }
    } else {
        configRestaurante.horariosLoja = configRestaurante.horariosLoja.filter(h => h !== horarioId);
    }
}

function toggleFreteFixo() {
    const tipo = document.getElementById('configTipoFrete').value;
    const freteFixoInput = document.getElementById('configFreteFixo');
    const freteFixoField = document.getElementById('configFreteFixoField');
    
    if (freteFixoInput) freteFixoInput.style.display = tipo === 'fixo' ? 'inline-block' : 'none';
    if (freteFixoField) freteFixoField.style.display = tipo === 'fixo' ? 'block' : 'none';
}

async function salvarConfiguracoes() {
    if (nivelAcesso !== 'master') {
        mostrarToast('Apenas Master pode salvar configurações', 'alerta');
        return;
    }
    
    configRestaurante.statusManual = document.getElementById('configStatusManual').value;
    configRestaurante.tipoFrete = document.getElementById('configTipoFrete').value;
    
    const freteInput = parseFloat(document.getElementById('configFreteFixo').value) || 0;
    configRestaurante.freteFixo = floatParaCentavos(freteInput);
    
    const sucesso = await salvarConfigFirebase(configRestaurante);
    if (sucesso) {
        mostrarToast('Configurações salvas!', 'sucesso');
        verificarHorario();
        renderizarProdutos();
    }
}

     async function toggleDisponibilidadeProduto(produtoId) {
     
    const produto = produtos.find(p => p.id === produtoId);
    if (!produto) return;
    
    // Alterna o status
    produto.disponivel = !produto.disponivel;
    
    // Salva no Firebase
    const sucesso = await salvarProdutosFirebase(produtos);
    if (sucesso) {
        const status = produto.disponivel ? 'disponível' : 'indisponível';
        mostrarToast(`${produto.nome} agora está ${status}`, 'sucesso');
        carregarAdminProdutos(); // Recarrega a lista
        renderizarProdutos();    // Atualiza o cardápio
    } else {
        // Reverte se falhar
        produto.disponivel = !produto.disponivel;
        mostrarToast('Erro ao alterar disponibilidade', 'erro');
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
            <label for="destaque_${produto.id}">📦 ${produto.nome} - ${formatarPreco(produto.preco)}</label>
        `;
        container.appendChild(div);
    });
    
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
        if (checkbox) produto.destaque = checkbox.checked;
    });
    
    montagens.forEach(montagem => {
        const checkbox = document.getElementById(`destaque_mont_${montagem.id}`);
        if (checkbox) montagem.destaque = checkbox.checked;
    });
    
    await salvarProdutosFirebase(produtos);
    const sucesso = await salvarMontagensFirebase(montagens);
    if (sucesso) {
        mostrarToast('Destaques atualizados!', 'sucesso');
        fecharModalGerenciarDestaques();
        renderizarProdutos();
    }
}

// ===== EXPOR =====
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
window.toggleHorarioLoja = toggleHorarioLoja;
window.toggleDisponibilidadeProduto = toggleDisponibilidadeProduto;

// 🆕 Horários
window.abrirModalGerenciarHorarios = abrirModalGerenciarHorarios;
window.fecharModalGerenciarHorarios = fecharModalGerenciarHorarios;
window.editarHorario = editarHorario;
window.salvarHorario = salvarHorario;
window.excluirHorario = excluirHorario;
window.atualizarCheckboxTodos = atualizarCheckboxTodos;
window.toggleTodosDias = toggleTodosDias;

// 🆕 Feriados
window.abrirModalGerenciarFeriados = abrirModalGerenciarFeriados;
window.fecharModalGerenciarFeriados = fecharModalGerenciarFeriados;
window.editarFeriado = editarFeriado;
window.salvarFeriado = salvarFeriado;
window.excluirFeriado = excluirFeriado;

// 🆕 Cupons
window.abrirModalGerenciarCupons = abrirModalGerenciarCupons;
window.fecharModalGerenciarCupons = fecharModalGerenciarCupons;
window.editarCupom = editarCupom;
window.salvarCupom = salvarCupom;
window.excluirCupom = excluirCupom;
window.toggleCamposLimiteCupom = toggleCamposLimiteCupom;

// ===== montagem  =====
window.toggleDisponibilidadeMontagem = toggleDisponibilidadeMontagem;
window.desmarcarTodosItensGrupo = desmarcarTodosItensGrupo;
window.abrirModalNovaMontagem = abrirModalNovaMontagem;
window.editarMontagem = editarMontagem;
window.fecharModalCadastroMontagem = fecharModalCadastroMontagem;
window.salvarMontagem = salvarMontagem;
window.excluirMontagem = excluirMontagem;
window.adicionarTamanho = adicionarTamanho;
window.adicionarGrupo = adicionarGrupo;
window.adicionarItemGrupo = adicionarItemGrupo;
window.atualizarTituloGrupo = atualizarTituloGrupo;

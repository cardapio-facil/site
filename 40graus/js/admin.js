// ============================================
// ===== FUNÇÕES DE ADMINISTRAÇÃO ============
// ============================================

// ===== NOVAS FUNÇÕES DE LOGIN =====
function abrirModalLogin() {
    document.getElementById('modalLogin').style.display = 'flex';
    document.getElementById('emailAdmin').value = '';
    document.getElementById('senhaAdmin').value = '';
    document.getElementById('erroLogin').style.display = 'none';
}

function fecharModalLogin() {
    document.getElementById('modalLogin').style.display = 'none';
}

async function verificarLogin() {
    const email = document.getElementById('emailAdmin').value.trim();
    const senha = document.getElementById('senhaAdmin').value;
    
    if (!email || !senha) {
        mostrarToast('Preencha email e senha!', 'alerta');
        return;
    }
    
    try {
        await firebase.auth().signInWithEmailAndPassword(email, senha);
        adminLogado = true;
        
        // Verificar nível de acesso pelo email
        if (email === 'master@40graus.com') {
            nivelAcesso = 'master';
            mostrarToast('Bem-vindo, Master!', 'sucesso');
        } else if (email === 'view@40graus.com') {
            nivelAcesso = 'view';
            mostrarToast('Modo visualização', 'info');
        }
        
        fecharModalLogin();
        atualizarInterfaceAdmin();
        abrirModalAdmin();
    } catch (error) {
        document.getElementById('erroLogin').style.display = 'block';
        mostrarToast('Email ou senha incorretos!', 'erro');
    }
}

async function logout() {
    await firebase.auth().signOut();
    adminLogado = false;
    nivelAcesso = null;
    atualizarInterfaceAdmin();
    fecharModalAdmin();
    mostrarToast('Logout realizado', 'info');
}

function fecharModalLogin() {
    document.getElementById('modalLogin').style.display = 'none';
}


async function verificarLogin() {
    const email = document.getElementById('emailAdmin').value.trim();
    const senha = document.getElementById('senhaAdmin').value;
    
    if (!email || !senha) {
        mostrarToast('Preencha email e senha!', 'alerta');
        return;
    }
    
    try {
        await firebase.auth().signInWithEmailAndPassword(email, senha);
        adminLogado = true;
        nivelAcesso = 'master';
        fecharModalLogin();
        mostrarToast('Bem-vindo, Admin!', 'sucesso');
        atualizarInterfaceAdmin();
        abrirModalAdmin();
    } catch (error) {
        document.getElementById('erroLogin').style.display = 'block';
        mostrarToast('Email ou senha incorretos!', 'erro');
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
                <span>${getIconeCategoria(cat)} ${getNomeCategoria(cat)} <small style="color: #e65100;">(fixa)</small></span>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <button onclick="toggleVisibilidadeCategoria('${cat}')" 
                            class="btn-disponibilidade-admin" 
                            title="${visivel ? 'Visível - Clique para ocultar' : 'Oculta - Clique para mostrar'}"
                            style="
                                width: 38px; height: 38px; border-radius: 50%; border: none;
                                cursor: pointer; font-size: 1rem; display: flex; align-items: center; justify-content: center;
                                transition: all 0.3s ease;
                                background: ${visivel ? 'rgba(76, 175, 80, 0.15)' : 'rgba(244, 67, 54, 0.15)'};
                                color: ${visivel ? '#4CAF50' : '#f44336'};
                            ">
                        <i class="fas ${visivel ? 'fa-eye' : 'fa-eye-slash'}"></i>
                    </button>
                    <span title="Categoria fixa" style="
                        width: 38px; height: 38px; border-radius: 50%;
                        display: flex; align-items: center; justify-content: center;
                        background: rgba(158, 158, 158, 0.1); color: #9e9e9e; font-size: 0.9rem;
                    ">
                        <i class="fas fa-lock"></i>
                    </span>
                </div>
            `;
        } else {
            div.innerHTML = `
                <span>${getIconeCategoria(cat)} ${getNomeCategoria(cat)}</span>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <button onclick="toggleVisibilidadeCategoria('${cat}')" 
                            class="btn-disponibilidade-admin" 
                            title="${visivel ? 'Visível - Clique para ocultar' : 'Oculta - Clique para mostrar'}"
                            style="
                                width: 38px; height: 38px; border-radius: 50%; border: none;
                                cursor: pointer; font-size: 1rem; display: flex; align-items: center; justify-content: center;
                                transition: all 0.3s ease;
                                background: ${visivel ? 'rgba(76, 175, 80, 0.15)' : 'rgba(244, 67, 54, 0.15)'};
                                color: ${visivel ? '#4CAF50' : '#f44336'};
                            ">
                        <i class="fas ${visivel ? 'fa-eye' : 'fa-eye-slash'}"></i>
                    </button>
                    <button onclick="excluirCategoria('${cat}')" 
                            class="btn-excluir-admin" 
                            title="Excluir categoria"
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
        }
        
        container.appendChild(div);
    });
}


async function toggleVisibilidadeCategoria(cat) {
    if (!adminLogado) {
        mostrarToast('Faça login para alterar visibilidade', 'alerta');
        return;
    }

    const visivel = categoriasVisiveis[cat] !== false;
    categoriasVisiveis[cat] = !visivel;

    const sucesso = await salvarCategoriasVisiveisFirebase(categoriasVisiveis);
    if (sucesso) {
        const status = !visivel ? 'visível' : 'oculta';
        mostrarToast(`Categoria ${getNomeCategoria(cat)} agora está ${status}`, 'sucesso');
        renderizarTodasCategorias();
        carregarAdminCategorias();
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
                <div style="display: flex; align-items: center; gap: 8px;">
                    <button onclick="toggleDisponibilidadeAdicional('${categoria}', ${idx})" 
                            class="btn-disponibilidade-admin" 
                            title="${adicional.disponivel !== false ? 'Disponível - Clique para indisponibilizar' : 'Indisponível - Clique para disponibilizar'}"
                            style="
                                width: 38px; height: 38px; border-radius: 50%; border: none;
                                cursor: pointer; font-size: 1rem; display: flex; align-items: center; justify-content: center;
                                transition: all 0.3s ease;
                                background: ${adicional.disponivel !== false ? 'rgba(76, 175, 80, 0.15)' : 'rgba(244, 67, 54, 0.15)'};
                                color: ${adicional.disponivel !== false ? '#4CAF50' : '#f44336'};
                            ">
                        <i class="fas ${adicional.disponivel !== false ? 'fa-eye' : 'fa-eye-slash'}"></i>
                    </button>
                    ${nivelAcesso === 'master' ? `
                        <button onclick="excluirAdicional('${categoria}', ${idx})" 
                                class="btn-excluir-admin" 
                                title="Excluir adicional"
                                style="
                                    width: 38px; height: 38px; border-radius: 50%; border: none;
                                    cursor: pointer; font-size: 0.95rem; display: flex; align-items: center; justify-content: center;
                                    transition: all 0.3s ease;
                                    background: rgba(244, 67, 54, 0.1);
                                    color: #f44336;
                                ">
                            <i class="fas fa-trash-can"></i>
                        </button>
                    ` : ''}
                </div>
            `;
            container.appendChild(div);
        });
    }
}

async function toggleDisponibilidadeAdicional(categoria, index) {
    if (!adminLogado) {
        mostrarToast('Faça login para alterar disponibilidade', 'alerta');
        return;
    }
    
    const adicional = adicionaisPorCategoria[categoria][index];
    adicional.disponivel = adicional.disponivel === false ? true : false;
    
    const sucesso = await salvarAdicionaisFirebase(adicionaisPorCategoria);
    if (sucesso) {
        const status = adicional.disponivel !== false ? 'disponível' : 'indisponível';
        mostrarToast(`${adicional.nome} agora está ${status}`, 'sucesso');
        carregarAdminAdicionais();
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
// ===== 🛠️ ADMIN MONTAGENS (COMPLETO - VIEW E MASTER) ========
// ============================================

let montagemEditando = null;

function carregarAdminMontagens() {
    const container = document.getElementById('listaMontagens');
    container.innerHTML = '';
    container.classList.add('admin-montagens-lista');
    
    if (montagens.length === 0) {
        container.innerHTML = `
            <div class="admin-section" style="text-align:center;padding:40px;">
                <i class="fas fa-puzzle-piece" style="font-size:2.5rem;opacity:.2;margin-bottom:12px;"></i>
                <p style="color:var(--text-secondary);font-size:.9rem;">Nenhuma montagem cadastrada</p>
            </div>
        `;
        return;
    }
    
    montagens.forEach(montagem => {
        const div = document.createElement('div');
        div.className = 'admin-montagem-card';
        div.innerHTML = `
            <div class="admin-montagem-info">
                <div class="admin-montagem-title">
                    <i class="fas fa-puzzle-piece"></i>
                    ${montagem.nome}
                </div>
                <div class="admin-montagem-meta">
                    <span><i class="fas fa-folder"></i>${getNomeCategoria(montagem.categoria)}</span>
                    <span><i class="fas fa-dollar-sign"></i>Base: ${formatarPreco(montagem.precoBase)}</span>
                </div>
            </div>
            <div class="admin-actions">
                <button onclick="toggleDisponibilidadeMontagem('${montagem.id}')"
                        class="admin-icon-btn ${montagem.disponivel ? 'btn-view' : 'btn-hidden'}"
                        title="${montagem.disponivel ? 'Disponível' : 'Indisponível'}">
                    <i class="fas ${montagem.disponivel ? 'fa-eye' : 'fa-eye-slash'}"></i>
                </button>
                <button onclick="editarMontagem('${montagem.id}')"
                        class="admin-icon-btn btn-edit"
                        title="Editar montagem">
                    <i class="fas fa-pen-to-square"></i>
                </button>
                ${nivelAcesso === 'master' ? `
                    <button onclick="excluirMontagem('${montagem.id}')"
                            class="admin-icon-btn btn-delete"
                            title="Excluir montagem">
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
    
    // Habilita campos para Master
    document.getElementById('montagemNome').readOnly = false;
    document.getElementById('montagemDesc').readOnly = false;
    document.getElementById('montagemPrecoBase').readOnly = false;
    document.getElementById('montagemImagem').readOnly = false;
    document.getElementById('montagemDisponivel').disabled = false;
    document.getElementById('montagemDestaque').disabled = false;
    document.getElementById('montagemCategoria').disabled = false;
    
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
    
    // Botão salvar normal
    const btnSalvar = document.querySelector('#modalCadastroMontagem .btn-adicionar-carrinho');
    if (btnSalvar) {
        btnSalvar.innerHTML = '💾 Salvar Montagem';
        btnSalvar.style.background = 'var(--cor-primaria)';
    }
    
    // Remove bloqueios de view
    document.querySelectorAll('#tamanhosContainer input, #gruposContainer input[type="text"], #gruposContainer input[type="number"]').forEach(input => {
        input.readOnly = false;
        input.disabled = false;
    });
    
    const modal = document.getElementById('modalCadastroMontagem');
    modal.style.display = 'flex';
    requestAnimationFrame(() => {
        modal.classList.add('active');
    });
}

function editarMontagem(id) {
    const montagem = montagens.find(m => m.id === id);
    if (!montagem) return;
    
    montagemEditando = montagem;
    
    const isView = nivelAcesso === 'view';
    const tituloIcone = isView ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-pen-to-square"></i>';
    const tituloTexto = isView ? 'Visualizar Disponibilidade' : 'Editar Montagem';
    
    document.getElementById('modalMontagemTitulo').innerHTML = `${tituloIcone} ${tituloTexto}`;
    document.getElementById('editMontagemId').value = montagem.id;
    document.getElementById('montagemNome').value = montagem.nome;
    document.getElementById('montagemDesc').value = montagem.descricao || '';
    document.getElementById('montagemPrecoBase').value = centavosParaFloat(montagem.precoBase);
    document.getElementById('montagemImagem').value = montagem.imagem || '';
    document.getElementById('montagemDisponivel').checked = montagem.disponivel;
    document.getElementById('montagemDestaque').checked = montagem.destaque || false;

    // Botão Desativar Todos ao lado de "Em destaque" (View)
if (adminLogado) {
    const checkboxGroup = document.querySelector('#modalCadastroMontagem .checkbox-group');
    if (checkboxGroup) {
        const btnTodos = document.createElement('button');
        btnTodos.type = 'button';
        btnTodos.innerHTML = '<i class="fas fa-eye-slash"></i> Desativar Todos';
        btnTodos.style.cssText = `
            margin-left: 12px;
            padding: 6px 14px;
            font-size: 0.75rem;
            font-weight: 600;
            border: none;
            border-radius: 20px;
            cursor: pointer;
            background: rgba(220, 38, 38, 0.1);
            color: #dc2626;
            transition: all 0.2s ease;
        `;
        btnTodos.onmouseenter = () => { btnTodos.style.background = '#dc2626'; btnTodos.style.color = '#fff'; };
        btnTodos.onmouseleave = () => { btnTodos.style.background = 'rgba(220, 38, 38, 0.1)'; btnTodos.style.color = '#dc2626'; };
        btnTodos.onclick = (e) => {
            e.preventDefault();
            desativarTodosItens();
        };
        checkboxGroup.appendChild(btnTodos);
    }
}
    
    const selectCat = document.getElementById('montagemCategoria');
    selectCat.innerHTML = '';
    categorias.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = getNomeCategoria(cat);
        if (cat === montagem.categoria) option.selected = true;
        selectCat.appendChild(option);
    });
    
    // ===== BLOQUEIA CAMPOS PARA VIEW =====
    if (adminLogado) {
        document.getElementById('montagemNome').readOnly = true;
        document.getElementById('montagemDesc').readOnly = true;
        document.getElementById('montagemPrecoBase').readOnly = true;
        document.getElementById('montagemImagem').readOnly = true;
        document.getElementById('montagemDisponivel').disabled = true;
        document.getElementById('montagemDestaque').disabled = true;
        document.getElementById('montagemCategoria').disabled = true;
        
        // Muda o botão salvar
        const btnSalvar = document.querySelector('#modalCadastroMontagem .btn-adicionar-carrinho');
        if (btnSalvar) {
            btnSalvar.innerHTML = '💾 Salvar Disponibilidade';
            btnSalvar.style.background = 'var(--cor-alerta)';
        }
    } else {
        // Habilita para Master
        document.getElementById('montagemNome').readOnly = false;
        document.getElementById('montagemDesc').readOnly = false;
        document.getElementById('montagemPrecoBase').readOnly = false;
        document.getElementById('montagemImagem').readOnly = false;
        document.getElementById('montagemDisponivel').disabled = false;
        document.getElementById('montagemDestaque').disabled = false;
        document.getElementById('montagemCategoria').disabled = false;
        
        const btnSalvar = document.querySelector('#modalCadastroMontagem .btn-adicionar-carrinho');
        if (btnSalvar) {
            btnSalvar.innerHTML = '💾 Salvar Montagem';
            btnSalvar.style.background = 'var(--cor-primaria)';
        }
    }
    
    renderizarTamanhosMontagem(montagem, isView);
    renderizarGruposMontagem(montagem, isView);

      if (adminLogado) {
        const botoesContainer = document.createElement('div');
        botoesContainer.style.cssText = 'display: flex; gap: 10px; margin-top: 15px; flex-wrap: wrap;';
        
        const btnTodos = document.createElement('button');
        btnTodos.className = 'admin-btn admin-btn-danger';
        btnTodos.innerHTML = '<i class="fas fa-eye-slash"></i> Desativar Todos';
        btnTodos.onclick = () => desativarTodosItens();
        botoesContainer.appendChild(btnTodos);
        
        montagem.grupos.forEach((grupo, idx) => {
            const btnGrupo = document.createElement('button');
            btnGrupo.className = 'admin-btn admin-btn-soft';
            btnGrupo.innerHTML = `<i class="fas fa-eye-slash"></i> Desativar: ${grupo.nome}`;
            btnGrupo.style.cssText = 'background: rgba(220, 38, 38, 0.08); color: #dc2626; font-size: 0.8rem;';
            btnGrupo.onclick = () => desativarItensGrupo(idx);
            botoesContainer.appendChild(btnGrupo);
        });
        
        const btnSalvar = document.querySelector('#modalCadastroMontagem .btn-adicionar-carrinho');
        btnSalvar.parentNode.insertBefore(botoesContainer, btnSalvar);
    }
    
    const modal = document.getElementById('modalCadastroMontagem');
    modal.style.display = 'flex';
    requestAnimationFrame(() => {
        modal.classList.add('active');
    });
}

function fecharModalCadastroMontagem() {
    const modal = document.getElementById('modalCadastroMontagem');
    modal.classList.remove('active');
    setTimeout(() => {
        modal.style.display = 'none';
    }, 250);
}

// ============================================
// ===== TAMANHOS =============================
// ============================================

function adicionarTamanho() {
    if (nivelAcesso === 'view') return;
    
    const container = document.getElementById('tamanhosContainer');
    const div = document.createElement('div');
    div.className = 'admin-item';
    div.innerHTML = `
        <input type="text" placeholder="Nome do tamanho" class="admin-input">
        <div style="display:flex;align-items:center;gap:4px;">
            <span style="color:var(--text-secondary);">R$</span>
            <input type="number" placeholder="0.00" step="0.01" value="0" class="admin-input" style="text-align:right;">
        </div>
        <button onclick="this.parentElement.remove()" class="admin-icon-btn btn-delete">
            <i class="fas fa-xmark"></i>
        </button>
    `;
    container.appendChild(div);
}

function renderizarTamanhosMontagem(montagem, isView = false) {
    const container = document.getElementById('tamanhosContainer');
    container.innerHTML = '';
    
    if (montagem.tamanhos) {
        montagem.tamanhos.forEach(tamanho => {
            const div = document.createElement('div');
            div.className = 'admin-item';
            div.innerHTML = `
                <input type="text" value="${tamanho.nome}" class="admin-input" ${isView ? 'readonly' : ''}>
                <div style="display:flex;align-items:center;gap:4px;">
                    <span style="color:var(--text-secondary);">R$</span>
                    <input type="number" value="${centavosParaFloat(tamanho.preco)}" step="0.01" class="admin-input" style="text-align:right;" ${isView ? 'readonly' : ''}>
                </div>
                ${isView ? '' : `
                <button onclick="this.parentElement.remove()" class="admin-icon-btn btn-delete">
                    <i class="fas fa-xmark"></i>
                </button>
                `}
            `;
            container.appendChild(div);
        });
    }
    
    // Esconde botão adicionar para View
    const btnAddTamanho = container.nextElementSibling;
    if (btnAddTamanho && btnAddTamanho.tagName === 'BUTTON') {
        btnAddTamanho.style.display = isView ? 'none' : 'inline-block';
    }
}

// ============================================
// ===== GRUPOS E ITENS =======================
// ============================================

function adicionarGrupo() {
    if (nivelAcesso === 'view') return;
    
    const container = document.getElementById('gruposContainer');
    const grupoId = 'grp_' + Date.now();
    
    const div = document.createElement('div');
    div.className = 'admin-group-card';
    div.dataset.grupoId = grupoId;
    div.innerHTML = `
        <div class="admin-group-header">
            <input type="text" placeholder="Nome do grupo" class="admin-input" onchange="atualizarTituloGrupo(this)">
            <input type="number" value="1" min="1" class="admin-input" style="width:80px;text-align:center;" placeholder="Limite">
            <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:0.8rem;font-weight:600;">
                <input type="checkbox" checked style="accent-color:var(--danger);"> Obrigatório
            </label>
            <button onclick="this.closest('.admin-group-card').remove()" class="admin-icon-btn btn-delete">
                <i class="fas fa-trash-can"></i>
            </button>
        </div>
        <div class="admin-group-items"></div>
        <div style="padding:10px;">
            <button onclick="adicionarItemGrupo(this)" class="admin-btn admin-btn-soft" style="width:100%;">
                <i class="fas fa-plus"></i> Adicionar Item
            </button>
        </div>
    `;
    container.appendChild(div);
}

function atualizarTituloGrupo(input) {
    // placeholder para uso futuro
}

function adicionarItemGrupo(btn) {
    if (nivelAcesso === 'view') return;
    
    const container = btn.closest('.admin-group-card').querySelector('.admin-group-items');
    const itemDiv = document.createElement('div');
    itemDiv.className = 'admin-item';
    itemDiv.innerHTML = `
        <input type="text" placeholder="Nome do item" class="admin-input">
        <div style="display:flex;align-items:center;gap:4px;">
            <span style="color:var(--text-secondary);">R$</span>
            <input type="number" step="0.01" value="0" class="admin-input" style="text-align:right;">
        </div>
        <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:0.78rem;font-weight:600;">
            <input type="checkbox" checked style="accent-color:var(--success);"> Ativo
        </label>
        <button onclick="this.parentElement.remove()" class="admin-icon-btn btn-delete">
            <i class="fas fa-xmark"></i>
        </button>
    `;
    container.appendChild(itemDiv);
}

function renderizarGruposMontagem(montagem, isView = false) {
    const container = document.getElementById('gruposContainer');
    container.innerHTML = '';
    
    montagem.grupos.forEach(grupo => {
        const div = document.createElement('div');
        div.className = 'admin-group-card';
        div.dataset.grupoId = grupo.id;
        div.innerHTML = `
            <div class="admin-group-header">
                <input type="text" value="${grupo.nome}" class="admin-input" ${isView ? 'readonly' : ''}>
                <input type="number" value="${grupo.limite}" min="1" class="admin-input" style="width:80px;text-align:center;" ${isView ? 'readonly' : ''}>
                <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:0.8rem;font-weight:600; ${isView ? 'opacity:0.6;' : ''}">
                    <input type="checkbox" ${grupo.obrigatorio ? 'checked' : ''} style="accent-color:var(--danger);" ${isView ? 'disabled' : ''}> Obrigatório
                </label>
                ${isView ? '' : `
                <button onclick="this.closest('.admin-group-card').remove()" class="admin-icon-btn btn-delete">
                    <i class="fas fa-trash-can"></i>
                </button>
                `}
            </div>
            <div class="admin-group-items"></div>
            ${isView ? '' : `
            <div style="padding:10px;">
                <button onclick="adicionarItemGrupo(this)" class="admin-btn admin-btn-soft" style="width:100%;">
                    <i class="fas fa-plus"></i> Adicionar Item
                </button>
            </div>
            `}
        `;
        
        const itensContainer = div.querySelector('.admin-group-items');
        grupo.itens.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'admin-item';
            itemDiv.innerHTML = `
                <input type="text" value="${item.nome}" class="admin-input" ${isView ? 'readonly' : ''}>
                <div style="display:flex;align-items:center;gap:4px;">
                    <span style="color:var(--text-secondary);">R$</span>
                    <input type="number" value="${centavosParaFloat(item.preco)}" step="0.01" class="admin-input" style="text-align:right;" ${isView ? 'readonly' : ''}>
                </div>
                <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:0.78rem;font-weight:600;">
                    <input type="checkbox" ${item.disponivel !== false ? 'checked' : ''} style="accent-color:var(--success);"> Ativo
                </label>
                ${isView ? '' : `
                <button onclick="this.parentElement.remove()" class="admin-icon-btn btn-delete">
                    <i class="fas fa-xmark"></i>
                </button>
                `}
            `;
            itensContainer.appendChild(itemDiv);
        });
        
        container.appendChild(div);
    });
}

// ============================================
// ===== SALVAR E EXCLUIR =====================
// ============================================

async function salvarMontagem() {
    // ===== VIEW: Só salva disponibilidade dos itens =====
    if (nivelAcesso === 'view') {
        if (!montagemEditando) {
            mostrarToast('Nenhuma montagem para salvar', 'erro');
            return;
        }
        
        const gruposContainer = document.getElementById('gruposContainer');
        const gruposCards = gruposContainer.querySelectorAll('.admin-group-card');
        
        gruposCards.forEach((box, grupoIdx) => {
            const itensDivs = box.querySelectorAll('.admin-group-items .admin-item');
            itensDivs.forEach((itemDiv, itemIdx) => {
                const checkboxAtivo = itemDiv.querySelector('input[type="checkbox"]:last-of-type');
                if (checkboxAtivo && montagemEditando.grupos[grupoIdx] && montagemEditando.grupos[grupoIdx].itens[itemIdx]) {
                    montagemEditando.grupos[grupoIdx].itens[itemIdx].disponivel = checkboxAtivo.checked;
                }
            });
        });
        
        const sucesso = await salvarMontagensFirebase(montagens);
        if (sucesso) {
            mostrarToast('Disponibilidade dos itens atualizada!', 'sucesso');
            fecharModalCadastroMontagem();
            renderizarProdutos();
            carregarAdminMontagens();
            abrirModalAdmin();
        }
        return;
    }
    
    // ===== MASTER: Salva tudo =====
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
    document.querySelectorAll('#tamanhosContainer .admin-item').forEach(item => {
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
    document.querySelectorAll('#gruposContainer .admin-group-card').forEach(box => {
        const cabecalhoInputs = box.querySelectorAll('.admin-group-header input');
        const nomeGrupo = cabecalhoInputs[0]?.value?.trim();
        if (!nomeGrupo) return;
        
        const grupoId = box.dataset.grupoId || 'grp_' + gerarId();
        const limite = parseInt(cabecalhoInputs[1]?.value) || 1;
        const obrigatorio = cabecalhoInputs[2]?.checked || false;
        
        const itens = [];
        box.querySelectorAll('.admin-group-items .admin-item').forEach(itemDiv => {
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
// ===== MODAL UX GLOBAL ======================
// ============================================

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const modal = document.getElementById('modalCadastroMontagem');
        if (modal && modal.classList.contains('active')) {
            fecharModalCadastroMontagem();
        }
    }
});

document.addEventListener('click', (e) => {
    const modal = document.getElementById('modalCadastroMontagem');
    if (modal && e.target === modal) {
        fecharModalCadastroMontagem();
    }
});

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

function desativarTodosItens() {
    if (!confirm('Desativar TODOS os itens desta montagem?')) return;
    
    const gruposContainer = document.getElementById('gruposContainer');
    const checkboxes = gruposContainer.querySelectorAll('.admin-group-items input[type="checkbox"]:last-of-type');
    checkboxes.forEach(cb => { cb.checked = false; });
    mostrarToast('Todos os itens desativados!', 'info');
}

function desativarItensGrupo(grupoIdx) {
    const gruposContainer = document.getElementById('gruposContainer');
    const gruposCards = gruposContainer.querySelectorAll('.admin-group-card');
    
    if (!gruposCards[grupoIdx]) return;
    
    if (!confirm(`Desativar todos os itens do grupo?`)) return;
    
    const checkboxes = gruposCards[grupoIdx].querySelectorAll('.admin-group-items input[type="checkbox"]:last-of-type');
    checkboxes.forEach(cb => { cb.checked = false; });
    mostrarToast('Itens do grupo desativados!', 'info');
}

// ===== EXPOR =====
window.abrirModalLogin = abrirModalLogin;
window.fecharModalLogin = fecharModalLogin;
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
window.toggleDisponibilidadeAdicional = toggleDisponibilidadeAdicional;
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
window.abrirModalNovaMontagem = abrirModalNovaMontagem;
window.editarMontagem = editarMontagem;
window.fecharModalCadastroMontagem = fecharModalCadastroMontagem;
window.salvarMontagem = salvarMontagem;
window.excluirMontagem = excluirMontagem;
window.adicionarTamanho = adicionarTamanho;
window.adicionarGrupo = adicionarGrupo;
window.adicionarItemGrupo = adicionarItemGrupo;
window.atualizarTituloGrupo = atualizarTituloGrupo;
window.desativarTodosItens = desativarTodosItens;
window.desativarItensGrupo = desativarItensGrupo;

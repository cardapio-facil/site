// ============================================
// ===== CONFIGURAÇÃO DO FIREBASE ============
// ============================================

// CONFIGURAÇÃO DO FIREBASE (substitua pelos seus dados)
const firebaseConfig = {
    apiKey: "AIzaSyDjJG3qD1OhPJ_N-mfzH-ChMvHAez6XsGc",
    authDomain: "graus-38cce.firebaseapp.com",
    databaseURL: "https://graus-38cce-default-rtdb.firebaseio.com",
    projectId: "graus-38cce",
    storageBucket: "graus-38cce.firebasestorage.app",
    messagingSenderId: "167323638749",
    appId: "1:167323638749:web:6675d3d1edec31096b7434"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const dbRef = database.ref('restaurantes/' + RESTAURANTE_ID);

// ===== FUNÇÕES DE PERSISTÊNCIA =====

// Salvar Produtos
async function salvarProdutosFirebase(produtos) {
    try {
        await dbRef.child('produtos').set(produtos);
        return true;
    } catch (error) {
        console.error('Erro ao salvar produtos:', error);
        mostrarToast('Erro ao salvar produtos no servidor', 'erro');
        return false;
    }
}

// Salvar Categorias
async function salvarCategoriasFirebase(categorias) {
    try {
        await dbRef.child('categorias').set(categorias);
        return true;
    } catch (error) {
        console.error('Erro ao salvar categorias:', error);
        mostrarToast('Erro ao salvar categorias', 'erro');
        return false;
    }
}

// Salvar Adicionais
async function salvarAdicionaisFirebase(adicionais) {
    try {
        await dbRef.child('adicionais').set(adicionais);
        return true;
    } catch (error) {
        console.error('Erro ao salvar adicionais:', error);
        mostrarToast('Erro ao salvar adicionais', 'erro');
        return false;
    }
}

// Salvar Configurações
async function salvarConfigFirebase(config) {
    try {
        await dbRef.child('config').set(config);
        return true;
    } catch (error) {
        console.error('Erro ao salvar configurações:', error);
        mostrarToast('Erro ao salvar configurações', 'erro');
        return false;
    }
}

// ===== FUNÇÕES DE PERSISTÊNCIA (ATUALIZADAS) =====

// Salvar Pedido com transação para número
async function salvarPedidoFirebase(pedido) {
    try {
        // Gera a chave da data atual (YYYYMMDD)
        const hoje = new Date();
        const dataKey = hoje.getFullYear() +
            String(hoje.getMonth() + 1).padStart(2, '0') +
            String(hoje.getDate()).padStart(2, '0');
        
        const contadorRef = database.ref(`restaurantes/${RESTAURANTE_ID}/contadores/${dataKey}`);
        
        // Usa transação para evitar concorrência
        const numeroPedido = await new Promise((resolve, reject) => {
            contadorRef.transaction((valorAtual) => {
                if (valorAtual === null) {
                    return { ultimoNumero: 1 };
                }
                return { ultimoNumero: (valorAtual.ultimoNumero || 0) + 1 };
            }, (erro, committed, snapshot) => {
                if (erro) {
                    reject(erro);
                } else if (committed) {
                    const numero = snapshot.val().ultimoNumero;
                    // Formata: 20240315-001
                    const numeroFormatado = `${dataKey}-${String(numero).padStart(3, '0')}`;
                    resolve(numeroFormatado);
                } else {
                    reject(new Error('Transação não confirmada'));
                }
            });
        });
        
        pedido.numero = numeroPedido;
        
        // Função para remover undefined recursivamente
        function limparUndefined(obj) {
            if (obj === null || obj === undefined) return null;
            if (Array.isArray(obj)) {
                return obj.map(item => limparUndefined(item));
            }
            if (typeof obj === 'object') {
                const cleaned = {};
                for (const key in obj) {
                    const value = obj[key];
                    if (value !== undefined) {
                        cleaned[key] = limparUndefined(value);
                    }
                }
                return cleaned;
            }
            return obj;
        }
        
        const pedidoLimpo = limparUndefined(pedido);
        
        console.log('📤 Salvando pedido:', pedidoLimpo);
        await dbRef.child('pedidos/' + pedidoLimpo.id).set(pedidoLimpo);
        console.log('✅ Pedido salvo com sucesso!');
        
        return true;
    } catch (error) {
        console.error('❌ Erro ao salvar pedido:', error);
        mostrarToast('Erro ao salvar pedido. Tente novamente.', 'erro');
        return false;
    }
}

// Atualizar Status do Pedido
async function atualizarStatusPedidoFirebase(pedidoId, status) {
    try {
        await dbRef.child('pedidos/' + pedidoId + '/status').set(status);
        return true;
    } catch (error) {
        console.error('Erro ao atualizar status:', error);
        return false;
    }
}

// Salvar visibilidade das categorias
async function salvarCategoriasVisiveisFirebase(visiveis) {
    try {
        await dbRef.child('categoriasVisiveis').set(visiveis);
        return true;
    } catch (error) {
        console.error('Erro ao salvar visibilidade:', error);
        return false;
    }
}

// 🛠️ Salvar Montagens
async function salvarMontagensFirebase(montagens) {
    try {
        await dbRef.child('montagens').set(montagens);
        return true;
    } catch (error) {
        console.error('Erro ao salvar montagens:', error);
        mostrarToast('Erro ao salvar montagens', 'erro');
        return false;
    }
}

// Carregar todos os dados
async function carregarDadosFirebase() {
    mostrarLoader(true);
    
    try {
        const snapshot = await dbRef.once('value');
        const data = snapshot.val();
        
        mostrarLoader(false);
        return data || {};
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        mostrarToast('Erro ao carregar dados do servidor', 'erro');
        mostrarLoader(false);
        return {};
    }
}

// ===== EXPOR FUNÇÕES GLOBALMENTE =====
window.salvarProdutosFirebase = salvarProdutosFirebase;
window.salvarCategoriasFirebase = salvarCategoriasFirebase;
window.salvarAdicionaisFirebase = salvarAdicionaisFirebase;
window.salvarConfigFirebase = salvarConfigFirebase;
window.salvarPedidoFirebase = salvarPedidoFirebase;
window.atualizarStatusPedidoFirebase = atualizarStatusPedidoFirebase;
window.salvarCategoriasVisiveisFirebase = salvarCategoriasVisiveisFirebase;
window.salvarMontagensFirebase = salvarMontagensFirebase;
window.carregarDadosFirebase = carregarDadosFirebase;
window.dbRef = dbRef;

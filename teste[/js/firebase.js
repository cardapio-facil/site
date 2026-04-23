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

// Salvar Pedido
async function salvarPedidoFirebase(pedido) {
    try {
        await dbRef.child('pedidos/' + pedido.id).set(pedido);
        return true;
    } catch (error) {
        console.error('Erro ao salvar pedido:', error);
        mostrarToast('Erro ao salvar pedido', 'erro');
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

// Carregar todos os dados
async function carregarDadosFirebase() {
    mostrarLoader(true);
    
    try {
        const snapshot = await dbRef.once('value');
        const data = snapshot.val();
        
        return data || {};
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        mostrarToast('Erro ao carregar dados do servidor', 'erro');
        return {};
    } finally {
        mostrarLoader(false);
    }
}
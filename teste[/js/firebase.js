// ============================================
// ===== CONFIGURAÇÃO DO FIREBASE ============
// ============================================

const firebaseConfig = {
    apiKey: "AIzaSyDjJG3qD1OhPJ_N-mfzH-ChMvHAez6XsGc",
    authDomain: "graus-38cce.firebaseapp.com",
    databaseURL: "https://graus-38cce-default-rtdb.firebaseio.com",
    projectId: "graus-38cce",
    storageBucket: "graus-38cce.firebasestorage.app",
    messagingSenderId: "167323638749",
    appId: "1:167323638749:web:6675d3d1edec31096b7434"
};

firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const dbRef = database.ref('restaurantes/' + RESTAURANTE_ID);

// ===== PRODUTOS =====
async function salvarProdutosFirebase(produtos) {
    try {
        await dbRef.child('produtos').set(produtos);
        console.log('✅ Produtos salvos');
        return true;
    } catch (error) {
        console.error('Erro ao salvar produtos:', error);
        mostrarToast('Erro ao salvar produtos no servidor', 'erro');
        return false;
    }
}

// ===== CATEGORIAS =====
async function salvarCategoriasFirebase(categorias) {
    try {
        await dbRef.child('categorias').set(categorias);
        console.log('✅ Categorias salvas');
        return true;
    } catch (error) {
        console.error('Erro ao salvar categorias:', error);
        mostrarToast('Erro ao salvar categorias', 'erro');
        return false;
    }
}

// ===== ADICIONAIS =====
async function salvarAdicionaisFirebase(adicionais) {
    try {
        await dbRef.child('adicionais').set(adicionais);
        console.log('✅ Adicionais salvos');
        return true;
    } catch (error) {
        console.error('Erro ao salvar adicionais:', error);
        mostrarToast('Erro ao salvar adicionais', 'erro');
        return false;
    }
}

// ===== CONFIGURAÇÕES =====
async function salvarConfigFirebase(config) {
    try {
        await dbRef.child('config').set(config);
        console.log('✅ Configurações salvas');
        return true;
    } catch (error) {
        console.error('Erro ao salvar configurações:', error);
        mostrarToast('Erro ao salvar configurações', 'erro');
        return false;
    }
}

// ===== PEDIDO (COM TRANSAÇÃO) =====
async function salvarPedidoFirebase(pedido) {
    try {
        const hoje = new Date();
        const chaveMensal = hoje.getFullYear() +
            String(hoje.getMonth() + 1).padStart(2, '0');
        
        const contadorRef = database.ref(`restaurantes/${RESTAURANTE_ID}/contadores/${chaveMensal}`);
        
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
                    resolve(String(numero));
                } else {
                    reject(new Error('Transação não confirmada'));
                }
            });
        });
        
        pedido.numero = numeroPedido;
        
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
        
        console.log('📤 Salvando pedido #' + numeroPedido);
        await dbRef.child('pedidos/' + pedidoLimpo.id).set(pedidoLimpo);
        console.log('✅ Pedido #' + numeroPedido + ' salvo!');
        
        return true;
    } catch (error) {
        console.error('❌ Erro ao salvar pedido:', error);
        mostrarToast('Erro ao salvar pedido. Tente novamente.', 'erro');
        return false;
    }
}

async function atualizarStatusPedidoFirebase(pedidoId, novoStatus, responsavel = 'sistema') {
    try {
        const pedidoRef = dbRef.child('pedidos/' + pedidoId);
        await pedidoRef.child('status').set(novoStatus);
        
        const novoHistorico = {
            status: novoStatus,
            em: firebase.database.ServerValue.TIMESTAMP,
            por: responsavel
        };
        
        await pedidoRef.child('statusHistorico').push(novoHistorico);
        await pedidoRef.child('atualizadoEm').set(firebase.database.ServerValue.TIMESTAMP);
        
        console.log(`✅ Status do pedido ${pedidoId} atualizado para: ${novoStatus}`);
        return true;
    } catch (error) {
        console.error('Erro ao atualizar status:', error);
        return false;
    }
}

// ===== CATEGORIAS VISIVEIS =====
async function salvarCategoriasVisiveisFirebase(visiveis) {
    try {
        await dbRef.child('categoriasVisiveis').set(visiveis);
        console.log('✅ Visibilidade salva');
        return true;
    } catch (error) {
        console.error('Erro ao salvar visibilidade:', error);
        return false;
    }
}

// ===== MONTAGENS =====
async function salvarMontagensFirebase(montagens) {
    try {
        await dbRef.child('montagens').set(montagens);
        console.log('✅ Montagens salvas');
        return true;
    } catch (error) {
        console.error('Erro ao salvar montagens:', error);
        mostrarToast('Erro ao salvar montagens', 'erro');
        return false;
    }
}

// ===== 🆕 HORÁRIOS =====
async function salvarHorariosFirebase(horarios) {
    try {
        await dbRef.child('horarios').set(horarios);
        console.log('✅ Horários salvos');
        return true;
    } catch (error) {
        console.error('Erro ao salvar horários:', error);
        mostrarToast('Erro ao salvar horários', 'erro');
        return false;
    }
}

// ===== 🆕 FERIADOS =====
async function salvarFeriadosFirebase(feriados) {
    try {
        await dbRef.child('feriados').set(feriados);
        console.log('✅ Feriados salvos');
        return true;
    } catch (error) {
        console.error('Erro ao salvar feriados:', error);
        mostrarToast('Erro ao salvar feriados', 'erro');
        return false;
    }
}

// ===== CARREGAR DADOS =====
async function carregarDadosFirebase() {
    mostrarLoader(true);
    
    try {
        console.log('📥 Carregando dados do Firebase...');
        const snapshot = await dbRef.once('value');
        const data = snapshot.val();
        
        if (data) {
            console.log('✅ Dados carregados:', {
                produtos: data.produtos ? Object.keys(data.produtos).length + ' produtos' : 'nenhum',
                categorias: data.categorias ? data.categorias.length + ' categorias' : 'nenhuma',
                montagens: data.montagens ? data.montagens.length + ' montagens' : 'nenhuma',
                horarios: data.horarios ? data.horarios.length + ' horários' : 'nenhum',
                feriados: data.feriados ? data.feriados.length + ' feriados' : 'nenhum',
                pedidos: data.pedidos ? Object.keys(data.pedidos).length + ' pedidos' : 'nenhum'
            });
        } else {
            console.log('📭 Nenhum dado encontrado');
        }
        
        mostrarLoader(false);
        return data || {};
    } catch (error) {
        console.error('❌ Erro ao carregar dados:', error);
        mostrarToast('Erro ao carregar dados do servidor. Verifique sua conexão.', 'erro');
        mostrarLoader(false);
        return {};
    }
}

// ===== BUSCAR PEDIDOS =====
async function buscarPedidosFirebase(status = null, limite = 50) {
    try {
        let query = dbRef.child('pedidos').orderByChild('criadoEm').limitToLast(limite);
        const snapshot = await query.once('value');
        const pedidos = snapshot.val();
        if (!pedidos) return [];
        
        let listaPedidos = Object.values(pedidos);
        if (status) {
            listaPedidos = listaPedidos.filter(p => p.status === status);
        }
        listaPedidos.sort((a, b) => {
            const dataA = a.criadoEm || 0;
            const dataB = b.criadoEm || 0;
            return dataB - dataA;
        });
        
        return listaPedidos;
    } catch (error) {
        console.error('Erro ao buscar pedidos:', error);
        return [];
    }
}

async function buscarPedidoPorIdFirebase(pedidoId) {
    try {
        const snapshot = await dbRef.child('pedidos/' + pedidoId).once('value');
        return snapshot.val() || null;
    } catch (error) {
        console.error('Erro ao buscar pedido:', error);
        return null;
    }
}

async function buscarPedidosPorDataFirebase(dataInicio, dataFim) {
    try {
        const snapshot = await dbRef.child('pedidos')
            .orderByChild('criadoEm')
            .startAt(dataInicio)
            .endAt(dataFim)
            .once('value');
        const pedidos = snapshot.val();
        return pedidos ? Object.values(pedidos) : [];
    } catch (error) {
        console.error('Erro ao buscar pedidos por data:', error);
        return [];
    }
}

function ouvirNovosPedidos(callback) {
    dbRef.child('pedidos')
        .orderByChild('criadoEm')
        .limitToLast(1)
        .on('child_added', (snapshot) => {
            const pedido = snapshot.val();
            if (pedido && pedido.status === 'novo') {
                callback(pedido);
            }
        });
}

function ouvirMudancasStatus(pedidoId, callback) {
    dbRef.child('pedidos/' + pedidoId + '/status').on('value', (snapshot) => {
        const novoStatus = snapshot.val();
        callback(novoStatus);
    });
}

function pararOuvir(caminho) {
    dbRef.child(caminho).off();
}

async function removerPedidoFirebase(pedidoId) {
    try {
        await dbRef.child('pedidos/' + pedidoId).remove();
        console.log('✅ Pedido removido:', pedidoId);
        return true;
    } catch (error) {
        console.error('Erro ao remover pedido:', error);
        return false;
    }
}

async function exportarDadosFirebase() {
    try {
        const snapshot = await dbRef.once('value');
        const dados = snapshot.val();
        const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup_${RESTAURANTE_ID}_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        mostrarToast('Backup exportado com sucesso!', 'sucesso');
        return true;
    } catch (error) {
        console.error('Erro ao exportar dados:', error);
        mostrarToast('Erro ao exportar backup', 'erro');
        return false;
    }
}

// ===== EXPOR =====
window.salvarProdutosFirebase = salvarProdutosFirebase;
window.salvarCategoriasFirebase = salvarCategoriasFirebase;
window.salvarAdicionaisFirebase = salvarAdicionaisFirebase;
window.salvarConfigFirebase = salvarConfigFirebase;
window.salvarPedidoFirebase = salvarPedidoFirebase;
window.atualizarStatusPedidoFirebase = atualizarStatusPedidoFirebase;
window.salvarCategoriasVisiveisFirebase = salvarCategoriasVisiveisFirebase;
window.salvarMontagensFirebase = salvarMontagensFirebase;
window.salvarHorariosFirebase = salvarHorariosFirebase;
window.salvarFeriadosFirebase = salvarFeriadosFirebase;
window.carregarDadosFirebase = carregarDadosFirebase;
window.buscarPedidosFirebase = buscarPedidosFirebase;
window.buscarPedidoPorIdFirebase = buscarPedidoPorIdFirebase;
window.buscarPedidosPorDataFirebase = buscarPedidosPorDataFirebase;
window.ouvirNovosPedidos = ouvirNovosPedidos;
window.ouvirMudancasStatus = ouvirMudancasStatus;
window.pararOuvir = pararOuvir;
window.removerPedidoFirebase = removerPedidoFirebase;
window.exportarDadosFirebase = exportarDadosFirebase;
window.dbRef = dbRef;
window.database = database;

// ============================================
// ===== CONFIGURAÇÃO DO FIREBASE =============
// ============================================

const firebaseConfig = {
  apiKey: "AIzaSyClupneHdQbiYljIJ8Wyk_BXitGIsU_gx0",
  authDomain: "cardapiofacil-4e926.firebaseapp.com",
  databaseURL: "https://cardapiofacil-4e926-default-rtdb.firebaseio.com",
  projectId: "cardapiofacil-4e926",
  storageBucket: "cardapiofacil-4e926.firebasestorage.app",
  messagingSenderId: "332501184621",
  appId: "1:332501184621:web:f7f0b8fd85bfe232414f64"
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

// ===== PEDIDO =====
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

// ===== HORÁRIOS =====
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

// ===== FERIADOS =====
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

// ===== CUPONS =====
async function salvarCuponsFirebase(cupons) {
    try {
        await dbRef.child('cupons').set(cupons);
        console.log('✅ Cupons salvos');
        return true;
    } catch (error) {
        console.error('Erro ao salvar cupons:', error);
        mostrarToast('Erro ao salvar cupons', 'erro');
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
            console.log('✅ Dados carregados');
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

// ============================================
// ===== SISTEMA DE INATIVIDADE (OTIMIZADO) ===
// ============================================

const TEMPO_INATIVIDADE = 360000;
const INTERVALO_VERIFICACAO = 60000;

const inactivityManager = {
    online: true,
    ultimaAtividade: Date.now(),
    intervaloId: null,
    modalAberto: false,

    iniciar() {
        if (typeof adminLogado !== 'undefined' && adminLogado) return;

        ['click', 'touchstart'].forEach(e => {
            document.addEventListener(e, () => this.reset(), { passive: true });
        });

        document.addEventListener('keydown', () => this.reset());
        document.addEventListener('visibilitychange', () => this.tratarVisibilidade());

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modalAberto) {
                this.reset();
            }
        });

        this.intervaloId = setInterval(() => this.verificar(), INTERVALO_VERIFICACAO);
        this.reset();
    },

    reset() {
        if (typeof adminLogado !== 'undefined' && adminLogado) return;

        this.ultimaAtividade = Date.now();

        if (!this.online) {
            console.log('🟢 Reconectando Firebase...');
            try {
                if (window.firebase && firebase.database) {
                    firebase.database().goOnline();
                    this.online = true;
                }
            } catch (e) {
                console.error('Erro ao reconectar:', e);
            }
        }

        if (this.modalAberto) {
            this.esconderModal();
        }
    },

    verificar() {
        if (typeof adminLogado !== 'undefined' && adminLogado) return;
        if (Date.now() - this.ultimaAtividade >= TEMPO_INATIVIDADE) {
            this.entrarModoInativo();
        }
    },

    entrarModoInativo() {
        if (!this.online) return;

        console.log('🔴 Modo inativo ativado');
        try {
            if (window.firebase && firebase.database) {
                firebase.database().goOffline();
                this.online = false;
            }
        } catch (e) {
            console.error('Erro ao desconectar:', e);
        }

        this.mostrarModal();
    },

    mostrarModal() {
        if (this.modalAberto) return;

        let modal = document.getElementById('modalInatividade');

        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'modalInatividade';
            modal.className = 'modal-inatividade-overlay';
            modal.setAttribute('aria-hidden', 'true');
            modal.innerHTML = `
                <div class="modal-inatividade-box">
                    <div class="modal-inatividade-icone">😴</div>
                    <h2 class="modal-inatividade-titulo">Estamos te esperando!</h2>
                    <p class="modal-inatividade-texto">Tem coisa boa no cardápio...</p>
                    <button class="modal-inatividade-btn" id="btnContinuar">
                        <i class="fas fa-utensils"></i> VOLTAR AO CARDÁPIO
                    </button>
                </div>
            `;
            document.body.appendChild(modal);

            modal.addEventListener('click', (e) => {
                if (e.target === modal) this.reset();
            });
        }

        const btn = modal.querySelector('#btnContinuar');
        if (btn) btn.onclick = () => this.reset();

        modal.style.display = 'flex';
        requestAnimationFrame(() => {
            modal.classList.add('ativo');
            this.modalAberto = true;
        });
    },

    esconderModal() {
        const modal = document.getElementById('modalInatividade');
        if (modal) {
            modal.classList.remove('ativo');
            this.modalAberto = false;
            setTimeout(() => {
                if (!this.modalAberto) {
                    modal.style.display = 'none';
                }
            }, 300);
        }
    },

    tratarVisibilidade() {
        if (document.hidden) return;

        if (Date.now() - this.ultimaAtividade >= TEMPO_INATIVIDADE && 
            !(typeof adminLogado !== 'undefined' && adminLogado)) {
            this.entrarModoInativo();
        } else {
            this.ultimaAtividade = Date.now();
            this.reset();
        }
    },

    destruir() {
        if (this.intervaloId) {
            clearInterval(this.intervaloId);
            this.intervaloId = null;
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    inactivityManager.iniciar();
});


// ===== EXPORT =====
window.salvarProdutosFirebase = salvarProdutosFirebase;
window.salvarCategoriasFirebase = salvarCategoriasFirebase;
window.salvarAdicionaisFirebase = salvarAdicionaisFirebase;
window.salvarConfigFirebase = salvarConfigFirebase;
window.salvarPedidoFirebase = salvarPedidoFirebase;
window.salvarCategoriasVisiveisFirebase = salvarCategoriasVisiveisFirebase;
window.salvarMontagensFirebase = salvarMontagensFirebase;
window.salvarHorariosFirebase = salvarHorariosFirebase;
window.salvarFeriadosFirebase = salvarFeriadosFirebase;
window.salvarCuponsFirebase = salvarCuponsFirebase;
window.carregarDadosFirebase = carregarDadosFirebase;
window.dbRef = dbRef;
window.database = database;
window.inactivityManager = inactivityManager;

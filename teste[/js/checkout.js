// ============================================
// ===== FUNÇÕES DE CHECKOUT =================
// ============================================

// ============================================
// ===== ABRIR/FECHAR CHECKOUT ===============
// ============================================

function abrirCheckout() {
    if (carrinho.length === 0) {
        mostrarToast('Adicione itens ao carrinho primeiro!', 'alerta');
        return;
    }
    
    // 🆕 Verifica horário antes de abrir checkout
    const statusLoja = verificarStatusLoja();
    if (!statusLoja.aberto) {
        const mensagem = statusLoja.motivo === 'feriado' ? 
            'Restaurante fechado hoje (feriado)!' : 
            statusLoja.motivo === 'fechado' ?
            'Restaurante fechado no momento!' :
            'Restaurante fora do horário de funcionamento!';
        mostrarToast(mensagem, 'alerta');
        return;
    }
    
    // 🆕 Verifica se todos os itens do carrinho estão disponíveis
    const agora = new Date();
    const itensIndisponiveis = [];
    
    carrinho.forEach(item => {
        const produto = produtos.find(p => p.id === item.produtoId);
        if (produto) {
            if (!isCategoriaDisponivel(produto.categoria, agora)) {
                itensIndisponiveis.push(item.nome);
            }
        }
    });
    
    if (itensIndisponiveis.length > 0) {
        mostrarToast(
            'Itens indisponíveis', 
            `Os seguintes itens não estão disponíveis neste horário: ${itensIndisponiveis.join(', ')}. Remova-os para continuar.`,
            'alerta'
        );
        return;
    }
    
    carregarEnderecosLocalStorage();
    
    const total = carrinho.reduce((sum, item) => sum + (item.precoUnitario * item.quantidade), 0);
    
    document.getElementById('checkoutSubtotal').innerHTML = formatarPreco(total);
    document.getElementById('checkoutTotal').innerHTML = formatarPreco(total);
    document.getElementById('checkoutFreteValor').innerHTML = formatarPreco(0);
    
    document.getElementById('checkoutNome').value = '';
    document.getElementById('checkoutTelefone').value = '';
    document.getElementById('checkoutCep').value = '';
    document.getElementById('checkoutBairro').value = '';
    document.getElementById('checkoutCidade').value = '';
    document.getElementById('checkoutRua').value = '';
    document.getElementById('checkoutNumero').value = '';
    document.getElementById('checkoutComplemento').value = '';
    document.getElementById('checkoutTroco').value = '';
    
    document.getElementById('checkoutFrete').value = '';
    document.getElementById('checkoutFrete').dataset.valor = '0';
    
    carregarDadosCliente();
    
    document.getElementById('modalCheckout').style.display = 'flex';
}

function fecharModalCheckout() {
    document.getElementById('modalCheckout').style.display = 'none';
}

// ============================================
// ===== TOGGLE CAMPOS =======================
// ============================================

function toggleCamposEntrega() {
    const tipo = document.getElementById('checkoutTipoEntrega').value;
    const campos = document.getElementById('camposEntrega');
    campos.style.display = tipo === 'entrega' ? 'block' : 'none';
    
    if (tipo === 'retirada') {
        document.getElementById('checkoutFrete').value = formatarPreco(0);
        document.getElementById('checkoutFrete').dataset.valor = '0';
        atualizarTotalCheckout(0);
    } else {
        const bairro = document.getElementById('checkoutBairro').value.trim();
        if (bairro) {
            buscarFretePorBairro(bairro, true);
        }
    }
}

function toggleCampoTroco() {
    const pagamento = document.getElementById('checkoutPagamento').value;
    document.getElementById('campoTroco').style.display = pagamento === 'dinheiro' ? 'block' : 'none';
}

// ============================================
// ===== FORMATAR CEP (MÁSCARA) ==============
// ============================================

function formatarCep(input) {
    let cep = input.value.replace(/\D/g, '');
    
    if (cep.length > 5) {
        cep = cep.substring(0, 5) + '-' + cep.substring(5, 8);
    }
    
    input.value = cep;
    
    if (cep.replace(/\D/g, '').length === 8) {
        setTimeout(() => {
            buscarCep();
        }, 300);
    }
}

// ============================================
// ===== ABRIR MODAL DE BUSCA ================
// ============================================

function abrirModalBuscaEndereco() {
    const modal = document.getElementById('modalBuscaEndereco');
    const cidadeUfSpan = document.getElementById('cidadeUfBusca');
    
    const cidade = configRestaurante.cidade || 'Conselheiro Lafaiete';
    const uf = configRestaurante.uf || 'MG';
    
    if (cidadeUfSpan) {
        cidadeUfSpan.textContent = `${cidade} - ${uf}`;
    }
    
    const resultadosDiv = document.getElementById('resultadosBuscaEndereco');
    if (resultadosDiv) {
        resultadosDiv.innerHTML = `
            <div style="text-align: center; padding: 30px; color: var(--cor-texto-claro);">
                <i class="fas fa-search" style="font-size: 2rem; opacity: 0.3; margin-bottom: 10px;"></i>
                <p>Digite o nome da rua e clique em BUSCAR</p>
            </div>
        `;
    }
    
    const inputBusca = document.getElementById('buscaEnderecoInput');
    if (inputBusca) {
        inputBusca.value = '';
    }
    
    if (modal) {
        modal.style.display = 'flex';
        
        setTimeout(() => {
            if (inputBusca) inputBusca.focus();
        }, 100);
    }
}

function fecharModalBuscaEndereco() {
    const modal = document.getElementById('modalBuscaEndereco');
    if (modal) {
        modal.style.display = 'none';
    }
}

// ============================================
// ===== BUSCAR ENDEREÇO AVANÇADO ============
// ============================================

async function buscarEnderecoAvancado() {
    const termo = document.getElementById('buscaEnderecoInput').value.trim();
    const resultadosDiv = document.getElementById('resultadosBuscaEndereco');
    
    const cidade = configRestaurante.cidade || 'Conselheiro Lafaiete';
    const uf = configRestaurante.uf || 'MG';

    if (!termo) {
        mostrarToast('Atenção', 'Digite o nome da rua', 'alerta');
        return;
    }

    resultadosDiv.innerHTML = `
        <div style="text-align:center; padding:20px;">
            <div class="loader"></div>
            <p style="margin-top:10px;">Buscando "${termo}" em ${cidade}/${uf}...</p>
        </div>
    `;

    try {
        const url = `https://viacep.com.br/ws/${uf}/${encodeURIComponent(cidade)}/${encodeURIComponent(termo)}/json/`;
        
        console.log('🔍 Buscando:', url);
        
        const response = await fetch(url);
        const data = await response.json();
        
        resultadosDiv.innerHTML = '';
        
        if (Array.isArray(data) && data.length > 0 && data[0] && !data[0].erro) {
            data.slice(0, 15).forEach(item => {
                const div = document.createElement('div');
                div.className = 'resultado-item';
                div.innerHTML = `
                    <div class="resultado-cep">📮 CEP: ${item.cep}</div>
                    <div class="resultado-endereco">
                        ${item.logradouro ? item.logradouro + ', ' : ''}
                        ${item.bairro ? item.bairro + ' - ' : ''}
                        ${item.localidade}/${item.uf}
                    </div>
                `;
                div.addEventListener('click', () => {
                    selecionarCepDaBusca(item);
                });
                resultadosDiv.appendChild(div);
            });
            
            mostrarToast('Sucesso', `Encontrados ${data.length} endereço(s)`, 'sucesso');
        } else {
            resultadosDiv.innerHTML = `
                <div style="text-align: center; padding: 20px; background: #fff3e0; border-radius: 10px;">
                    <p>🔍 Nenhum resultado para "<strong>${termo}</strong>"</p>
                    <p style="font-size: 0.85rem; margin-top: 10px;">📌 <strong>Dicas:</strong></p>
                    <ul style="text-align: left; font-size: 0.8rem; margin-top: 8px; padding-left: 20px;">
                        <li>• Digite apenas o nome da rua</li>
                        <li>• Tente o nome do bairro</li>
                        <li>• Digite um trecho do nome</li>
                    </ul>
                    <p style="margin-top: 15px; font-size: 0.8rem; color: var(--cor-primaria);">
                        🏙️ Buscando em: ${cidade} - ${uf}
                    </p>
                </div>
            `;
        }
        
    } catch (error) {
        console.error('Erro na busca:', error);
        resultadosDiv.innerHTML = `
            <div style="text-align: center; color: #f44336; padding: 20px;">
                ❌ Erro ao buscar. Verifique sua conexão.
            </div>
        `;
        mostrarToast('Erro', 'Falha ao buscar endereço', 'erro');
    }
}

function buscarEnderecoEnter(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        buscarEnderecoAvancado();
    }
}

// ============================================
// ===== SELECIONAR CEP DA BUSCA =============
// ============================================

function selecionarCepDaBusca(item) {
    document.getElementById('checkoutCep').value = item.cep;
    
    fecharModalBuscaEndereco();
    
    setTimeout(() => {
        buscarCep();
    }, 200);
    
    mostrarToast('Sucesso', 'CEP carregado!', 'sucesso');
}

// ============================================
// ===== BUSCAR CEP ==========================
// ============================================

function buscarCep() {
    const cepInput = document.getElementById('checkoutCep');
    const btnBuscar = document.querySelector('.btn-buscar-cep');
    const cep = cepInput.value.replace(/\D/g, '');
    
    if (cep.length !== 8) {
        abrirModalBuscaEndereco();
        return;
    }
    
    if (btnBuscar) {
        btnBuscar.classList.add('buscando');
        btnBuscar.innerHTML = '⏳';
    }
    
    if (configRestaurante.tipoFrete === 'fixo') {
        const frete = parseFloat(configRestaurante.freteFixo) || 0;
        document.getElementById('checkoutFrete').value = formatarPreco(frete);
        document.getElementById('checkoutFrete').dataset.valor = frete;
        atualizarTotalCheckout(frete);
    } else {
        document.getElementById('checkoutFrete').value = 'Buscando CEP...';
        document.getElementById('checkoutFrete').dataset.valor = '0';
    }
    
    fetch(`https://viacep.com.br/ws/${cep}/json/`)
        .then(response => response.json())
        .then(data => {
            if (!data.erro) {
                const cidadeConfigurada = configRestaurante.cidade || '';
                const cidadeCep = data.localidade || '';
                
                if (cidadeConfigurada && cidadeCep.toLowerCase() !== cidadeConfigurada.toLowerCase()) {
                    document.getElementById('checkoutRua').value = data.logradouro || '';
                    document.getElementById('checkoutBairro').value = data.bairro || '';
                    document.getElementById('checkoutCidade').value = cidadeCep;
                    
                    document.getElementById('checkoutFrete').value = 'Cidade não atendida';
                    document.getElementById('checkoutFrete').dataset.valor = '0';
                    atualizarTotalCheckout(0);
                    
                    mostrarToast(
                        '⚠️ Cidade não atendida', 
                        `Entregamos apenas em ${cidadeConfigurada}.`,
                        'alerta'
                    );
                    
                    if (btnBuscar) {
                        btnBuscar.classList.remove('buscando');
                        btnBuscar.innerHTML = '🔍';
                    }
                    return;
                }
                
                document.getElementById('checkoutRua').value = data.logradouro || '';
                document.getElementById('checkoutBairro').value = data.bairro || '';
                document.getElementById('checkoutCidade').value = cidadeCep;
                
                destacarCamposPreenchidos();
                
                if (configRestaurante.tipoFrete !== 'fixo' && data.bairro) {
                    buscarFretePorBairro(data.bairro, false);
                }
                
                mostrarToast('✅ CEP encontrado!', `${data.logradouro || 'Endereço'}, ${data.bairro || ''}`, 'sucesso');
            } else {
                mostrarToast('CEP não encontrado', 'Verifique o número digitado ou use a busca por rua', 'alerta');
                limparDestaqueCampos();
                
                if (configRestaurante.tipoFrete === 'fixo') {
                    const frete = parseFloat(configRestaurante.freteFixo) || 0;
                    document.getElementById('checkoutFrete').value = formatarPreco(frete);
                    document.getElementById('checkoutFrete').dataset.valor = frete;
                    atualizarTotalCheckout(frete);
                } else {
                    document.getElementById('checkoutFrete').value = 'CEP não encontrado';
                    document.getElementById('checkoutFrete').dataset.valor = '0';
                    atualizarTotalCheckout(0);
                }
            }
        })
        .catch(error => {
            console.error('Erro ao buscar CEP:', error);
            mostrarToast('Erro na busca', 'Tente novamente mais tarde', 'erro');
            
            if (configRestaurante.tipoFrete === 'fixo') {
                const frete = parseFloat(configRestaurante.freteFixo) || 0;
                document.getElementById('checkoutFrete').value = formatarPreco(frete);
                document.getElementById('checkoutFrete').dataset.valor = frete;
                atualizarTotalCheckout(frete);
            } else {
                document.getElementById('checkoutFrete').value = 'Erro na busca';
                document.getElementById('checkoutFrete').dataset.valor = '0';
                atualizarTotalCheckout(0);
            }
        })
        .finally(() => {
            if (btnBuscar) {
                btnBuscar.classList.remove('buscando');
                btnBuscar.innerHTML = '🔍';
            }
        });
}

// ============================================
// ===== BUSCAR CEP SILENCIOSO ===============
// ============================================

function buscarCepSilencioso() {
    const cepInput = document.getElementById('checkoutCep').value;
    if (!cepInput) return;

    const cep = cepInput.replace(/\D/g, '');
    if (cep.length !== 8) return;

    fetch(`https://viacep.com.br/ws/${cep}/json/`)
        .then(response => response.json())
        .then(data => {
            if (!data.erro) {
                const cidadeConfigurada = configRestaurante.cidade || '';
                const cidadeCep = data.localidade || '';
                
                if (cidadeConfigurada && cidadeCep.toLowerCase() !== cidadeConfigurada.toLowerCase()) {
                    if (!document.getElementById('checkoutRua').value) {
                        document.getElementById('checkoutRua').value = data.logradouro || '';
                    }
                    if (!document.getElementById('checkoutBairro').value) {
                        document.getElementById('checkoutBairro').value = data.bairro || '';
                    }
                    if (!document.getElementById('checkoutCidade').value) {
                        document.getElementById('checkoutCidade').value = cidadeCep;
                    }
                    document.getElementById('checkoutFrete').value = 'Cidade não atendida';
                    document.getElementById('checkoutFrete').dataset.valor = '0';
                    atualizarTotalCheckout(0);
                    return;
                }
                
                if (!document.getElementById('checkoutRua').value) {
                    document.getElementById('checkoutRua').value = data.logradouro || '';
                }
                if (!document.getElementById('checkoutBairro').value) {
                    document.getElementById('checkoutBairro').value = data.bairro || '';
                }
                if (!document.getElementById('checkoutCidade').value) {
                    document.getElementById('checkoutCidade').value = cidadeCep;
                }

                if (configRestaurante.tipoFrete !== 'fixo' && data.bairro) {
                    buscarFretePorBairro(data.bairro, true);
                }
            }
        })
        .catch(error => {
            console.log('⚠️ Busca silenciosa de CEP falhou:', error);
        });
}

// ============================================
// ===== DESTACAR CAMPOS PREENCHIDOS =========
// ============================================

function destacarCamposPreenchidos() {
    const campos = ['checkoutRua', 'checkoutBairro', 'checkoutCidade'];
    
    campos.forEach(id => {
        const campo = document.getElementById(id);
        if (campo && campo.value) {
            campo.style.backgroundColor = '#e8f5e9';
            campo.style.borderColor = '#2ecc71';
            campo.style.transition = 'all 0.3s ease';
            
            setTimeout(() => {
                campo.style.backgroundColor = '';
                campo.style.borderColor = '';
            }, 3000);
        }
    });
}

function limparDestaqueCampos() {
    const campos = ['checkoutRua', 'checkoutBairro', 'checkoutCidade'];
    
    campos.forEach(id => {
        const campo = document.getElementById(id);
        if (campo) {
            campo.style.backgroundColor = '#ffebee';
            campo.style.borderColor = '#e74c3c';
            
            setTimeout(() => {
                campo.style.backgroundColor = '';
                campo.style.borderColor = '';
            }, 2000);
        }
    });
}

// ============================================
// ===== BUSCAR FRETE POR BAIRRO =============
// ============================================

function buscarFretePorBairro(nomeBairro, silencioso = false) {
    const cidadeCep = document.getElementById('checkoutCidade').value.trim();
    const cidadeConfigurada = configRestaurante.cidade || '';
    
    if (cidadeConfigurada && cidadeCep.toLowerCase() !== cidadeConfigurada.toLowerCase()) {
        document.getElementById('checkoutFrete').value = 'Cidade não atendida';
        document.getElementById('checkoutFrete').dataset.valor = '0';
        atualizarTotalCheckout(0);
        return;
    }
    
    if (configRestaurante.tipoFrete === 'fixo') {
        const frete = parseFloat(configRestaurante.freteFixo) || 0;
        document.getElementById('checkoutFrete').value = formatarPreco(frete);
        document.getElementById('checkoutFrete').dataset.valor = frete;
        atualizarTotalCheckout(frete);
        return;
    }

    if (!nomeBairro) {
        document.getElementById('checkoutFrete').value = 'Digite o CEP';
        document.getElementById('checkoutFrete').dataset.valor = '0';
        atualizarTotalCheckout(0);
        return;
    }

    const caminhoFirebase = `restaurantes/${RESTAURANTE_ID}/atendimento`;
    
    database.ref(caminhoFirebase).once('value', snapshot => {
        const atendimento = snapshot.val();
        
        if (!atendimento) {
            document.getElementById('checkoutFrete').value = 'Sem frete cadastrado';
            document.getElementById('checkoutFrete').dataset.valor = '0';
            atualizarTotalCheckout(0);
            return;
        }

        const bairroNormalizado = nomeBairro.toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '');
        
        let freteEncontrado = null;
        let bairroAtivo = false;
        
        for (const chave in atendimento) {
            const bairroInfo = atendimento[chave];
            const chaveNormalizada = chave.toLowerCase()
                .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                .replace(/\s+/g, '-')
                .replace(/[^a-z0-9-]/g, '');
            
            if (chaveNormalizada.includes(bairroNormalizado) || 
                bairroNormalizado.includes(chaveNormalizada) ||
                chave === nomeBairro) {
                
                if (bairroInfo.ativo === true) {
                    freteEncontrado = parseFloat(bairroInfo.frete) || 0;
                    bairroAtivo = true;
                    break;
                }
            }
        }

        if (freteEncontrado !== null && bairroAtivo) {
            document.getElementById('checkoutFrete').value = formatarPreco(freteEncontrado);
            document.getElementById('checkoutFrete').dataset.valor = freteEncontrado;
            atualizarTotalCheckout(freteEncontrado);
            if (!silencioso) {
                mostrarToast('✅ Bairro atendido!', `Frete: ${formatarPreco(freteEncontrado)}`, 'sucesso');
            }
        } else {
            document.getElementById('checkoutFrete').value = 'Não entrega';
            document.getElementById('checkoutFrete').dataset.valor = '0';
            atualizarTotalCheckout(0);
            if (!silencioso) {
                mostrarToast('Bairro não atendido', 'Infelizmente não entregamos neste bairro', 'alerta');
            }
        }
    }).catch(error => {
        console.error('Erro ao buscar frete:', error);
        document.getElementById('checkoutFrete').value = 'Erro de conexão';
        document.getElementById('checkoutFrete').dataset.valor = '0';
        atualizarTotalCheckout(0);
    });
}

// ============================================
// ===== ATUALIZAR TOTAL =====================
// ============================================

function atualizarTotalCheckout(freteCentavos) {
    const subtotalText = document.getElementById('checkoutSubtotal').innerText;
    const subtotalReais = parseFloat(subtotalText.replace('R$', '').replace('.', '').replace(',', '.')) || 0;
    
    const freteReais = (parseFloat(freteCentavos) || 0) / 100;
    const totalReais = subtotalReais + freteReais;
    
    document.getElementById('checkoutTotal').innerHTML = formatarPreco(Math.round(totalReais * 100));
    document.getElementById('checkoutFreteValor').innerHTML = formatarPreco(freteCentavos);
}

// ============================================
// ===== SALVAR ENDEREÇO =====================
// ============================================

function salvarEndereco() {
    const nome = document.getElementById('checkoutNome').value.trim();
    if (!nome) {
        mostrarToast('Campo obrigatório', 'Digite o nome do cliente', 'alerta');
        return;
    }

    const telefone = document.getElementById('checkoutTelefone').value.trim();
    const cep = document.getElementById('checkoutCep').value.trim();
    const cidade = document.getElementById('checkoutCidade').value.trim();
    const rua = document.getElementById('checkoutRua').value.trim();
    const numero = document.getElementById('checkoutNumero').value.trim();
    const bairro = document.getElementById('checkoutBairro').value.trim();
    const complemento = document.getElementById('checkoutComplemento').value.trim();

    if (!telefone) {
        mostrarToast('Campo obrigatório', 'Digite o telefone para contato!', 'alerta');
        return;
    }

    if (!rua || !numero || !bairro) {
        mostrarToast('Campos obrigatórios', 'Preencha rua, número e bairro!', 'alerta');
        return;
    }

    const novoEndereco = {
        telefone: telefone,
        cep: cep,
        cidade: cidade,
        rua: rua,
        numero: numero,
        complemento: complemento,
        bairro: bairro
    };

    let enderecosSalvos = localStorage.getItem('enderecos_' + RESTAURANTE_ID);
    let enderecosClientes = {};
    
    if (enderecosSalvos) {
        try {
            enderecosClientes = JSON.parse(enderecosSalvos) || {};
        } catch (e) {
            enderecosClientes = {};
        }
    }

    if (!enderecosClientes[nome]) {
        enderecosClientes[nome] = [];
    }

    const enderecoExistente = enderecosClientes[nome].find(e => 
        e.rua.toLowerCase() === novoEndereco.rua.toLowerCase() && 
        e.numero === novoEndereco.numero
    );

    if (enderecoExistente) {
        const index = enderecosClientes[nome].findIndex(e => 
            e.rua.toLowerCase() === novoEndereco.rua.toLowerCase() && 
            e.numero === novoEndereco.numero
        );
        enderecosClientes[nome][index] = novoEndereco;
        mostrarToast('Endereço atualizado!', 'O endereço foi atualizado com sucesso', 'sucesso');
    } else {
        enderecosClientes[nome].push(novoEndereco);
        mostrarToast('Endereço salvo!', 'Novo endereço adicionado à sua lista', 'sucesso');
    }

    localStorage.setItem('enderecos_' + RESTAURANTE_ID, JSON.stringify(enderecosClientes));
    localStorage.setItem('ultimoEndereco_' + RESTAURANTE_ID, JSON.stringify(novoEndereco));
    localStorage.setItem('ultimoNomeCliente_' + RESTAURANTE_ID, nome);
    localStorage.setItem('ultimoTelefone_' + RESTAURANTE_ID, telefone);

    window.enderecosClientes = enderecosClientes;
}

// ============================================
// ===== CARREGAR ENDEREÇOS LOCALSTORAGE =====
// ============================================

function carregarEnderecosLocalStorage() {
    const enderecosSalvos = localStorage.getItem('enderecos_' + RESTAURANTE_ID);
    if (enderecosSalvos) {
        try {
            window.enderecosClientes = JSON.parse(enderecosSalvos) || {};
        } catch (e) {
            window.enderecosClientes = {};
        }
    } else {
        window.enderecosClientes = {};
    }
}

// ============================================
// ===== CARREGAR DADOS DO CLIENTE ===========
// ============================================

function carregarDadosCliente() {
    const nomeSalvo = localStorage.getItem('ultimoNomeCliente_' + RESTAURANTE_ID);
    if (nomeSalvo) {
        document.getElementById('checkoutNome').value = nomeSalvo;
    }

    const telefoneSalvo = localStorage.getItem('ultimoTelefone_' + RESTAURANTE_ID);
    if (telefoneSalvo) {
        document.getElementById('checkoutTelefone').value = telefoneSalvo;
    }

    const enderecoSalvo = localStorage.getItem('ultimoEndereco_' + RESTAURANTE_ID);
    if (enderecoSalvo) {
        try {
            const endereco = JSON.parse(enderecoSalvo);

            document.getElementById('checkoutCep').value = endereco.cep || '';
            document.getElementById('checkoutCidade').value = endereco.cidade || '';
            document.getElementById('checkoutRua').value = endereco.rua || '';
            document.getElementById('checkoutNumero').value = endereco.numero || '';
            document.getElementById('checkoutComplemento').value = endereco.complemento || '';
            document.getElementById('checkoutBairro').value = endereco.bairro || '';

            if (configRestaurante.tipoFrete !== 'fixo' && endereco.bairro) {
                setTimeout(() => {
                    buscarFretePorBairro(endereco.bairro, true);
                }, 500);
            }

            if (endereco.cep) {
                const cepLimpo = endereco.cep.replace(/\D/g, '');
                if (cepLimpo.length === 8) {
                    setTimeout(() => {
                        buscarCepSilencioso();
                    }, 800);
                }
            }
        } catch (e) {
            console.error('Erro ao carregar endereço:', e);
        }
    }
}

// ============================================
// ===== CONFIRMAR PEDIDO ====================
// ============================================

async function confirmarPedido() {
    // 🆕 Verificação final de horário
    const statusLoja = verificarStatusLoja();
    if (!statusLoja.aberto) {
        mostrarToast('Restaurante fechado!', 'Não é possível finalizar o pedido no momento.', 'erro');
        return;
    }
    
    const nome = document.getElementById('checkoutNome').value.trim();
    const telefone = document.getElementById('checkoutTelefone').value.trim();
    
    if (!nome || !telefone) {
        mostrarToast('Preencha nome e telefone!', 'alerta');
        return;
    }
    
    const tipoEntrega = document.getElementById('checkoutTipoEntrega').value;
    let endereco = null;
    
    if (tipoEntrega === 'entrega') {
        const bairro = document.getElementById('checkoutBairro').value.trim();
        const rua = document.getElementById('checkoutRua').value.trim();
        const numero = document.getElementById('checkoutNumero').value.trim();
        
        if (!bairro || !rua || !numero) {
            mostrarToast('Preencha o endereço completo!', 'alerta');
            return;
        }
        
        const freteValor = document.getElementById('checkoutFrete').dataset.valor;
        const freteTexto = document.getElementById('checkoutFrete').value;
        
        if (freteTexto === 'Cidade não atendida') {
            mostrarToast('Cidade não atendida', `Entregamos apenas em ${configRestaurante.cidade}`, 'erro');
            return;
        }
        
        if ((freteValor === '0' || freteTexto === 'Erro de conexão' || freteTexto === 'Não entrega') && 
            configRestaurante.tipoFrete !== 'fixo') {
            mostrarToast('Bairro não atendido', 'Infelizmente não entregamos neste bairro', 'erro');
            return;
        }
        
        endereco = {
            cep: document.getElementById('checkoutCep').value.replace(/\D/g, ''),
            rua: rua,
            numero: numero,
            bairro: bairro,
            cidade: document.getElementById('checkoutCidade').value,
            complemento: document.getElementById('checkoutComplemento').value,
            geo: {
                lat: null,
                lng: null
            }
        };
    }
    
    const pagamento = document.getElementById('checkoutPagamento').value;
    const troco = pagamento === 'dinheiro' 
        ? floatParaCentavos(parseFloat(document.getElementById('checkoutTroco').value) || 0)
        : null;
    
    const itens = carrinho.map(item => {
        const precoUnitarioCentavos = floatParaCentavos(item.precoUnitario);
        const totalItemCentavos = precoUnitarioCentavos * item.quantidade;
        
        const itemBase = {
            itemId: item.id,
            tipo: item.tipo || 'produto',
            quantidade: item.quantidade,
            precoUnitario: precoUnitarioCentavos,
            totalItem: totalItemCentavos
        };
        
        if (item.tipo === 'montagem') {
            itemBase.refs = {
                produtoId: item.produtoId,
                tamanhoId: item.montagemDetalhes?.tamanho?.id || null,
                componentes: item.montagemDetalhes?.itens?.map(i => ({
                    grupoId: i.grupoId,
                    itemId: i.itemId
                })) || []
            };
            
            itemBase.snapshot = {
                nome: item.nome,
                categoria: montagens.find(m => m.id === item.produtoId)?.categoria || '',
                precoBase: floatParaCentavos(
                    montagens.find(m => m.id === item.produtoId)?.precoBase || 0
                ),
                tamanho: item.montagemDetalhes?.tamanho ? {
                    id: item.montagemDetalhes.tamanho.id,
                    nome: item.montagemDetalhes.tamanho.nome,
                    preco: floatParaCentavos(item.montagemDetalhes.tamanho.preco || 0)
                } : null,
                grupos: montagens.find(m => m.id === item.produtoId)?.grupos?.map(grupo => {
                    const itensDoGrupo = item.montagemDetalhes?.itens
                        ?.filter(i => i.grupoId === grupo.id)
                        ?.map(i => {
                            const itemOriginal = grupo.itens.find(gi => gi.id === i.itemId);
                            return {
                                id: i.itemId,
                                nome: itemOriginal?.nome || i.nome,
                                preco: floatParaCentavos(itemOriginal?.preco || i.preco || 0)
                            };
                        }) || [];
                    
                    return {
                        nome: grupo.nome,
                        itens: itensDoGrupo
                    };
                }).filter(g => g.itens.length > 0) || [],
                observacao: item.observacao || ''
            };
        } else if (item.sabores && item.sabores.length > 0) {
            const produtoBase = produtos.find(p => p.id === item.produtoId);
            
            itemBase.refs = {
                produtoId: item.produtoId,
                saboresIds: item.sabores.map(s => s.id)
            };
            
            itemBase.snapshot = {
                nome: item.nome,
                categoria: produtoBase?.categoria || 'pizza',
                precoBase: floatParaCentavos(produtoBase?.preco || 0),
                sabores: item.sabores.map(s => ({
                    id: s.id,
                    nome: s.nome,
                    preco: floatParaCentavos(s.preco)
                })),
                adicionais: item.adicionais?.map(a => ({
                    nome: a.nome,
                    preco: floatParaCentavos(a.preco)
                })) || [],
                observacao: item.observacao || ''
            };
        } else {
            const produtoBase = produtos.find(p => p.id === item.produtoId);
            
            itemBase.refs = {
                produtoId: item.produtoId
            };
            
            itemBase.snapshot = {
                nome: item.nome,
                categoria: produtoBase?.categoria || '',
                precoBase: floatParaCentavos(produtoBase?.preco || 0),
                adicionais: item.adicionais?.map(a => ({
                    nome: a.nome,
                    preco: floatParaCentavos(a.preco)
                })) || [],
                observacao: item.observacao || ''
            };
        }
        
        return itemBase;
    });
    
    const subtotalCentavos = itens.reduce((sum, item) => sum + item.totalItem, 0);
    const freteCentavos = floatParaCentavos(parseFloat(document.getElementById('checkoutFrete').dataset.valor) || 0);
    const totalCentavos = subtotalCentavos + freteCentavos;
    
    const pedido = {
        id: 'ped_' + gerarId(),
        numero: null,
        criadoEm: firebase.database.ServerValue.TIMESTAMP,
        atualizadoEm: firebase.database.ServerValue.TIMESTAMP,
        
        status: 'novo',
        statusHistorico: [{
            status: 'novo',
            em: firebase.database.ServerValue.TIMESTAMP,
            por: 'sistema'
        }],
        
        cliente: {
            nome: nome,
            telefone: telefone
        },
        
        tipoEntrega: tipoEntrega,
        endereco: endereco,
        
        pagamento: {
            tipo: pagamento,
            trocoPara: troco
        },
        
        subtotal: subtotalCentavos,
        frete: freteCentavos,
        total: totalCentavos,
        
        observacaoGeral: document.getElementById('observacaoGeral')?.value || '',
        
        meta: {
            origem: 'web',
            versao: '2.0.0'
        },
        
        itens: itens
    };
    
    mostrarLoader(true);
    
    const sucesso = await salvarPedidoFirebase(pedido);
    
    if (sucesso) {
        if (tipoEntrega === 'entrega') {
            salvarEndereco();
        }
        
        const numeroPedido = pedido.numero;
        mostrarToast(`✅ Pedido #${numeroPedido} realizado!`, 'Seu pedido foi enviado para o restaurante', 'sucesso');
        
        carrinho = [];
        renderizarCarrinho();
        document.getElementById('observacaoGeral').value = '';
        fecharModalCheckout();
    }
    
    mostrarLoader(false);
}

// ===== EXPOR =====
window.abrirCheckout = abrirCheckout;
window.fecharModalCheckout = fecharModalCheckout;
window.toggleCamposEntrega = toggleCamposEntrega;
window.toggleCampoTroco = toggleCampoTroco;
window.formatarCep = formatarCep;
window.buscarCep = buscarCep;
window.abrirModalBuscaEndereco = abrirModalBuscaEndereco;
window.fecharModalBuscaEndereco = fecharModalBuscaEndereco;
window.buscarEnderecoAvancado = buscarEnderecoAvancado;
window.buscarEnderecoEnter = buscarEnderecoEnter;
window.selecionarCepDaBusca = selecionarCepDaBusca;
window.buscarFretePorBairro = buscarFretePorBairro;
window.salvarEndereco = salvarEndereco;
window.confirmarPedido = confirmarPedido;

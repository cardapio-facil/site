// ============================================
// ===== PAINEL APP - LÓGICA PRINCIPAL ========
// ============================================

let pedidosAtuais = [];
let filtroStatus = 'novo';
let nivelAcesso = null; // 'master' ou 'view'
let cronometroInterval = null;
let ouvindoPedidos = false;

// ============================================
// ===== INICIALIZAÇÃO ========================
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
    // Configura data no header
    document.getElementById('dataAtual').textContent = new Date().toLocaleDateString('pt-BR', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

    // Exibe modal de login
    document.getElementById('modalLogin').style.display = 'flex';
    verificarSenhaSalva();
});

// ============================================
// ===== LOGIN =================================
// ============================================

function verificarSenhaSalva() {
    const senhaSalva = localStorage.getItem('painel_senha');
    const lembrar = localStorage.getItem('painel_lembrar') === 'true';
    if (lembrar && senhaSalva) {
        document.getElementById('senhaInput').value = senhaSalva;
        document.getElementById('lembrarCheck').checked = true;
        document.getElementById('senhaInput').focus();
    } else {
        document.getElementById('senhaInput').focus();
    }
}

function toggleOlho() {
    const input = document.getElementById('senhaInput');
    const btn = document.getElementById('btnOlho');
    const icone = btn.querySelector('i');
    if (input.type === 'password') {
        input.type = 'text';
        icone.classList.remove('fa-eye-slash');
        icone.classList.add('fa-eye');
        btn.title = 'Ocultar senha';
    } else {
        input.type = 'password';
        icone.classList.remove('fa-eye');
        icone.classList.add('fa-eye-slash');
        btn.title = 'Mostrar senha';
    }
}

async function verificarSenha() {
    const senha = document.getElementById('senhaInput').value;
    const lembrar = document.getElementById('lembrarCheck').checked;

    // Primeiro carrega dados do Firebase para obter senhas atualizadas
    await carregarDadosPainel();

    if (senha === CONFIG_PAINEL.senhaMasterPadrao) {
        nivelAcesso = 'master';
    } else if (senha === CONFIG_PAINEL.senhaViewPadrao) {
        nivelAcesso = 'view';
    } else {
        alert('Senha incorreta!');
        document.getElementById('senhaInput').value = '';
        document.getElementById('senhaInput').focus();
        return;
    }

    if (lembrar) {
        localStorage.setItem('painel_senha', senha);
        localStorage.setItem('painel_lembrar', 'true');
    } else {
        localStorage.removeItem('painel_senha');
        localStorage.setItem('painel_lembrar', 'false');
    }

    document.getElementById('modalLogin').style.display = 'none';
    inicializarPainel();
}

// ============================================
// ===== INICIAR PAINEL =======================
// ============================================

async function inicializarPainel() {
    // Atualiza logo
    const logoImg = document.getElementById('logoPainel');
    if (logoImg) {
        logoImg.src = CONFIG_PAINEL.logoUrl;
    }

    // Atualiza nome do restaurante no título
    document.querySelector('.header h1').textContent = `📊 Painel - ${CONFIG_PAINEL.nomeRestaurante}`;

    // Configura sidebar baseado no nível de acesso
    configurarSidebar();

    // Inicia escuta de pedidos em tempo real
    ouvirPedidosPainel((pedidos) => {
        pedidosAtuais = pedidos;
        atualizarContadores();
        renderizarPedidos();
    });

    // Inicia cronômetro global
    iniciarCronometro();

    ouvindoPedidos = true;
}

// ============================================
// ===== CONFIGURAR SIDEBAR ===================
// ============================================

function configurarSidebar() {
    const menu = document.querySelector('.sidebar-menu');
    menu.innerHTML = '';

    // Itens que todos logados veem (WhatsApp, por exemplo)
    const itens = [
        { classe: 'wpp', icone: 'fab fa-whatsapp', texto: 'WhatsApp', onclick: 'abrirWhatsApp()' },
    ];

    // Apenas master vê relatórios, bairros e mensagens
    if (nivelAcesso === 'master') {
        itens.push({ classe: 'entregador', icone: 'fas fa-chart-bar', texto: 'Relatórios', onclick: 'abrirRelatorio()' });
        itens.push({ classe: 'delivery', icone: 'fas fa-map-marker-alt', texto: 'Bairros', onclick: 'abrirBairro()' });
        itens.push({ classe: 'config', icone: 'fas fa-envelope', texto: 'Mensagens', onclick: 'abrirConfigMensagens()' });
    }

    itens.forEach(item => {
        const div = document.createElement('div');
        div.className = `sidebar-item ${item.classe}`;
        div.setAttribute('onclick', item.onclick);
        div.innerHTML = `<i class="${item.icone}"></i> ${item.texto}`;
        menu.appendChild(div);
    });
}

// ============================================
// ===== SIDEBAR TOGGLE =======================
// ============================================

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    const main = document.getElementById('mainContent');
    const isOpen = sidebar.classList.toggle('open');
    overlay.classList.toggle('active', isOpen);
    main.classList.toggle('shifted', isOpen);
}

// ============================================
// ===== ATUALIZAR CONTADORES =================
// ============================================

function atualizarContadores() {
    const contagem = { novo: 0, confirmado: 0, preparando: 0, saiu_entrega: 0, entregue: 0, cancelado: 0 };
    pedidosAtuais.forEach(p => {
        if (contagem.hasOwnProperty(p.status)) contagem[p.status]++;
    });

    document.getElementById('totalNovos').textContent = contagem.novo;
    document.getElementById('totalPreparando').textContent = contagem.preparando;
    document.getElementById('totalSaiu').textContent = contagem.saiu_entrega;
    document.getElementById('totalEntregue').textContent = contagem.entregue;
    document.getElementById('totalCancelado').textContent = contagem.cancelado;
}

// ============================================
// ===== RENDERIZAR PEDIDOS ===================
// ============================================

function renderizarPedidos() {
    const grid = document.getElementById('pedidosGrid');
    grid.innerHTML = '';

    const pedidosFiltrados = filtroStatus === 'todos'
        ? pedidosAtuais
        : pedidosAtuais.filter(p => p.status === filtroStatus);

    if (pedidosFiltrados.length === 0) {
        grid.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:40px; color:#aaa;">Nenhum pedido neste status</div>`;
        return;
    }

    pedidosFiltrados.forEach(pedido => {
        const card = criarCardPedido(pedido);
        grid.appendChild(card);
    });
}

function criarCardPedido(pedido) {
    const card = document.createElement('div');
    card.className = `pedido-card ${getStatusClass(pedido.status)}`;
    card.setAttribute('data-id', pedido.id);

    // Seta esquerda (voltar status)
    const idx = CONFIG_PAINEL.fluxoStatus.indexOf(pedido.status);
    if (idx > 0 && pedido.status !== 'cancelado') {
        const setaEsq = criarSeta('esquerda', CONFIG_PAINEL.fluxoStatus[idx - 1], pedido.id);
        card.appendChild(setaEsq);
    }

    // Conteúdo central
    const conteudo = document.createElement('div');
    conteudo.className = 'card-conteudo';
    conteudo.style.display = 'flex';
    conteudo.style.flexDirection = 'column';

    const itensCount = pedido.itens ? pedido.itens.length : 0;
    const tipoEntregaTexto = pedido.tipoEntrega === 'entrega' ? 'Entrega' : 'Retirada';
    const enderecoTexto = pedido.endereco
        ? `${pedido.endereco.rua || ''}, ${pedido.endereco.numero || ''} - ${pedido.endereco.bairro || ''}`
        : 'Retirada no local';

    // Informações do card (sem o valor total, que vai no rodapé)
    conteudo.innerHTML = `
        <div class="card-header">
            <span class="pedido-numero">#${pedido.numero || '---'}</span>
            <span class="pedido-status-badge ${getBadgeClass(pedido.status)}">${getStatusLabel(pedido.status)}</span>
        </div>
        <div class="pedido-cliente">
            <i class="fas fa-user"></i> ${pedido.cliente?.nome || '---'}
        </div>
        <div class="pedido-info">
            <i class="far fa-clock"></i> ${formatarHora(pedido.criadoEm)}
        </div>
        <div class="pedido-info">
            <i class="fas fa-utensils"></i> ${itensCount} ${itensCount === 1 ? 'item' : 'itens'} &nbsp;|&nbsp;
            <i class="fas ${pedido.tipoEntrega === 'entrega' ? 'fa-truck' : 'fa-store'}"></i> ${tipoEntregaTexto}
        </div>
        <div class="pedido-endereco">
            <i class="fas fa-map-marker-alt"></i> ${enderecoTexto}
        </div>
        ${pedido.status === 'preparando' ? `<div class="cronometro-card" id="cron-${pedido.id}"></div>` : ''}
    `;

    // ---- Rodapé com valor e botões ----
    const footer = document.createElement('div');
    footer.style.cssText = 'display:flex; justify-content:space-between; align-items:flex-end; margin-top:auto; padding-top:10px;';

    // Valor total
    const totalEl = document.createElement('div');
    totalEl.className = 'pedido-total';
    totalEl.textContent = formatarPrecoPainel(pedido.total);
    footer.appendChild(totalEl);

    // Botões
    const btnsDiv = document.createElement('div');
    btnsDiv.style.display = 'flex';
    btnsDiv.style.gap = '8px';

    // WhatsApp manual (exceto quando já é automático)
    const podeEnviarWpp = nivelAcesso !== null && pedido.cliente?.telefone;
    if (podeEnviarWpp && !['preparando', 'saiu_entrega'].includes(pedido.status)) {
        const btnWpp = document.createElement('button');
        btnWpp.className = 'btn-whatsapp-card';
        btnWpp.innerHTML = '<i class="fab fa-whatsapp"></i>';
        btnWpp.onclick = (e) => {
            e.stopPropagation();
            enviarWhatsAppManual(pedido);
        };
        btnsDiv.appendChild(btnWpp);
    }

    // Botão imprimir
    const btnImp = document.createElement('button');
    btnImp.className = 'btn-imprimir-card';
    btnImp.innerHTML = '<i class="fas fa-print"></i>';
    btnImp.onclick = (e) => {
        e.stopPropagation();
        imprimirPedidoPainel(pedido);
    };
    btnsDiv.appendChild(btnImp);

    footer.appendChild(btnsDiv);
    conteudo.appendChild(footer);

    card.appendChild(conteudo);

    // Seta direita (avançar status)
    if (idx >= 0 && idx < CONFIG_PAINEL.fluxoStatus.length - 1 && pedido.status !== 'cancelado') {
        const setaDir = criarSeta('direita', CONFIG_PAINEL.fluxoStatus[idx + 1], pedido.id);
        card.appendChild(setaDir);
    }

    // Evento de clique no card para abrir detalhes
    card.addEventListener('click', (e) => {
        // Ignora clique em setas e botões
        if (e.target.closest('.seta-status, .btn-imprimir-card, .btn-whatsapp-card')) return;
        abrirDetalhes(pedido);
    });

    return card;
}

function criarSeta(direcao, proximoStatus, pedidoId) {
    const seta = document.createElement('button');
    seta.className = `seta-status ${direcao}`;
    const tooltip = direcao === 'direita' ? `Mover para ${getStatusLabel(proximoStatus)}` : `Voltar para ${getStatusLabel(proximoStatus)}`;
    seta.setAttribute('data-tooltip', tooltip);
    seta.innerHTML = direcao === 'direita' ? '<i class="fas fa-chevron-right"></i>' : '<i class="fas fa-chevron-left"></i>';
    seta.onclick = async (e) => {
        e.stopPropagation();
        await mudarStatusPedido(pedidoId, proximoStatus);
    };
    return seta;
}

// ============================================
// ===== MUDAR STATUS =========================
// ============================================

async function mudarStatusPedido(pedidoId, novoStatus) {
   
    const pedido = pedidosAtuais.find(p => p.id === pedidoId);
    if (!pedido) return;

    const sucesso = await atualizarStatusPedidoPainel(pedidoId, novoStatus);
    if (sucesso) {
        // Dispara WhatsApp automático se configurado
        const configMensagem = CONFIG_PAINEL.mensagens[novoStatus];
        if (configMensagem && configMensagem.ativo && pedido.cliente?.telefone) {
            if (novoStatus === 'preparando') {
                enviarWhatsAppPreparando(pedido);
            } else if (novoStatus === 'saiu_entrega') {
                enviarWhatsAppSaiu(pedido);
            }
        }

        // Atualiza UI (a escuta do Firebase fará o resto)
        console.log(`Status do pedido ${pedidoId} alterado para ${novoStatus}`);
    } else {
        alert('Erro ao atualizar status. Tente novamente.');
    }
}

// ============================================
// ===== CRONÔMETRO ===========================
// ============================================

function iniciarCronometro() {
    if (cronometroInterval) clearInterval(cronometroInterval);
    cronometroInterval = setInterval(atualizarCronometros, CONFIG_PAINEL.intervaloCronometro * 60 * 1000);
    atualizarCronometros(); // executa imediatamente
}

function atualizarCronometros() {
    const agora = Date.now();
    pedidosAtuais.forEach(pedido => {
        if (pedido.status === 'preparando' && pedido.inicioPreparo) {
            const inicio = new Date(pedido.inicioPreparo).getTime();
            const minutos = Math.floor((agora - inicio) / 60000);
            const el = document.getElementById('cron-' + pedido.id);
            if (el) {
                el.textContent = `🕐 Preparando há ${formatarTempoPreparo(minutos)}`;
            }
        }
    });
}

// ============================================
// ===== FILTRAR POR STATUS ===================
// ============================================

function filtrarPorStatus(status, elemento) {
    filtroStatus = status;
    document.querySelectorAll('.status-box').forEach(box => box.classList.remove('ativo'));
    elemento.classList.add('ativo');
    renderizarPedidos();
}

// ============================================
// ===== ABRIR DETALHES =======================
// ============================================

function abrirDetalhes(pedido) {
    const modal = document.getElementById('modalDetalhes');
    const conteudo = document.getElementById('detalhesConteudo');

    let html = `
        <table>
            <tr><td>Número:</td><td><strong>#${pedido.numero || '---'}</strong></td></tr>
            <tr><td>Cliente:</td><td>${pedido.cliente?.nome || '---'}</td></tr>
            <tr><td>Telefone:</td><td>${pedido.cliente?.telefone || '---'}</td></tr>
            <tr><td>Data/Hora:</td><td>${formatarDataHora(pedido.criadoEm)}</td></tr>
    `;

    if (pedido.tipoEntrega === 'entrega' && pedido.endereco) {
        html += `<tr><td>Endereço:</td><td>${pedido.endereco.rua || ''}, ${pedido.endereco.numero || ''} - ${pedido.endereco.bairro || ''}</td></tr>`;
        if (pedido.endereco.complemento) html += `<tr><td>Complemento:</td><td>${pedido.endereco.complemento}</td></tr>`;
        if (pedido.endereco.referencia) html += `<tr><td>Referência:</td><td>${pedido.endereco.referencia}</td></tr>`;
    } else {
        html += `<tr><td>Retirada:</td><td>No local</td></tr>`;
    }

    html += `<tr><td>Pagamento:</td><td>${pedido.pagamento?.tipo || '---'}</td></tr>`;
    if (pedido.pagamento?.trocoPara) html += `<tr><td>Troco para:</td><td>${formatarPrecoPainel(pedido.pagamento.trocoPara)}</td></tr>`;
    html += `</table>`;

    // Cupom
    if (pedido.cupom) {
        html += `<p style="color:#4CAF50; margin:10px 0;">🎫 Cupom: ${pedido.cupom.codigo} (-${formatarPrecoPainel(pedido.cupom.descontoCentavos)})</p>`;
    }

    html += `<h3>📦 Itens do Pedido</h3>`;

    if (pedido.itens && pedido.itens.length > 0) {
        pedido.itens.forEach(item => {
            html += `<div class="item-detalhe">`;
            html += `<strong>${item.quantidade}x ${item.snapshot?.nome || 'Item'}</strong><br>`;
            
            // Montagem
            if (item.tipo === 'montagem' && item.snapshot) {
                if (item.snapshot.tamanho) html += `Tamanho: ${item.snapshot.tamanho.nome} ${item.snapshot.tamanho.preco > 0 ? '(+' + formatarPrecoPainel(item.snapshot.tamanho.preco) + ')' : ''}<br>`;
                if (item.snapshot.grupos) {
                    item.snapshot.grupos.forEach(grupo => {
                        if (grupo.itens.length > 0) {
                            html += `${grupo.nome}: ${grupo.itens.map(i => i.nome + (i.preco > 0 ? ' (+' + formatarPrecoPainel(i.preco) + ')' : '')).join(', ')}<br>`;
                        }
                    });
                }
            }
            
            // Pizza
            if (item.sabores || (item.snapshot && item.snapshot.sabores)) {
                const sabores = item.sabores || item.snapshot.sabores;
                if (sabores && sabores.length > 0) {
                    html += `Sabores: ${sabores.map(s => s.nome).join(' e ')}<br>`;
                }
            }
            
            // Adicionais
            if (item.adicionais || (item.snapshot && item.snapshot.adicionais)) {
                const adicionais = item.adicionais || item.snapshot.adicionais;
                if (adicionais && adicionais.length > 0) {
                    html += `Adicionais: ${adicionais.map(a => a.nome + (a.preco > 0 ? ' (+' + formatarPrecoPainel(a.preco) + ')' : '')).join(', ')}<br>`;
                }
            }
            
            if (item.snapshot?.observacao) html += `<em>Obs: ${item.snapshot.observacao}</em><br>`;
            html += `<strong>Subtotal: ${formatarPrecoPainel(item.totalItem || (item.precoUnitario * item.quantidade))}</strong>`;
            html += `</div>`;
        });
    } else {
        html += `<p style="color:#aaa;">Nenhum item detalhado</p>`;
    }

    // Totais
    html += `
        <div style="display:flex; justify-content:space-between; margin:15px 0; padding:15px; background:rgba(128,0,32,0.2); border-radius:10px;">
            <strong>Subtotal:</strong>
            <span>${formatarPrecoPainel(pedido.subtotal)}</span>
        </div>
    `;
    if (pedido.desconto) {
        html += `
        <div style="display:flex; justify-content:space-between; margin:15px 0; padding:15px; background:rgba(76,175,80,0.2); border-radius:10px;">
            <strong>Desconto:</strong>
            <span>-${formatarPrecoPainel(pedido.desconto)}</span>
        </div>`;
    }
    if (pedido.frete && pedido.frete > 0) {
        html += `
        <div style="display:flex; justify-content:space-between; margin:15px 0; padding:15px; background:rgba(128,0,32,0.2); border-radius:10px;">
            <strong>Taxa de Entrega:</strong>
            <span>${formatarPrecoPainel(pedido.frete)}</span>
        </div>`;
    }
    html += `
        <div style="display:flex; justify-content:space-between; padding:15px; background:#800020; color:#fff; border-radius:10px; font-weight:700;">
            <span>TOTAL GERAL:</span>
            <span>${formatarPrecoPainel(pedido.total)}</span>
        </div>
    `;

    conteudo.innerHTML = html;
    modal.classList.add('active');
}

function fecharDetalhes(event) {
    if (!event || event.target === document.getElementById('modalDetalhes')) {
        document.getElementById('modalDetalhes').classList.remove('active');
    }
}

// ============================================
// ===== IMPRIMIR PEDIDO ======================
// ============================================

function imprimirPedidoPainel(pedido) {
    const win = window.open('', '_blank');
    
    // Monta itens formatados
    let itensHtml = '';
    if (pedido.itens) {
        pedido.itens.forEach(item => {
            const nome = item.snapshot?.nome || 'Item';
            const preco = formatarPrecoPainel(item.totalItem || item.precoUnitario * item.quantidade);
            
            // Nome do item com quantidade e preço
            itensHtml += `<div class="item-linha"><span>${item.quantidade}x ${nome}</span><span>${preco}</span></div>`;
            
            // Observação do item (logo após o nome)
            if (item.snapshot?.observacao) {
                itensHtml += `<div class="item-obs">Obs: ${item.snapshot.observacao}</div>`;
            }
            
            // Detalhes de montagem (com fonte maior)
            if (item.tipo === 'montagem' && item.snapshot) {
                itensHtml += `<div style="font-size:20px; margin-left:15px; margin-top:8px;">`;
                if (item.snapshot.tamanho) {
                    itensHtml += `<div style="margin:4px 0;"><strong>Tamanho:</strong> ${item.snapshot.tamanho.nome}</div>`;
                }
                if (item.snapshot.grupos) {
                    item.snapshot.grupos.forEach(g => {
                        if (g.itens.length > 0) {
                            const itensTexto = g.itens.map(i => {
                                return i.nome + (i.preco > 0 ? ' (+' + formatarPrecoPainel(i.preco) + ')' : '');
                            }).join(', ');
                            itensHtml += `<div style="margin:4px 0;"><strong>${g.nome}:</strong> ${itensTexto}</div>`;
                        }
                    });
                }
                itensHtml += `</div>`;
            }
            
            // Sabores da pizza (formato com /)
            if (item.sabores && item.sabores.length > 0) {
                const saboresTexto = item.sabores.map(s => s.nome).join(' / ');
                itensHtml += `<div style="font-size:18px; margin-left:15px;">Sabores: ${saboresTexto}</div>`;
            }
            
            // Adicionais
            if (item.adicionais && item.adicionais.length > 0) {
                const adicionaisTexto = item.adicionais.map(a => {
                    return a.nome + (a.preco > 0 ? ' (+' + formatarPrecoPainel(a.preco) + ')' : '');
                }).join(', ');
                itensHtml += `<div style="font-size:18px; margin-left:15px;">Adicionais: ${adicionaisTexto}</div>`;
            }
            
            // Espaçamento entre itens
            itensHtml += `<div style="margin-bottom:15px;"></div>`;
        });
    }

    // Endereço completo
    let enderecoCompleto = 'Retirada no local';
    if (pedido.tipoEntrega === 'entrega' && pedido.endereco) {
        enderecoCompleto = `${pedido.endereco.rua || ''}, ${pedido.endereco.numero || ''} - ${pedido.endereco.bairro || ''}, ${pedido.endereco.cidade || ''}`;
    }

    // Complemento
    let complementoHtml = '';
    if (pedido.endereco?.complemento) {
        complementoHtml = `<div class="info-cliente"><strong>Complemento:</strong> ${pedido.endereco.complemento}</div>`;
    }

    // Referência
    let referenciaHtml = '';
    if (pedido.endereco?.referencia) {
        referenciaHtml = `<div class="info-cliente"><strong>Referência:</strong> ${pedido.endereco.referencia}</div>`;
    }

    // Observação geral
    let obsGeralHtml = '';
    if (pedido.observacaoGeral) {
        obsGeralHtml = `<div class="item-obs" style="font-size:17px;">Obs geral: ${pedido.observacaoGeral}</div>`;
    }

    // Cupom
    let cupomHtml = '';
    if (pedido.cupom) {
        cupomHtml = `<div class="info-cliente"><strong>Cupom:</strong> ${pedido.cupom.codigo} (-${formatarPrecoPainel(pedido.cupom.descontoCentavos)})</div>`;
    }

    // Troco
    let trocoHtml = '';
    if (pedido.pagamento?.trocoPara) {
        trocoHtml = `<div class="info-cliente"><strong>Troco para:</strong> ${formatarPrecoPainel(pedido.pagamento.trocoPara)}</div>`;
    }

    // Frete
    let freteHtml = '';
    if (pedido.frete && pedido.frete > 0) {
        freteHtml = `<div class="info-cliente"><strong>Frete:</strong> ${formatarPrecoPainel(pedido.frete)}</div>`;
    }

    win.document.write(`
        <html>
        <head>
            <title>Pedido #${pedido.numero || '---'}</title>
            <style>
                body {
                    font-family: 'Courier New', monospace;
                    font-size: 20px;
                    width: 80mm;
                    margin: 0 auto;
                    padding: 10px;
                    line-height: 1.4;
                    background: white;
                }
                .header {
                    text-align: center;
                    margin-bottom: 20px;
                    border-bottom: 1px dashed #800020;
                    padding-bottom: 10px;
                }
                h1 {
                    font-size: 20px;
                    margin: 0;
                    color: #800020;
                }
                h2 {
                    font-size: 17px;
                    color: #800020;
                }
                .info-cliente {
                    margin: 8px 0;
                    font-size: 18px;
                }
                .linha {
                    border-top: 1px dashed #800020;
                    margin: 10px 0;
                }
                .item-linha {
                    margin: 8px 0;
                    font-size: 20px;
                    display: flex;
                    justify-content: space-between;
                }
                .item-linha span:first-child {
                    font-weight: bold;
                    text-align: left;
                }
                .item-linha span:last-child {
                    font-weight: bold;
                    text-align: right;
                }
                .item-obs {
                    margin: 8px 0;
                    padding: 5px;
                    background: #f0f0f0;
                    border-left: 4px solid #ffc107;
                    font-size: 16px;
                    font-style: italic;
                }
                .total-geral {
                    font-size: 22px;
                    font-weight: bold;
                    text-align: right;
                    border-top: 3px solid #800020;
                    border-bottom: 3px solid #800020;
                    padding: 12px 0;
                    margin: 20px 0;
                    background: #f5f5f5;
                }
                .telefone {
                    text-align: center;
                    font-weight: bold;
                    font-size: 20px;
                    margin: 20px 0;
                    color: #800020;
                }
                .footer {
                    text-align: center;
                    margin-top: 20px;
                    font-size: 16px;
                    border-top: 1px dashed #800020;
                    padding-top: 12px;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>${CONFIG_PAINEL.nomeRestaurante}</h1>
                <h2>PEDIDO #${pedido.numero || '---'}</h2>
                <p style="font-size:14px;">${new Date().toLocaleString('pt-BR')}</p>
            </div>
            
            <div class="info-cliente"><strong>Cliente:</strong> ${pedido.cliente?.nome || '---'}</div>
            <div class="info-cliente"><strong>Fone:</strong> ${pedido.cliente?.telefone || '---'}</div>
            <div class="info-cliente"><strong>Endereco:</strong> ${enderecoCompleto}</div>
            ${complementoHtml}
            ${referenciaHtml}
            ${obsGeralHtml}
            
            <div class="linha"></div>
            
            <div style="margin:10px 0;">${itensHtml}</div>
            
            <div class="info-cliente"><strong>Pagamento:</strong> ${pedido.pagamento?.tipo || '---'}</div>
            ${trocoHtml}
            ${cupomHtml}
            ${freteHtml}
            
            <div class="total-geral">TOTAL: ${formatarPrecoPainel(pedido.total)}</div>
            
            <div class="telefone">${pedido.cliente?.telefone || '---'}</div>
            
            <div class="footer">Obrigado pela preferencia!</div>
            
            <script>window.onload=function(){window.print();setTimeout(()=>window.close(),1000);}<\/script>
        </body>
        </html>
    `);
    win.document.close();
}
// ============================================
// ===== WHATSAPP =============================
// ============================================

function abrirWhatsApp() {
    window.open('https://web.whatsapp.com/', '_blank');
}

function enviarWhatsAppPreparando(pedido) {
    const mensagem = construirMensagemCompleta(pedido, 'preparando');
    abrirLinkWhatsApp(pedido.cliente.telefone, mensagem);
}

function enviarWhatsAppSaiu(pedido) {
    const mensagem = construirMensagemSimples(pedido, 'saiu_entrega');
    abrirLinkWhatsApp(pedido.cliente.telefone, mensagem);
}

function enviarWhatsAppManual(pedido) {
    const mensagem = construirMensagemSimples(pedido, pedido.status);
    abrirLinkWhatsApp(pedido.cliente.telefone, mensagem);
}

function construirMensagemCompleta(pedido, status) {
    let prefixo = CONFIG_PAINEL.mensagens[status]?.prefixo || '';
    prefixo = prefixo.replace('{NOME_RESTAURANTE}', CONFIG_PAINEL.nomeRestaurante)
                     .replace('{NUMERO}', pedido.numero || '---');

    let msg = prefixo;
    msg += `\nCliente: ${pedido.cliente?.nome || '---'}`;
    msg += `\nTelefone: ${pedido.cliente?.telefone || '---'}\n`;
    msg += `\nItens:\n`;

    if (pedido.itens) {
        pedido.itens.forEach((item, i) => {
            const nome = item.snapshot?.nome || 'Item';
            const preco = formatarPrecoPainel(item.totalItem || item.precoUnitario * item.quantidade);
            msg += `${item.quantidade}x ${nome} - ${preco}\n`;
            if (item.snapshot?.tamanho) msg += `   Tamanho: ${item.snapshot.tamanho.nome}\n`;
            if (item.snapshot?.grupos) {
                item.snapshot.grupos.forEach(g => {
                    if (g.itens.length > 0) msg += `   ${g.nome}: ${g.itens.map(i => i.nome + (i.preco > 0 ? ' (+' + formatarPrecoPainel(i.preco) + ')' : '')).join(', ')}\n`;
                });
            }
            if (item.sabores || item.snapshot?.sabores) {
                const sabores = item.sabores || item.snapshot?.sabores;
                if (sabores) msg += `   Sabores: ${sabores.map(s => s.nome).join(' e ')}\n`;
            }
        });
    }

    msg += `\nSubtotal: ${formatarPrecoPainel(pedido.subtotal)}`;
    if (pedido.cupom) msg += `\nCupom ${pedido.cupom.codigo}: -${formatarPrecoPainel(pedido.cupom.descontoCentavos)}`;
    if (pedido.frete) msg += `\nFrete: ${formatarPrecoPainel(pedido.frete)}`;
    msg += `\nTotal: ${formatarPrecoPainel(pedido.total)}`;

    if (pedido.tipoEntrega === 'entrega' && pedido.endereco) {
        msg += `\n\nEntrega: ${pedido.endereco.rua || ''}, ${pedido.endereco.numero || ''} - ${pedido.endereco.bairro || ''}`;
    } else {
        msg += `\n\nRetirada no local`;
    }
    msg += `\nPagamento: ${pedido.pagamento?.tipo || '---'}`;
    if (pedido.pagamento?.trocoPara) msg += ` (Troco para ${formatarPrecoPainel(pedido.pagamento.trocoPara)})`;
    msg += `\n\nTempo estimado: ${CONFIG_PAINEL.tempoEstimado}`;

    return msg;
}

function construirMensagemSimples(pedido, status) {
    let prefixo = CONFIG_PAINEL.mensagens[status]?.prefixo || '';
    prefixo = prefixo.replace('{NOME_RESTAURANTE}', CONFIG_PAINEL.nomeRestaurante)
                     .replace('{NUMERO}', pedido.numero || '---');
    // Adiciona apenas o nome do cliente
    return prefixo + `${pedido.cliente?.nome || '---'}`;
}

function abrirLinkWhatsApp(telefone, mensagem) {
    const numero = telefone.replace(/\D/g, '');
    const url = `https://wa.me/55${numero}?text=${encodeURIComponent(mensagem)}`;
    window.open(url, '_blank');
}

// ============================================
// ===== PLACEHOLDERS =========================
// ============================================

function abrirBairro() {
    alert('Funcionalidade "Bairros" será implementada em breve.');
}

function abrirRelatorio() {
    if (typeof abrirModalRelatorio === 'function') {
        abrirModalRelatorio();
    } else {
        alert('Carregando módulo de relatórios...');
    }
}

function abrirConfigMensagens() {
    if (typeof abrirModalMensagens === 'function') {
        abrirModalMensagens();
    } else {
        alert('Carregando configuração de mensagens...');
    }
}

// ===== EXPOR =====
window.toggleSidebar = toggleSidebar;
window.filtrarPorStatus = filtrarPorStatus;
window.abrirDetalhes = abrirDetalhes;
window.fecharDetalhes = fecharDetalhes;
window.imprimirPedidoPainel = imprimirPedidoPainel;
window.abrirWhatsApp = abrirWhatsApp;
window.abrirRelatorio = abrirRelatorio;
window.abrirBairro = abrirBairro;
window.abrirConfigMensagens = abrirConfigMensagens;
window.toggleOlho = toggleOlho;
window.verificarSenha = verificarSenha;

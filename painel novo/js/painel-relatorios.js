// ============================================
// ===== PAINEL RELATÓRIOS =====================
// ============================================

function abrirModalRelatorio() {
    // Remove modal anterior se existir
    const existente = document.getElementById('modalRelatorio');
    if (existente) existente.remove();

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay active';
    overlay.id = 'modalRelatorio';
    overlay.onclick = (e) => { if (e.target === overlay) fecharModalRelatorio(); };

    overlay.innerHTML = `
        <div class="modal-content" style="max-width: 800px;" onclick="event.stopPropagation()">
            <h2>📊 Relatório de Pedidos</h2>
            
            <div class="relatorio-filtros">
                <div>
                    <label style="display:block; font-size:0.8rem; color:#aaa;">Data Início</label>
                    <input type="date" id="relDataInicio">
                </div>
                <div>
                    <label style="display:block; font-size:0.8rem; color:#aaa;">Data Fim</label>
                    <input type="date" id="relDataFim">
                </div>
                <div>
                    <label style="display:block; font-size:0.8rem; color:#aaa;">Status</label>
                    <select id="relStatus">
                        <option value="entregue">Entregues</option>
                        <option value="cancelado">Cancelados</option>
                        <option value="todos">Todos os status</option>
                    </select>
                </div>
                <button class="btn-relatorio" onclick="gerarRelatorio()">
                    <i class="fas fa-search"></i> Gerar
                </button>
            </div>
            
            <div id="relatorioResultado">
                <p style="color:#aaa; text-align:center; padding:20px;">Selecione um período e clique em Gerar</p>
            </div>
            
            <button class="btn-fechar-modal" onclick="fecharModalRelatorio()">FECHAR</button>
        </div>
    `;

    document.body.appendChild(overlay);

    // Define datas padrão (últimos 30 dias)
    const hoje = new Date();
    const mesPassado = new Date();
    mesPassado.setDate(mesPassado.getDate() - 30);
    document.getElementById('relDataInicio').value = mesPassado.toISOString().split('T')[0];
    document.getElementById('relDataFim').value = hoje.toISOString().split('T')[0];
}

function fecharModalRelatorio() {
    const modal = document.getElementById('modalRelatorio');
    if (modal) modal.remove();
}

function gerarRelatorio() {
    const dataInicio = document.getElementById('relDataInicio').value;
    const dataFim = document.getElementById('relDataFim').value;
    const statusFiltro = document.getElementById('relStatus').value;

    if (!dataInicio || !dataFim) {
        alert('Selecione as datas de início e fim.');
        return;
    }

    // Converte para timestamps (início do dia e fim do dia)
    const inicio = new Date(dataInicio + 'T00:00:00').getTime();
    const fim = new Date(dataFim + 'T23:59:59').getTime();

    // Filtra pedidos
    let pedidosFiltrados = pedidosAtuais.filter(p => {
        if (!p.criadoEm) return false;
        const dataPedido = new Date(p.criadoEm).getTime();
        if (dataPedido < inicio || dataPedido > fim) return false;
        if (statusFiltro !== 'todos' && p.status !== statusFiltro) return false;
        return true;
    });

    const resultadoDiv = document.getElementById('relatorioResultado');

    if (pedidosFiltrados.length === 0) {
        resultadoDiv.innerHTML = '<p style="color:#aaa; text-align:center; padding:20px;">Nenhum pedido encontrado neste período.</p>';
        return;
    }

    // Agrupa por forma de pagamento
    const porPagamento = {};
    pedidosFiltrados.forEach(p => {
        const tipo = p.pagamento?.tipo || 'Não informado';
        if (!porPagamento[tipo]) porPagamento[tipo] = { quantidade: 0, total: 0, pedidos: [] };
        porPagamento[tipo].quantidade++;
        porPagamento[tipo].total += p.total || 0;
        porPagamento[tipo].pedidos.push(p);
    });

    // Tabela de resultados
    let html = `<h3 style="margin-top:20px;">📋 Resultado: ${pedidosFiltrados.length} pedido(s)</h3>`;
    html += `<table class="tabela-relatorio">`;
    html += `<thead><tr><th>Forma de Pagamento</th><th>Qtd. Pedidos</th><th>Total (R$)</th></tr></thead><tbody>`;

    let totalGeral = 0;
    let totalQtd = 0;

    for (const [pagamento, dados] of Object.entries(porPagamento)) {
        html += `<tr>
            <td>${pagamento}</td>
            <td>${dados.quantidade}</td>
            <td>${formatarPrecoPainel(dados.total)}</td>
        </tr>`;
        totalGeral += dados.total;
        totalQtd += dados.quantidade;
    }

    html += `</tbody></table>`;

    // Resumo
    const ticketMedio = totalQtd > 0 ? totalGeral / totalQtd : 0;
    html += `
        <div class="resumo-relatorio">
            <div class="resumo-box">
                <div class="valor">${totalQtd}</div>
                <div class="label">Total de Pedidos</div>
            </div>
            <div class="resumo-box">
                <div class="valor">${formatarPrecoPainel(totalGeral)}</div>
                <div class="label">Valor Total</div>
            </div>
            <div class="resumo-box">
                <div class="valor">${formatarPrecoPainel(ticketMedio)}</div>
                <div class="label">Ticket Médio</div>
            </div>
        </div>
    `;

    // Lista detalhada de pedidos
    html += `<h3 style="margin-top:20px;">📦 Pedidos Detalhados</h3>`;
    pedidosFiltrados.forEach(p => {
        html += `
            <div style="background:rgba(255,255,255,0.03); border-left:3px solid ${CONFIG_PAINEL.coresStatus[p.status] || '#800020'}; padding:10px; margin-bottom:8px; border-radius:8px; cursor:pointer;" onclick="abrirDetalhes(JSON.parse('${JSON.stringify(p).replace(/'/g, "\\'")}'))">
                <strong>#${p.numero || '---'}</strong> - ${p.cliente?.nome || '---'} | ${formatarDataHora(p.criadoEm)} | ${formatarPrecoPainel(p.total)}
                <span style="float:right; font-size:0.7rem; padding:2px 8px; border-radius:10px; background:${CONFIG_PAINEL.coresStatus[p.status] || '#800020'}; color:#fff;">${getStatusLabel(p.status)}</span>
            </div>
        `;
    });

    resultadoDiv.innerHTML = html;
}

// ===== EXPOR =====
window.abrirModalRelatorio = abrirModalRelatorio;
window.fecharModalRelatorio = fecharModalRelatorio;
window.gerarRelatorio = gerarRelatorio;
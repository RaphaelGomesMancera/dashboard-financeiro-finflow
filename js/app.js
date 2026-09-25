// ==========================================================
// Finflow — Dashboard Financeiro com múltiplas telas
// Dados persistidos em localStorage, apenas para demonstração.
// ==========================================================

const STORAGE_KEY = 'finflow_lancamentos';
let tipoAtual = 'receita';
let filtroAtual = 'todos';
let charts = {};

// ---------- Camada de dados ----------

function getLancamentos() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch (e) {
    return [];
  }
}

function saveLancamentos(lista) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
  } catch (e) {
    console.error('Não foi possível salvar os lançamentos:', e);
  }
}

function formatarMoeda(valor) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// ---------- Navegação entre telas ----------

const navItems = document.querySelectorAll('.nav-item');
navItems.forEach((btn) => {
  btn.addEventListener('click', () => {
    navItems.forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('.view').forEach((v) => v.classList.remove('active'));
    document.getElementById('view-' + btn.dataset.view).classList.add('active');
    render();
  });
});

// ---------- Formulário: tipo receita/despesa ----------

document.querySelectorAll('.seg').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.seg').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    tipoAtual = btn.dataset.tipo;
  });
});

// ---------- Filtro da lista de transações ----------

document.getElementById('filtroTipo').addEventListener('change', function () {
  filtroAtual = this.value;
  render();
});

// ---------- Adicionar lançamento ----------

document.getElementById('txForm').addEventListener('submit', function (e) {
  e.preventDefault();

  const descricao = document.getElementById('txDesc').value.trim();
  const valor = parseFloat(document.getElementById('txValor').value);
  const categoria = document.getElementById('txCategoria').value;
  const data = document.getElementById('txData').value || new Date().toISOString().slice(0, 10);

  if (!descricao || isNaN(valor) || valor <= 0) return;

  const lancamentos = getLancamentos();
  lancamentos.unshift({ id: Date.now(), tipo: tipoAtual, descricao, valor, categoria, data });
  saveLancamentos(lancamentos);

  this.reset();
  render();
});

function removerLancamento(id) {
  saveLancamentos(getLancamentos().filter((l) => l.id !== id));
  render();
}

// ---------- Cálculos ----------

function calcularTotais(lancamentos) {
  let receitas = 0, despesas = 0;
  lancamentos.forEach((l) => (l.tipo === 'receita' ? (receitas += l.valor) : (despesas += l.valor)));
  return { receitas, despesas, saldo: receitas - despesas };
}

function agruparDespesasPorCategoria(lancamentos) {
  const grupos = {};
  lancamentos.filter((l) => l.tipo === 'despesa').forEach((l) => {
    grupos[l.categoria] = (grupos[l.categoria] || 0) + l.valor;
  });
  return grupos;
}

// ---------- Render: linha de transação ----------

function linhaTx(l) {
  return `
    <div class="tx-row">
      <div class="tx-info">
        <span>${l.descricao}</span>
        <span class="tx-cat">${l.categoria} · ${new Date(l.data + 'T00:00:00').toLocaleDateString('pt-BR')}</span>
      </div>
      <span class="tx-valor ${l.tipo}">${l.tipo === 'receita' ? '+' : '-'} ${formatarMoeda(l.valor)}</span>
      <button class="tx-del" data-id="${l.id}" title="Remover">✕</button>
    </div>`;
}

function ligarBotoesRemover(container) {
  container.querySelectorAll('.tx-del').forEach((btn) => {
    btn.addEventListener('click', () => removerLancamento(Number(btn.dataset.id)));
  });
}

// ---------- Gráfico de rosca reutilizável ----------

function renderDoughnut(canvasId, emptyId, grupos) {
  const canvas = document.getElementById(canvasId);
  const empty = document.getElementById(emptyId);
  const categorias = Object.keys(grupos);

  if (categorias.length === 0) {
    canvas.style.display = 'none';
    empty.style.display = 'block';
    if (charts[canvasId]) { charts[canvasId].destroy(); delete charts[canvasId]; }
    return;
  }
  canvas.style.display = 'block';
  empty.style.display = 'none';

  const cores = ['#7C5CFF', '#22D3AC', '#FFC24B', '#FF6B6B', '#4FA3FF', '#C46BFF', '#6BFFD1'];
  if (charts[canvasId]) charts[canvasId].destroy();
  charts[canvasId] = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: categorias,
      datasets: [{ data: Object.values(grupos), backgroundColor: categorias.map((_, i) => cores[i % cores.length]), borderWidth: 0 }],
    },
    options: {
      maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom', labels: { color: '#8890A6', boxWidth: 10, font: { size: 11 } } } },
    },
  });
}

// ---------- Render: Visão Geral ----------

function renderGeral(lancamentos) {
  const totais = calcularTotais(lancamentos);
  document.getElementById('gReceitas').textContent = formatarMoeda(totais.receitas);
  document.getElementById('gDespesas').textContent = formatarMoeda(totais.despesas);
  const saldoEl = document.getElementById('gSaldo');
  saldoEl.textContent = formatarMoeda(totais.saldo);
  saldoEl.className = 'card-value ' + (totais.saldo >= 0 ? 'ok' : 'err');

  renderDoughnut('chartGeral', 'chartGeralEmpty', agruparDespesasPorCategoria(lancamentos));

  const lista = document.getElementById('listaGeral');
  const recentes = lancamentos.slice(0, 5);
  if (recentes.length === 0) {
    lista.innerHTML = '<p class="empty">Nenhum lançamento ainda.</p>';
  } else {
    lista.innerHTML = recentes.map(linhaTx).join('');
    ligarBotoesRemover(lista);
  }
}

// ---------- Render: Transações ----------

function renderTransacoes(lancamentos) {
  const filtrados = filtroAtual === 'todos' ? lancamentos : lancamentos.filter((l) => l.tipo === filtroAtual);
  const lista = document.getElementById('listaCompleta');
  if (filtrados.length === 0) {
    lista.innerHTML = '<p class="empty">Nenhum lançamento encontrado.</p>';
  } else {
    lista.innerHTML = filtrados.map(linhaTx).join('');
    ligarBotoesRemover(lista);
  }
}

// ---------- Render: Relatórios ----------

function renderRelatorios(lancamentos) {
  const despesas = lancamentos.filter((l) => l.tipo === 'despesa');
  const grupos = agruparDespesasPorCategoria(lancamentos);

  const maiorCategoria = Object.entries(grupos).sort((a, b) => b[1] - a[1])[0];
  document.getElementById('rMaiorCategoria').textContent = maiorCategoria ? maiorCategoria[0] : '—';

  const ticketMedio = despesas.length ? despesas.reduce((s, l) => s + l.valor, 0) / despesas.length : 0;
  document.getElementById('rTicketMedio').textContent = formatarMoeda(ticketMedio);
  document.getElementById('rTotalLancamentos').textContent = lancamentos.length;

  renderDoughnut('chartRelatorio', 'chartRelatorioEmpty', grupos);

  const totais = calcularTotais(lancamentos);
  const canvas = document.getElementById('chartComparativo');
  const empty = document.getElementById('chartComparativoEmpty');

  if (lancamentos.length === 0) {
    canvas.style.display = 'none';
    empty.style.display = 'block';
    if (charts.chartComparativo) { charts.chartComparativo.destroy(); delete charts.chartComparativo; }
    return;
  }
  canvas.style.display = 'block';
  empty.style.display = 'none';

  if (charts.chartComparativo) charts.chartComparativo.destroy();
  charts.chartComparativo = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: ['Receitas', 'Despesas'],
      datasets: [{ data: [totais.receitas, totais.despesas], backgroundColor: ['#22D3AC', '#FF6B6B'], borderRadius: 6 }],
    },
    options: {
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: '#8890A6' }, grid: { display: false } },
        y: { ticks: { color: '#8890A6' }, grid: { color: '#242A38' } },
      },
    },
  });
}

// ---------- Render geral ----------

function render() {
  const lancamentos = getLancamentos();
  const viewAtiva = document.querySelector('.view.active').id;

  if (viewAtiva === 'view-geral') renderGeral(lancamentos);
  else if (viewAtiva === 'view-transacoes') renderTransacoes(lancamentos);
  else if (viewAtiva === 'view-relatorios') renderRelatorios(lancamentos);
}

render();

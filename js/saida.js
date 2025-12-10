// Página de Saída - versão básica
const API = window.MaterialAPI;
const OUT = window.SaidaAPI;
const testConn = window.testConnection;

let MATS = [];
let HIST = [];
let filtro = 'todos';
let ordenacao = 'nome_asc';
let enviando = false;

// Opções de emissor (Entregue por)
const ISSUERS = {
  consoli: { key: 'consoli', name: 'Subten PM Consoli', role: '965746-A Aux de Informática' },
  murilo:  { key: 'murilo',  name: 'CB PM Murilo',     role: '102525-2 Aux de Informática' },
  divino:  { key: 'divino',  name: 'CB PM Divino',     role: '201769-5 Aux de Informática' },
};

function getStoredIssuerKey() {
  return localStorage.getItem('issuerKey') || 'murilo';
}

function setStoredIssuerKey(key) {
  const opt = ISSUERS[key] ? key : 'murilo';
  localStorage.setItem('issuerKey', opt);
  // Mantém compatibilidade com versões antigas que liam diretamente name/role
  localStorage.setItem('issuerName', ISSUERS[opt].name);
  localStorage.setItem('issuerRole', ISSUERS[opt].role);
}

function getIssuerDetails() {
  const k = getStoredIssuerKey();
  return ISSUERS[k] || ISSUERS.murilo;
}

const qDisp = m => m.quantidade_disponivel ?? m.quantidadeDisponivel ?? m.quantidade ?? 0;

async function carregar() {
  try {
    let lista = [];
    const podeAPI = typeof testConn === 'function' ? await testConn().catch(()=>false) : false;
    if (podeAPI && API?.getAll) {
      try { lista = await API.getAll(); } catch(_) { lista = []; }
    }
    if (!lista || lista.length === 0) {
      try {
        if (window.MaterialStorage?.obterMateriais) lista = window.MaterialStorage.obterMateriais();
      } catch(_) { lista = []; }
    }
    MATS = (lista||[]).map(m => ({...m, quantidade_disponivel: qDisp(m)}));
    render();
  } catch (e) {
    MATS = [];
    render();
  }
}

function baseFiltrada() {
  let base = [...MATS];
  const termo = (document.getElementById('busca')?.value || '').trim().toLowerCase();
  if (termo) base = base.filter(m => (m.nome||'').toLowerCase().includes(termo) || (m.tipo||'').toLowerCase().includes(termo));
  if (filtro === 'disponiveis') base = base.filter(m => qDisp(m) > 0);
  switch (ordenacao) {
    case 'nome_desc': base.sort((a,b)=>(b.nome||'').localeCompare(a.nome||'')); break;
    case 'estoque_desc': base.sort((a,b)=>qDisp(b)-qDisp(a)); break;
    case 'estoque_asc': base.sort((a,b)=>qDisp(a)-qDisp(b)); break;
    default: base.sort((a,b)=>(a.nome||'').localeCompare(b.nome||''));
  }
  return base;
}

function renderResumo(base) {
  const el = document.getElementById('resumo');
  if (!el) return;
  const total = base.length;
  const soma = base.reduce((acc,m)=> acc+qDisp(m), 0);
  el.textContent = `${total} itens • ${soma} em estoque`;
}

function renderTabela(base) {
  const tbody = document.getElementById('tbody-materiais');
  if (!tbody) return;
  if (!base.length) { tbody.innerHTML = '<tr><td colspan="3" style="text-align:center">Nenhum material cadastrado</td></tr>'; return; }
  tbody.innerHTML = '';
  base.forEach(m => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${m.nome}</td><td>${m.tipo||''}</td><td>${qDisp(m)}</td>`;
    tbody.appendChild(tr);
  });

  // Selecionar emissor (Entregue por)
  const issuerSelect = document.getElementById('issuer-select');
  if (issuerSelect) {
    // Define opção inicial do armazenamento
    const k = getStoredIssuerKey();
    issuerSelect.value = ISSUERS[k] ? k : 'murilo';
    issuerSelect.addEventListener('change', (e) => {
      setStoredIssuerKey(e.target.value);
    });
  }
}

function renderSelect(base) {
  const sel = document.getElementById('sel-material');
  if (!sel) return;
  sel.innerHTML = '<option value="">Selecione um material</option>';
  base.forEach(m => {
    const o = document.createElement('option');
    o.value = m.id; o.textContent = `${m.nome} (${qDisp(m)} disponíveis)`;
    sel.appendChild(o);
  });
}

function renderInfoSel() {
  const sel = document.getElementById('sel-material');
  const spanD = document.getElementById('disp');
  const spanT = document.getElementById('tipo');
  const qtd = document.getElementById('qtd');
  const btn = document.getElementById('btn-sair');
  const id = sel?.value;
  if (!id) {
    spanD.textContent = '0'; spanT.textContent = ''; btn.disabled = true; if (qtd) { qtd.min=1; qtd.value=1; qtd.removeAttribute('max'); } return;
  }
  const m = MATS.find(x => String(x.id) === String(id));
  if (!m) return;
  const disp = qDisp(m);
  spanD.textContent = String(disp);
  spanT.textContent = m.tipo ? `Tipo: ${m.tipo}` : '';
  if (qtd) {
    if (disp>0) { qtd.min=1; qtd.max=disp; qtd.value=Math.min(Math.max(1, Number(qtd.value)||1), disp); }
    else { qtd.min=0; qtd.max=0; qtd.value=0; }
  }
  btn.disabled = disp<=0;
}

function render() {
  const base = baseFiltrada();
  renderResumo(base);
  renderTabela(base);
  renderSelect(base);
  renderInfoSel();
}

function dadosForm() {
  return {
    id: document.getElementById('sel-material')?.value,
    qtd: parseInt(document.getElementById('qtd')?.value||'0',10),
    data: document.getElementById('data')?.value,
    resp: document.getElementById('resp')?.value?.trim(),
    recibo: document.getElementById('recibo')?.value?.trim(),
    serie: document.getElementById('serie')?.value?.trim(),
  };
}

function validar(d) {
  if (!d.id) return 'Selecione um material';
  if (!d.qtd || d.qtd<=0) return 'Informe uma quantidade válida';
  if (!d.resp) return 'Informe quem recebe';
  if (!d.recibo) return 'Informe o número do recibo';
  const m = MATS.find(x => String(x.id)===String(d.id));
  const disp = qDisp(m||{});
  if (d.qtd>disp) return `Quantidade (${d.qtd}) maior que disponível (${disp})`;
  return '';
}

async function registrar(d) {
  try {
    const podeAPI = typeof testConn === 'function' ? await testConn().catch(()=>false) : false;
    if (podeAPI && API?.registrarSaida) {
      const r = await API.registrarSaida(d.id, { quantidade: d.qtd, responsavel: d.resp, data_saida: d.data, destino: d.serie, numero_recibo: d.recibo });
      if (r && r.id) return { ok:true, data:r };
    }
  } catch(_) {}
  if (window.MaterialStorage?.atualizarMaterial) {
    const m = MATS.find(x => String(x.id)===String(d.id));
    if (m) {
      const novo = Math.max(0, qDisp(m)-d.qtd);
      window.MaterialStorage.atualizarMaterial(m.id, { quantidade_disponivel: novo });
      return { ok:true, data: { id: String(Date.now()), material_id: m.id, material_nome: m.nome, quantidade: d.qtd, quantidade_disponivel: novo, responsavel: d.resp, data_saida: d.data, destino: d.serie, numero_recibo: d.recibo } };
    }
  }
  return { ok:false, err:'Não foi possível registrar a saída' };
}

function limpar() {
  document.getElementById('sel-material').value='';
  document.getElementById('qtd').value=1;
  document.getElementById('resp').value='';
  document.getElementById('recibo').value='';
  document.getElementById('serie').value='';
  renderInfoSel();
}

async function init() {
  const dt = document.getElementById('data'); if (dt) dt.value = new Date().toISOString().split('T')[0];
  document.getElementById('busca')?.addEventListener('input', ()=>render());
  document.getElementById('filtro')?.addEventListener('change', e=>{ filtro=e.target.value; render(); });
  document.getElementById('ordenacao')?.addEventListener('change', e=>{ ordenacao=e.target.value; render(); });
  document.getElementById('sel-material')?.addEventListener('change', e=>renderInfoSel());
  document.getElementById('btn-recarregar')?.addEventListener('click', e=>{ e.preventDefault(); carregar(); });
  document.getElementById('btn-sair')?.addEventListener('click', async e=>{
    e.preventDefault(); if (enviando) return; enviando=true;
    const d = dadosForm(); const erro = validar(d); if (erro) { alert(erro); enviando=false; return; }
    const r = await registrar(d);
    if (r.ok) { alert('Saída registrada com sucesso!'); await carregar(); limpar(); }
    else { alert(r.err||'Erro ao registrar'); }
    enviando=false;
  });
  await carregar();
  await carregarHistorico();
}

async function carregarHistorico() {
  const tbody = document.getElementById('tbody-hist'); if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="5" style="text-align:center">Carregando...</td></tr>';
  try {
    const podeAPI = typeof testConn === 'function' ? await testConn().catch(()=>false) : false;
    let lista = [];
    if (podeAPI && OUT?.getHistorico) lista = await OUT.getHistorico();
    HIST = Array.isArray(lista) ? lista : [];
    if (!HIST.length) { tbody.innerHTML = '<tr><td colspan="5" style="text-align:center">Nenhuma saída registrada</td></tr>'; return; }
    tbody.innerHTML = '';
    HIST.slice(0,10).forEach((s, idx)=>{
      const tr = document.createElement('tr');
      const data = s.data_saida ? new Date(s.data_saida).toLocaleDateString('pt-BR') : '';
      const tdData = document.createElement('td'); tdData.textContent = data; tr.appendChild(tdData);
      const tdMat = document.createElement('td'); tdMat.textContent = s.material_nome||''; tr.appendChild(tdMat);
      const tdQtd = document.createElement('td'); tdQtd.textContent = String(s.quantidade); tr.appendChild(tdQtd);
      const tdResp = document.createElement('td'); tdResp.textContent = s.responsavel||''; tr.appendChild(tdResp);
      const tdRec = document.createElement('td');
      const btn = document.createElement('button');
      btn.className = 'btn btn-secondary';
      btn.title = 'Baixar recibo (PDF)';
      btn.innerHTML = '<span class="material-icons">download</span>';
      btn.addEventListener('click', (e)=>{ e.preventDefault(); imprimirReciboPDF(s); });
      tdRec.appendChild(btn);
      tr.appendChild(tdRec);
      tbody.appendChild(tr);
    });
  } catch(_) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:red">Erro ao carregar histórico</td></tr>';
  }
}

function imprimirReciboPDF(saida) {
  try {
    const w = window.open('', '_blank');
    if (!w) { alert('Não foi possível abrir a janela para impressão. Verifique o bloqueador de pop-ups.'); return; }

    // Utilitários
    const meses = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
    // Data do recibo vinculada à geração (agora), não à data de saída registrada
    const dt = new Date();
    const dataPorExtenso = `São Paulo, ${String(dt.getDate()).padStart(2,'0')} de ${meses[dt.getMonth()]} de ${dt.getFullYear()}.`;
    const numeroRecibo = (saida.numero_recibo||'').trim();
    const responsavel = (saida.responsavel||'').trim();
    const materialNome = (saida.material_nome||'').trim();
    const quantidade = Number(saida.quantidade||0);
    const destino = (saida.destino||'').trim();
    const linhasSerie = destino ? destino.split(/\r?\n|,|;|\|/).map(s=>s.trim()).filter(Boolean) : [];
    const { name: issuerName, role: issuerRole } = getIssuerDetails();

    const pad2 = (n)=> String(n).padStart(2,'0');
    const porExtenso = (n)=>{
      const mapa = ['zero','um','dois','três','quatro','cinco','seis','sete','oito','nove','dez','onze','doze','treze','catorze','quinze','dezesseis','dezessete','dezoito','dezenove','vinte'];
      return (n>=0 && n<=20) ? mapa[n] : String(n);
    };

    const style = `
      <style>
        @page { size: A4; margin: 18mm; }
        body { font-family: Arial, Helvetica, sans-serif; color:#000; }
        .center { text-align:center; }
        .title { font-weight:700; }
        .mt8 { margin-top:8px; } .mt12{margin-top:12px;} .mt16{margin-top:16px;} .mt24{margin-top:24px;}
        .hr { border-top:1px solid #000; margin:6px 0; }
        table { width:100%; border-collapse:collapse; }
        th, td { border:1px solid #000; padding:6px 8px; font-size:12px; vertical-align:top; }
        th { background:#f6f6f6; }
        .no-border { border:none; }
        .sign-line { margin:24px auto 0; border-top:1px solid #000; width:55%; height:1px; }
        .small { font-size:12px; }
      </style>`;

    const cabecalho = `
      <div class="center small">
        <div class="title">SECRETARIA DE ESTADO DOS NEGÓCIOS DA SEGURANÇA PÚBLICA</div>
        <div class="title">POLÍCIA MILITAR DO ESTADO DE SÃO PAULO</div>
        <div class="title">DIRETORIA DE PESSOAL</div>
        <div class="title">SEÇÃO DE INFORMÁTICA DESENVOLVIMENTO</div>
      </div>
      <div class="center mt12"><span class="title">RECIBO Nº DP-____/ 433 /____</span></div>
    `;

    const blocoRecebi = `
      <div class="mt16 small"><strong>RECEBI</strong> DA SEÇÃO DE INFORMÁTICA DA DIRETORIA DE PESSOAL, O EQUIPAMENTO DESCRITO.</div>
    `;

    const linhasSerieHtml = (linhasSerie.length
      ? linhasSerie.map(s => `<div>${s}</div>`).join('')
      : '<div>&nbsp;</div>');

    const descricaoMaterial = `${pad2(quantidade)} (${porExtenso(quantidade)}) ${materialNome}`;

    const tabela = `
      <table class="mt12">
        <thead>
          <tr>
            <th style="width:10%">Item</th>
            <th style="width:20%">Patrimônio</th>
            <th style="width:30%">Série</th>
            <th>Material</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="center">01</td>
            <td class="center">${destino ? '****' : ''}</td>
            <td>${linhasSerieHtml}</td>
            <td>${descricaoMaterial}</td>
          </tr>
        </tbody>
      </table>
    `;

    const rodape = `
      <div class="center mt16 small">${dataPorExtenso}</div>
      <div class="mt24">
        <div class="small" style="margin-bottom:36px;"><strong>RECEBIDO POR:</strong></div>
        <div class="sign-line"></div>
        <div class="small mt8" style="text-align:center;">${responsavel || ''}</div>
      </div>
      <div class="mt24">
        <div class="small" style="margin-bottom:36px;"><strong>ENTREGUE POR:</strong></div>
        <div class="sign-line"></div>
        <div class="small mt8" style="text-align:center;">${issuerName || ''}</div>
        <div class="small" style="text-align:center;">${issuerRole || ''}</div>
      </div>
    `;

    const html = `
      <html>
      <head><meta charset="utf-8">${style}<title>Recibo de Saída</title></head>
      <body>
        ${cabecalho}
        ${blocoRecebi}
        ${tabela}
        ${rodape}
        <script>window.onload = function(){ setTimeout(function(){ window.print(); window.close(); }, 250); }<\/script>
      </body></html>`;

    w.document.open();
    w.document.write(html);
    w.document.close();
  } catch (err) {
    alert('Falha ao gerar o recibo para impressão.');
  }
}

document.addEventListener('DOMContentLoaded', init);

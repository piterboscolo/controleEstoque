// Configurações de quantidade mínima por tipo de material
const configQuantidadeMinima = {
    'monitor': 5,    // Quantidade mínima aceitável
    'teclado': 10,   // Quantidade mínima aceitável
    'mouse': 10,      // Quantidade mínima aceitável
    'nobreak': 3,     // Quantidade mínima aceitável
    'cabo': 20,       // Quantidade mínima aceitável
    'fonte': 5        // Quantidade mínima aceitável
};

// Função para carregar dados do material para edição
function carregarDadosParaEdicao(material) {
    if (!material) return;
    
    console.log('Carregando dados para edição:', material);
    
    // Preenche os campos do formulário
    document.getElementById('nome').value = material.nome || '';
    document.getElementById('quantidade').value = material.quantidade || '';
    document.getElementById('data-entrada').value = material.data_entrada || new Date().toISOString().split('T')[0];
    document.getElementById('material-id').value = material.id || '';
    
    // Seleciona o tipo correto no select
    const tipoSelect = document.getElementById('tipo');
    if (tipoSelect) {
        // Procura a opção que corresponde ao tipo do material
        for (let i = 0; i < tipoSelect.options.length; i++) {
            if (tipoSelect.options[i].value === material.tipo) {
                tipoSelect.selectedIndex = i;
                break;
            }
        }
    }
    
    // Mostra o botão de editar e excluir, e esconde o de salvar
    const btnSalvar = document.getElementById('btn-salvar');
    const btnEditar = document.getElementById('btn-editar');
    const btnExcluir = document.getElementById('btn-excluir');
    
    if (btnSalvar) btnSalvar.style.display = 'none';
    if (btnEditar) btnEditar.style.display = 'inline-flex';
    if (btnExcluir) btnExcluir.style.display = 'inline-flex';
    
    console.log('Material ID definido no campo oculto:', document.getElementById('material-id').value);
}

// Função para carregar os tipos de material no select
async function carregarTiposMaterial() {
    console.log('Carregando tipos de material...');
    const tipoSelect = document.getElementById('tipo');
    if (!tipoSelect) {
        console.log('Select de tipo não encontrado');
        return;
    }
    
    try {
        // Limpa as opções atuais
        tipoSelect.innerHTML = '<option value="">Selecione um tipo</option>';
        
        console.log('Verificando MaterialStorage:', MaterialStorage);
        
        // Obtém os tipos de material do localStorage
        console.log('Chamando MaterialStorage.obterTiposMaterial()...');
        const tipos = MaterialStorage.obterTiposMaterial();
        console.log('Tipos de material carregados:', tipos);
        
        if (!Array.isArray(tipos)) {
            console.error('Erro: MaterialStorage.obterTiposMaterial() não retornou um array:', tipos);
            return;
        }
        
        // Adiciona os tipos ao select
        console.log('Adicionando tipos ao select...');
        tipos.forEach((tipo, index) => {
            console.log(`Adicionando tipo ${index + 1}/${tipos.length}:`, tipo);
            try {
                const option = document.createElement('option');
                option.value = tipo.id;
                option.textContent = tipo.nome;
                tipoSelect.appendChild(option);
                console.log(`Tipo adicionado: ${tipo.nome} (${tipo.id})`);
            } catch (error) {
                console.error(`Erro ao adicionar tipo ${index + 1}:`, error);
            }
        });
        
        console.log('Tipos de material carregados com sucesso. Total:', tipos.length);
    } catch (error) {
        console.error('Erro ao carregar tipos de material:', error);
        console.error('Stack trace:', error.stack);
    }
}


// Função para inicializar a aplicação
function initApp() {
    // Evita múltiplas inicializações (que duplicam handlers)
    if (window.__APP_INIT_DONE) {
        console.log('initApp ignorado: já inicializado.');
        return;
    }
    window.__APP_INIT_DONE = true;
    console.log('Inicializando a aplicação...');
    
    // Atualiza a data atual nos campos de data
    const dataAtual = new Date().toISOString().split('T')[0];
    document.querySelectorAll('input[type="date"]').forEach(input => {
        if (!input.value) input.value = dataAtual;
    });
    
    // Verifica se estamos na página de dashboard
    if (document.querySelector('.dashboard')) {
        console.log('Dashboard encontrado - Atualizando...');
        atualizarDashboard().catch(error => {
            console.error('Erro ao atualizar dashboard:', error);
        });
        return; // Sai da função se for a página de dashboard
    }
    
        // Verifica se estamos na página de cadastro
    const formCadastro = document.getElementById('form-cadastro');
    if (formCadastro) {
        console.log('Formulário de cadastro encontrado');
        
        // Carrega os tipos de material
        try {
            carregarTiposMaterial().catch(error => {
                console.error('Erro ao carregar tipos de material:', error);
            });
        } catch (e) {
            console.error('Erro ao carregar tipos de material:', e);
        }
        
        // Configura o formulário e botões
        try {
            if (typeof configurarFormularioCadastro === 'function') {
                configurarFormularioCadastro();
            }
            
            // Verifica se há um ID na URL para edição
            const urlParams = new URLSearchParams(window.location.search);
            const materialId = urlParams.get('editar');
            
            if (materialId) {
                console.log('Modo de edição. Buscando material com ID:', materialId);
                // Busca o material da API
                fetch(`http://localhost:3000/api/materiais/${materialId}`)
                    .then(response => {
                        console.log('Status da resposta da API:', response.status);
                        return response.json();
                    })
                    .then(material => {
                        console.log('Material recebido da API:', material);
                        if (material && material.id) {
                            carregarDadosParaEdicao(material);
                            // Mostra o botão de excluir quando estiver editando
                            const btnExcluir = document.getElementById('btn-excluir');
                            if (btnExcluir) {
                                btnExcluir.style.display = 'inline-flex';
                            }
                        } else {
                            console.error('Material não encontrado para o ID:', materialId);
                        }
                    })
                    .catch(error => {
                        console.error('Erro ao carregar material para edição:', error);
                        // Tenta carregar do localStorage como fallback
                        const material = MaterialStorage.obterMaterialPorId(materialId);
                        if (material) {
                            carregarDadosParaEdicao(material);
                            const btnExcluir = document.getElementById('btn-excluir');
                            if (btnExcluir) {
                                btnExcluir.style.display = 'inline-flex';
                            }
                        }
                    });
            }
            
        } catch (e) {
            console.error('Erro ao configurar formulário de cadastro:', e);
        }
        
        // Atualiza a lista de materiais
        try {
            atualizarListaMateriais().catch(error => {
                console.error('Erro ao atualizar lista de materiais:', error);
            });
        } catch (e) {
            console.error('Erro ao atualizar lista de materiais:', e);
        }
    }
    
    // Verifica se estamos na página de saída
    if (document.getElementById('form-saida')) {
        console.log('Formulário de saída encontrado');
        if (typeof configurarFormularioSaida === 'function') {
            configurarFormularioSaida();
        } else {
            console.error('Função configurarFormularioSaida não encontrada');
        }
    }
}

// Inicialização quando o DOM estiver pronto (garantindo execução única)
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM completamente carregado em app.js - Chamando initApp uma única vez...');
    initApp();
});

// Atualiza o dashboard com os dados mais recentes
async function atualizarDashboard() {
    try {
        // Busca os materiais da API
        const response = await fetch('http://localhost:3000/api/materiais');
        if (!response.ok) {
            throw new Error('Erro ao buscar materiais');
        }
        const materiais = await response.json();
        // Ordena os materiais por nome para melhor organização
        materiais.sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));

        const dashboard = document.querySelector('.dashboard');
        if (!dashboard) return;
        dashboard.innerHTML = '';

        if (materiais.length === 0) {
            dashboard.innerHTML = '<p>Nenhum material cadastrado.</p>';
            return;
        }

        // Barra de filtro inline ao lado do título
        const dashContainer = document.querySelector('.dashboard-container');
        const titleEl = dashContainer ? dashContainer.querySelector('h2') : null;
        const headerBar = document.getElementById('dash-header') || document.createElement('div');
        headerBar.id = 'dash-header';
        headerBar.style.display = 'flex';
        headerBar.style.gap = '12px';
        headerBar.style.alignItems = 'center';
        headerBar.style.justifyContent = 'space-between';

        if (titleEl && !headerBar.parentElement) {
            // cria um wrapper mantendo o h2 e adiciona a toolbar na mesma linha
            dashContainer.insertBefore(headerBar, titleEl);
            headerBar.appendChild(titleEl);
        }

        const toolbar = document.createElement('div');
        toolbar.style.display = 'flex';
        toolbar.style.gap = '8px';
        toolbar.style.alignItems = 'center';
        toolbar.innerHTML = `
            <input id="dash-q" type="text" placeholder="Buscar por nome ou tipo" style="flex:1 1 auto" />
            <select id="dash-type" title="Tipo" style="min-width:180px">
                <option value="__all__">Todos os tipos</option>
            </select>
            <select id="dash-sort">
                <option value="nome_asc">Nome (A-Z)</option>
                <option value="nome_desc">Nome (Z-A)</option>
                <option value="estoque_desc">Estoque (maior)</option>
                <option value="estoque_asc">Estoque (menor)</option>
            </select>
        `;
        // remove toolbar antiga, se houver
        const oldTb = headerBar.querySelector(':scope > div');
        if (oldTb) headerBar.removeChild(oldTb);
        headerBar.appendChild(toolbar);

        const todos = materiais.slice();

        // Popular select de tipos dinamicamente
        (function popularTipos(){
            try {
                const sel = document.getElementById('dash-type');
                if (!sel) return;
                const tipos = Array.from(new Set(todos.map(m => m.tipo || 'Outros'))).sort();
                tipos.forEach(t => {
                    const opt = document.createElement('option');
                    opt.value = t;
                    opt.textContent = t;
                    sel.appendChild(opt);
                });
            } catch (_) {}
        })();

        function ordenar(lista, criterio) {
            const getDisp = (m) => (m.quantidade_disponivel ?? m.quantidade ?? 0);
            switch (criterio) {
                case 'nome_desc': return lista.sort((a,b)=> (b.nome||'').localeCompare(a.nome||''));
                case 'estoque_desc': return lista.sort((a,b)=> getDisp(b)-getDisp(a));
                case 'estoque_asc': return lista.sort((a,b)=> getDisp(a)-getDisp(b));
                default: return lista.sort((a,b)=> (a.nome||'').localeCompare(b.nome||''));
            }
        }

        function renderCards(lista) {
            // Limpa os cards (toolbar está no cabeçalho, fora do .dashboard)
            dashboard.innerHTML = '';
            lista.forEach(material => {
                const card = document.createElement('div');
                card.className = 'card';
                const quantidadeDisponivel = (material.quantidade_disponivel !== undefined)
                    ? material.quantidade_disponivel
                    : (material.quantidade ?? 0);
                const percentualDisponivel = material.quantidade ? (quantidadeDisponivel / material.quantidade) * 100 : 0;
                const tipoLower = (material.tipo || '').toLowerCase();
                const quantidadeMinima = configQuantidadeMinima[tipoLower] || 1;
                const percentualMinimo = quantidadeMinima ? (quantidadeDisponivel / quantidadeMinima) * 100 : 0;
                if (quantidadeDisponivel === 0) card.classList.add('card-vermelho');
                else if (percentualDisponivel <= 50 || percentualMinimo <= 50) card.classList.add('card-laranja');
                else card.classList.add('card-verde');
                let tipoExibicao = material.tipo || 'Sem tipo';
                if (tipoLower === 'mouse') tipoExibicao = 'Mouse com fio';
                card.innerHTML = `
                    <div class="card-nome">${material.nome || ''}</div>
                    <div class="card-tipo">${tipoExibicao}</div>
                    <div class="card-quantidade">${quantidadeDisponivel} <span class="card-total">de ${material.quantidade ?? 0}</span></div>
                `;
                dashboard.appendChild(card);
            });
        }

        function aplicarFiltro() {
            const q = (document.getElementById('dash-q').value||'').toLowerCase();
            const tipoSel = (document.getElementById('dash-type').value||'__all__');
            const sort = document.getElementById('dash-sort').value;
            let lista = todos.filter(m => {
                const nome = (m.nome||'').toLowerCase();
                const tipo = (m.tipo||'').toLowerCase();
                const disp = (m.quantidade_disponivel ?? m.quantidade ?? 0);
                const match = !q || nome.includes(q) || tipo.includes(q);
                const okTipo = (tipoSel === '__all__') || ((m.tipo||'Outros') === tipoSel);
                return match && okTipo;
            });
            ordenar(lista, sort);
            renderCards(lista);
        }

        document.getElementById('dash-q').addEventListener('input', aplicarFiltro);
        document.getElementById('dash-type').addEventListener('change', aplicarFiltro);
        document.getElementById('dash-sort').addEventListener('change', aplicarFiltro);

        // Primeira renderização
        aplicarFiltro();
    } catch (error) {
        console.error('Erro ao carregar materiais:', error);
        const dashboard = document.querySelector('.dashboard');
        if (dashboard) {
            dashboard.innerHTML = `
                <div class="error-message">
                    <p>Erro ao carregar materiais. Verifique se o servidor está rodando.</p>
                    <p>${error.message}</p>
                </div>`;
        }
    }
}

// Variáveis globais para paginação
let materiaisGlobal = [];
let paginaAtual = 1;
const ITENS_POR_PAGINA = 10;

// Atualiza a lista de materiais na página de cadastro
async function atualizarListaMateriais() {
    console.log('Função atualizarListaMateriais chamada');
    const listaMateriais = document.getElementById('lista-materiais');
    
    if (!listaMateriais) {
        console.error('Elemento lista-materiais não encontrado no DOM');
        return;
    }
    
    try {
        console.log('Buscando materiais da API...');
        // Mostra um indicador de carregamento
        listaMateriais.innerHTML = '<p>Carregando materiais...</p>';
        
        // Busca os materiais da API
        const response = await fetch('http://localhost:3000/api/materiais');
        console.log('Resposta da API recebida. Status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Erro na resposta da API:', errorText);
            throw new Error(`Erro ao carregar materiais: ${response.status} ${response.statusText}`);
        }
        
        const materiais = await response.json();
        console.log('Materiais recebidos:', {
            quantidade: materiais ? materiais.length : 0,
            dados: materiais ? materiais.slice(0, 3) : 'Nenhum dado',
            temDados: !!materiais && materiais.length > 0
        });
        
        if (!materiais || materiais.length === 0) {
            listaMateriais.innerHTML = '<p>Nenhum material cadastrado ainda.</p>';
            return;
        }
        
        // Ordena os materiais por data de entrada (mais recentes primeiro)
        materiaisGlobal = [...materiais].sort((a, b) => {
            const dataA = a.data_entrada ? new Date(a.data_entrada) : new Date(0);
            const dataB = b.data_entrada ? new Date(b.data_entrada) : new Date(0);
            return dataB - dataA;
        });
        
        // Reseta para a primeira página
        paginaAtual = 1;
        
        // Exibe a primeira página
        exibirPaginaMateriais(paginaAtual);
        
    } catch (error) {
        console.error('Erro ao carregar materiais:', error);
        listaMateriais.innerHTML = `
            <div class="error-message">
                <p>Erro ao carregar a lista de materiais.</p>
                <p>${error.message}</p>
            </div>`;
    }
}

// Função para exibir uma página específica de materiais
function exibirPaginaMateriais(numeroPagina) {
    const listaMateriais = document.getElementById('lista-materiais');
    const paginacao = document.getElementById('paginacao');
    
    if (!listaMateriais || !materiaisGlobal || materiaisGlobal.length === 0) {
        return;
    }
    
    // Calcula índices
    const indiceInicio = (numeroPagina - 1) * ITENS_POR_PAGINA;
    const indiceFim = indiceInicio + ITENS_POR_PAGINA;
    const materiaisPagina = materiaisGlobal.slice(indiceInicio, indiceFim);
    const totalPaginas = Math.ceil(materiaisGlobal.length / ITENS_POR_PAGINA);
    
    console.log(`Exibindo página ${numeroPagina} de ${totalPaginas} (${materiaisPagina.length} itens)`);
    
    // Gera o HTML da tabela
    const html = `
        <div class="table-responsive">
            <table class="materiais-table">
                <thead>
                    <tr>
                        <th>Nome</th>
                        <th>Tipo</th>
                        <th>Quantidade</th>
                        <th>Disponível</th>
                        <th>Data de Entrada</th>
                        <th class="acoes-header">Ações</th>
                    </tr>
                </thead>
                <tbody>
                    ${materiaisPagina.map((material, index) => {
                        console.log(`Processando material ${index + 1}/${materiaisPagina.length}:`, material);
                        // Corrigir o problema de timezone ao exibir a data
                        let dataEntrada = 'N/A';
                        if (material.data_entrada) {
                            // Se for uma string no formato YYYY-MM-DD, tratar como data local
                            if (typeof material.data_entrada === 'string' && material.data_entrada.match(/^\d{4}-\d{2}-\d{2}/)) {
                                // Dividir a string e criar uma data local
                                const [ano, mes, dia] = material.data_entrada.split('-');
                                const data = new Date(ano, mes - 1, dia); // mes - 1 porque meses em JS são 0-indexed
                                dataEntrada = data.toLocaleDateString('pt-BR');
                            } else {
                                // Para outros formatos, usar o método padrão
                                dataEntrada = new Date(material.data_entrada).toLocaleDateString('pt-BR');
                            }
                        }
                        
                        console.log(`Gerando HTML para o material ${material.id} (${material.nome})`);
                        
                        const rowHtml = `
                        <tr>
                            <td>${material.nome || 'N/A'}</td>
                            <td>${material.tipo || 'N/A'}</td>
                            <td>${material.quantidade || 0}</td>
                            <td>${material.quantidade_disponivel !== undefined ? 
                                material.quantidade_disponivel : material.quantidade || 0}</td>
                            <td>${dataEntrada}</td>
                            <td class="acoes">
                                <button class="btn-icon btn-editar" data-id="${material.id}" title="Editar">
                                    <span class="material-icons">edit</span>
                                </button>
                                <button class="btn-icon btn-excluir" data-id="${material.id}" title="Excluir">
                                    <span class="material-icons">delete</span>
                                </button>
                            </td>
                        </tr>`;
                        
                        console.log(`HTML gerado para o material ${material.id}:`, rowHtml);
                        return rowHtml;
                    }).join('')}
                </tbody>
            </table>
        </div>
    `;
    
    listaMateriais.innerHTML = html;
    
    // Gera os controles de paginação
    let paginacaoHtml = '';
    
    if (totalPaginas > 1) {
        paginacaoHtml += `<span style="margin-right: 1rem;">Página ${numeroPagina} de ${totalPaginas}</span>`;
        
        // Botão anterior
        if (numeroPagina > 1) {
            paginacaoHtml += `<button class="btn btn-secondary" onclick="irParaPagina(${numeroPagina - 1})">← Anterior</button>`;
        }
        
        // Números das páginas
        for (let i = 1; i <= totalPaginas; i++) {
            if (i === numeroPagina) {
                paginacaoHtml += `<button class="btn" style="background-color: #2c6ac9; color: white;">${i}</button>`;
            } else {
                paginacaoHtml += `<button class="btn btn-secondary" onclick="irParaPagina(${i})">${i}</button>`;
            }
        }
        
        // Botão próximo
        if (numeroPagina < totalPaginas) {
            paginacaoHtml += `<button class="btn btn-secondary" onclick="irParaPagina(${numeroPagina + 1})">Próximo →</button>`;
        }
    }
    
    paginacao.innerHTML = paginacaoHtml;
    
    // Adiciona os eventos dos botões de editar
    const botoesEditar = document.querySelectorAll('.btn-editar');
    console.log(`Encontrados ${botoesEditar.length} botões de edição`, botoesEditar);
    
    botoesEditar.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const materialId = this.getAttribute('data-id');
            console.log('Botão editar clicado para o ID:', materialId);
            if (materialId) {
                window.location.href = `cadastro.html?editar=${materialId}`;
            }
        });
    });
    
    // Adiciona os eventos dos botões de excluir
    const botoesExcluir = document.querySelectorAll('.btn-excluir');
    console.log(`[DEBUG] Iniciando configuração de ${botoesExcluir.length} botões de exclusão`);
    
    // Verifica se o MaterialAPI está disponível
    if (typeof MaterialAPI === 'undefined') {
        console.error('[ERRO CRÍTICO] MaterialAPI não está disponível');
        alert('Erro ao carregar as funções da API. Por favor, recarregue a página.');
        return;
    }
    
    botoesExcluir.forEach((btn, index) => {
        console.log(`[DEBUG] Configurando botão de exclusão ${index + 1}/${botoesExcluir.length}:`, {
            id: btn.getAttribute('data-id'),
            classList: btn.className,
            parentElement: btn.parentElement ? btn.parentElement.className : 'sem-pai',
            display: window.getComputedStyle(btn).display,
            visibility: window.getComputedStyle(btn).visibility,
            opacity: window.getComputedStyle(btn).opacity
        });
        
        // Força a exibição do botão
        btn.style.display = 'inline-flex';
        btn.style.visibility = 'visible';
        btn.style.opacity = '1';
        
        // Remove event listeners antigos para evitar duplicação
        const novoBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(novoBtn, btn);
        
        novoBtn.addEventListener('click', async function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const materialId = this.getAttribute('data-id');
            console.log('Botão de exclusão clicado para o material ID:', materialId);
            
            if (!materialId) {
                console.error('ID do material não encontrado');
                return;
            }
            
            // Confirmação antes de excluir
            if (confirm('Tem certeza que deseja excluir este material? Esta ação não pode ser desfeita.')) {
                console.log('Confirmada a exclusão do material ID:', materialId);
                
                try {
                    // Mostra feedback visual durante a exclusão
                    const originalHTML = this.innerHTML;
                    this.innerHTML = '<span class="material-icons">hourglass_empty</span>';
                    this.disabled = true;
                    
                    // Tenta excluir pela API
                    const sucesso = await MaterialAPI.excluirMaterial(materialId);
                    
                    if (sucesso) {
                        console.log('Material excluído com sucesso via API');
                    } else {
                        console.log('Falha ao excluir via API, tentando remover do localStorage');
                        // Se falhar, tenta remover do localStorage
                        MaterialStorage.removerMaterial(materialId);
                    }
                    
                    // Atualiza a lista de materiais
                    await atualizarListaMateriais();
                    
                    // Mostra mensagem de sucesso
                    alert('Material excluído com sucesso!');
                    
                } catch (error) {
                    console.error('Erro ao excluir material:', error);
                    alert('Ocorreu um erro ao tentar excluir o material. Por favor, tente novamente.');
                    
                    // Restaura o botão em caso de erro
                    this.innerHTML = originalHTML;
                    this.disabled = false;
                }
            }
        });
        
        // Adiciona dica de ferramenta
        novoBtn.setAttribute('title', 'Excluir material');
        
        // Garante que o botão está visível
        novoBtn.style.display = 'inline-flex';
        novoBtn.style.visibility = 'visible';
        novoBtn.style.opacity = '1';
        
        console.log(`Botão de exclusão ${index + 1} configurado`);
    });
}

// Função para navegar para uma página específica
function irParaPagina(numeroPagina) {
    if (numeroPagina >= 1 && numeroPagina <= Math.ceil(materiaisGlobal.length / ITENS_POR_PAGINA)) {
        paginaAtual = numeroPagina;
        exibirPaginaMateriais(paginaAtual);
        // Scroll para o topo da tabela
        document.getElementById('lista-materiais').scrollIntoView({ behavior: 'smooth' });
    }
}

// Removido: configurarFormularioCadastro baseado em localStorage para evitar conflito

// Carrega o histórico de saídas na tabela
function carregarHistoricoSaidas() {
    const tbody = document.getElementById('corpo-historico');
    if (!tbody) return;
    
    // Limpa a tabela
    tbody.innerHTML = '';
    
    // Obtém todos os materiais
    const materiais = MaterialStorage.obterTodosMateriais();
    
    // Array para armazenar todas as saídas
    let todasSaidas = [];
    
    // Coleta todas as saídas de todos os materiais
    materiais.forEach(material => {
        if (material.saidas && material.saidas.length > 0) {
            material.saidas.forEach(saida => {
                todasSaidas.push({
                    ...saida,
                    materialNome: material.nome,
                    materialId: material.id
                });
            });
        }
    });
    
    // Ordena as saídas por data (mais recentes primeiro)
    todasSaidas.sort((a, b) => new Date(b.data) - new Date(a.data));
    
    // Limita a exibição às 20 saídas mais recentes
    const saidasRecentes = todasSaidas.slice(0, 20);
    
    if (saidasRecentes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Nenhuma saída registrada ainda.</td></tr>';
        return;
    }
    
    // Preenche a tabela com as saídas
    saidasRecentes.forEach((saida, index) => {
        const tr = document.createElement('tr');
        
        // Formata a data
        const dataFormatada = formatarData(saida.data);
        
        // Cria as células da linha
        tr.innerHTML = `
            <td>${dataFormatada}</td>
            <td>${saida.materialNome}</td>
            <td>${saida.quantidade}</td>
            <td>${saida.responsavel || '-'}</td>
            <td class="acoes">
                <button class="btn-imprimir" data-material-id="${saida.materialId}" data-saida-index="${index}" title="Imprimir recibo">
                    <span class="material-icons">print</span>
                </button>
                <button class="btn-excluir" data-material-id="${saida.materialId}" data-saida-index="${index}" title="Excluir e retornar ao estoque">
                    <span class="material-icons">undo</span>
                </button>
            </td>
        `;
        
        tbody.appendChild(tr);
        
        // Adiciona o evento de clique ao botão de impressão
        const btnImprimir = tr.querySelector('.btn-imprimir');
        if (btnImprimir) {
            btnImprimir.addEventListener('click', (e) => {
                e.preventDefault();
                const materialId = btnImprimir.getAttribute('data-material-id');
                const material = MaterialStorage.obterMaterial(materialId);
                if (material) {
                    const saidaIndex = parseInt(btnImprimir.getAttribute('data-saida-index'));
                    const saida = material.saidas[saidaIndex];
                    if (saida) {
                        mostrarRecibo(material, saida);
                    }
                }
            });
        }
        
        // Adiciona o evento de clique ao botão de exclusão
        const btnExcluir = tr.querySelector('.btn-excluir');
        if (btnExcluir) {
            btnExcluir.addEventListener('click', (e) => {
                e.preventDefault();
                const materialId = btnExcluir.getAttribute('data-material-id');
                const saidaIndex = parseInt(btnExcluir.getAttribute('data-saida-index'));
                excluirSaida(materialId, saidaIndex);
            });
        }
    });
}

// Configura o formulário de saída de materiais
function configurarFormularioSaida() {
    const form = document.getElementById('form-saida');
    if (!form) return;
    
    const selectMaterial = document.getElementById('material');
    const spanQuantidade = document.getElementById('quantidade-disponivel');
    
    // Carrega o histórico de saídas
    carregarHistoricoSaidas();
    
    // Carrega os materiais disponíveis no select
    function carregarMateriais() {
        const materiais = MaterialStorage.obterTodosMateriais()
            .filter(m => m.quantidadeDisponivel > 0);
        
        selectMaterial.innerHTML = '<option value="">Selecione um material</option>';
        
        materiais.forEach(material => {
            const option = document.createElement('option');
            option.value = material.id;
            option.textContent = `${material.nome} (${material.quantidadeDisponivel} disponíveis)`;
            selectMaterial.appendChild(option);
        });
    }
    
    // Atualiza a quantidade disponível quando o material é selecionado
    selectMaterial.addEventListener('change', function() {
        const materialId = this.value;
        if (!materialId) {
            spanQuantidade.textContent = '0';
            document.getElementById('quantidade-saida').max = 0;
            return;
        }
        
        const material = MaterialStorage.obterMaterial(materialId);
        if (material) {
            spanQuantidade.textContent = material.quantidadeDisponivel;
            document.getElementById('quantidade-saida').max = material.quantidadeDisponivel;
            document.getElementById('quantidade-saida').value = 1;
        }
    });
    
    // Configura o envio do formulário
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const materialId = selectMaterial.value;
        const quantidade = parseInt(document.getElementById('quantidade-saida').value);
        const responsavel = document.getElementById('responsavel').value.trim();
        const numeroRecibo = document.getElementById('numero-recibo').value.trim();
        const numeroSerie = document.getElementById('numero-serie').value.trim();
        const dataSaida = document.getElementById('data-saida').value || new Date().toISOString().split('T')[0];
        
        if (!materialId || !quantidade || !responsavel || !numeroRecibo || !numeroSerie) {
            alert('Por favor, preencha todos os campos obrigatórios.');
            return;
        }
        
        // Valida o formato do número do recibo (XX/XXX/25)
        const reciboRegex = /^\d{2}\/\d{3}\/\d{2}$/;
        if (!reciboRegex.test(numeroRecibo)) {
            alert('Formato do número do recibo inválido. Use o formato XX/XXX/25 (após o DP-)');
            return;
        }
        
        try {
            const material = MaterialStorage.obterMaterial(materialId);
            
            if (!material) {
                throw new Error('Material não encontrado.');
            }
            
            if (quantidade > material.quantidadeDisponivel) {
                throw new Error('Quantidade solicitada maior que a disponível em estoque.');
            }
            
            // Cria o objeto de saída
            const saida = {
                data: dataSaida,
                quantidade: quantidade,
                responsavel: responsavel,
                numeroRecibo: numeroRecibo,
                numeroSerie: numeroSerie,
                pago: true
            };
            
            // Atualiza o material
            material.quantidadeDisponivel -= quantidade;
            
            // Adiciona a saída ao histórico do material
            if (!material.saidas) {
                material.saidas = [];
            }
            material.saidas.push(saida);
            
            // Salva as alterações
            MaterialStorage.atualizarMaterial(material.id, material);
            
            // Mostra o recibo
            mostrarRecibo(material, saida);
            
            // Limpa o formulário
            form.reset();
            
            // Atualiza a lista de materiais
            carregarMateriais();
            
            // Atualiza o histórico de saídas
            carregarHistoricoSaidas();
            
        } catch (error) {
            alert(`Erro: ${error.message}`);
            console.error('Erro ao registrar saída:', error);
        }
    });
    
    // Carrega os materiais disponíveis ao iniciar
    carregarMateriais();
}

// Mostra o modal com o recibo
function mostrarRecibo(material, saida) {
    // Cria o modal se não existir
    let modal = document.getElementById('modal-recibo');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'modal-recibo';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div id="recibo-content"></div>
            </div>
        `;
        document.body.appendChild(modal);
    }
    
    // Preenche o conteúdo do recibo
    const reciboContent = modal.querySelector('#recibo-content');
    reciboContent.innerHTML = gerarConteudoRecibo(material, saida);
    
    // Fecha o modal ao clicar fora do conteúdo
    modal.onclick = function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    };
    
    // Configura os botões do recibo
    const btnImprimir = reciboContent.querySelector('button[onclick*="print"]');
    if (btnImprimir) {
        btnImprimir.onclick = function() {
            window.print();
        };
    }
    
    const btnFecharModal = reciboContent.querySelector('button[onclick*="close"]');
    if (btnFecharModal) {
        btnFecharModal.onclick = function() {
            modal.style.display = 'none';
            carregarHistoricoSaidas();
        };
    }
    
    // Exibe o modal
    modal.style.display = 'block';
}

// Função para gerar o conteúdo do recibo em formato HTML
function gerarConteudoRecibo(material, saida) {
    const dataFormatada = formatarData(saida.data);
    
    return `
        <div class="recibo-container">
            <div class="recibo-cabecalho-oficial">
                <div class="text-center">
                    <div>SECRETARIA DE ESTADO DOS NEGÓCIOS DA SEGURANÇA PÚBLICA</div>
                    <div>POLÍCIA MILITAR DO ESTADO DE SÃO PAULO</div>
                    <div>DIRETORIA DE PESSOAL</div>
                    <div>SEÇÃO DE INFORMÁTICA DESENVOLVIMENTO</div>
                </div>
                <div class="recibo-numero">
                    RECIBO Nº DP-${saida.numeroRecibo}
                </div>
                <div class="recibo-titulo">
                    RECEBI DA SEÇÃO DE INFORMÁTICA DA DIRETORIA DE PESSOAL, O EQUIPAMENTO DESCRITO ABAIXO:
                </div>
            </div>
            <div class="recibo-data">
                Data: ${dataFormatada}
            </div>
            
            <div class="recibo-conteudo">
                <table class="recibo-tabela">
                    <tr>
                        <th>QUANTIDADE</th>
                        <th>DESCRIÇÃO DO MATERIAL</th>
                        <th>Nº SÉRIE/PATRIMÔNIO</th>
                    </tr>
                    <tr>
                        <td>${saida.quantidade} unidade(s)</td>
                        <td>${material.nome} (${material.tipo})</td>
                        <td>${saida.numeroSerie || 'N/A'}</td>
                    </tr>
                </table>
                
                <div class="recibo-observacoes">
                    <p>OBS: ${saida.observacoes || 'Nenhuma observação'}</p>
                </div>
                
                <div class="recibo-entrega">
                    <p>Entregue para: <strong>${saida.responsavel || 'Não informado'}</strong></p>
                    <p>Assinatura: ________________________________________</p>
                </div>
            </div>
            
            <div class="recibo-rodape">
                <p>________________________________________</p>
                <p>Assinatura do Responsável pela Entrega</p>
            </div>
            
            <div class="recibo-rodape">
                <div class="assinatura">
                    <div class="linha-assinatura"></div>
                    <p>Assinatura do Responsável</p>
                </div>
            </div>
            
            <div class="recibo-acoes no-print">
                <button onclick="window.print()" class="btn">
                    <span class="material-icons">print</span> Imprimir Recibo
                </button>
                <button onclick="document.getElementById('modal-recibo').style.display='none'" class="btn btn-danger">
                    <span class="material-icons">close</span> Fechar
                </button>
            </div>
        </div>
    `;
}

// Função para excluir uma saída e retornar ao estoque
function excluirSaida(materialId, saidaIndex) {
    if (!confirm('Tem certeza que deseja excluir esta saída e retornar o item ao estoque?')) {
        return;
    }
    
    try {
        const material = MaterialStorage.obterMaterial(materialId);
        if (!material) throw new Error('Material não encontrado.');
        
        // Verifica se o índice da saída é válido
        if (!material.saidas || saidaIndex < 0 || saidaIndex >= material.saidas.length) {
            throw new Error('Saída não encontrada.');
        }
        
        // Remove a saída do array e obtém os dados
        const saidaRemovida = material.saidas.splice(saidaIndex, 1)[0];
        
        // Atualiza a quantidade disponível
        material.quantidadeDisponivel += saidaRemovida.quantidade;
        
        // Atualiza o material no armazenamento
        MaterialStorage.atualizarMaterial(materialId, material);
        
        // Recarrega o histórico
        carregarHistoricoSaidas();
        
        // Atualiza o dashboard
        if (typeof atualizarDashboard === 'function') {
            atualizarDashboard();
        }
        
        alert('Saída excluída com sucesso e item retornado ao estoque!');
    } catch (error) {
        console.error('Erro ao excluir saída:', error);
        alert('Erro ao excluir saída: ' + error.message);
    }
}

// Função auxiliar para formatar datas
function formatarData(dataString) {
    if (!dataString) return '';
    
    // Se for uma string no formato YYYY-MM-DD, tratar como data local
    if (typeof dataString === 'string' && dataString.match(/^\d{4}-\d{2}-\d{2}/)) {
        // Dividir a string e criar uma data local
        const [ano, mes, dia] = dataString.split('-');
        const data = new Date(ano, mes - 1, dia); // mes - 1 porque meses em JS são 0-indexed
        return data.toLocaleDateString('pt-BR');
    } else {
        // Para outros formatos, usar o método padrão
        const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
        return new Date(dataString).toLocaleDateString('pt-BR', options);
    }
}

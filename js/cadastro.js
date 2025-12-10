// Configura o formulário de cadastro de materiais
function configurarFormularioCadastro() {
    const form = document.getElementById('form-cadastro');
    const btnSalvar = document.getElementById('btn-salvar');
    const btnEditar = document.getElementById('btn-editar');
    const btnExcluir = document.getElementById('btn-excluir');
    const materialIdInput = document.getElementById('material-id');
    
    if (!form) return;
    
    // Evita registrar o listener mais de uma vez
    if (form.dataset.listenerBound === 'true') {
        console.log('Listener de submit já estava registrado no formulário.');
        return;
    }
    form.dataset.listenerBound = 'true';
    
    // Carrega os tipos de material
    carregarTiposMaterial();
    
    // Verifica se há um ID na URL para edição
    const urlParams = new URLSearchParams(window.location.search);
    const materialId = urlParams.get('editar');
    
    // Se houver ID, carrega os dados do material para edição/exclusão
    if (materialId) {
        console.log('=== MODO DE EDIÇÃO ===');
        console.log('Carregando material para edição. ID:', materialId);
        console.log('Tipo do ID:', typeof materialId);
        console.log('Comprimento do ID:', materialId.length);
        
        // Busca o material da API
        fetch(`http://localhost:3000/api/materiais/${materialId}`)
            .then(response => {
                console.log('Resposta da API ao buscar material:', response.status);
                return response.json();
            })
            .then(material => {
                console.log('Material recebido:', material);
                if (material && material.id) {
                    console.log('Carregando dados para edição...');
                    carregarDadosParaEdicao(material);
                    // Mostra o botão de excluir quando estiver editando
                    if (btnExcluir) btnExcluir.style.display = 'inline-flex';
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
                    if (btnExcluir) btnExcluir.style.display = 'inline-flex';
                }
            });
    }
    
    // Adiciona evento específico para o botão de editar
    if (btnEditar) {
        btnEditar.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Botão "Atualizar" clicado');
            form.dispatchEvent(new Event('submit'));
        });
    }
    
    // Configura o evento de submit para salvar novo material ou atualizar existente
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        console.log('=== FORMULÁRIO SUBMETIDO ===');
        
        const nome = document.getElementById('nome').value.trim();
        const tipoSelect = document.getElementById('tipo');
        const tipoId = tipoSelect.value;
        const tipoTexto = tipoSelect.options[tipoSelect.selectedIndex].text;
        const quantidade = document.getElementById('quantidade').value;
        const dataEntrada = document.getElementById('data-entrada').value;
        const materialId = materialIdInput.value;
        
        console.log('Dados do formulário:', { nome, tipoId, tipoTexto, quantidade, dataEntrada, materialId });
        
        // Debug: Verificar se o materialId está correto
        console.log('Material ID do campo oculto:', materialId);
        console.log('Tipo do materialId:', typeof materialId);
        if (materialId) {
            console.log('Comprimento do materialId:', materialId.length);
        }
        
        // Para novo cadastro, materialId pode estar vazio. Só exigimos ID quando for atualização
        
        try {
            // Evita múltiplos envios por clique repetido
            if (btnSalvar) {
                btnSalvar.disabled = true;
                btnSalvar.classList.add('is-loading');
            }
            
            if (btnEditar) {
                btnEditar.disabled = true;
                btnEditar.classList.add('is-loading');
            }
            
            if (materialId) {
                // Atualizar material existente usando PATCH
                const atualizacoes = {};
                
                // Sempre adiciona os campos do formulário (não precisamos comparar com o original)
                atualizacoes.nome = nome;
                atualizacoes.tipo = tipoTexto;
                atualizacoes.quantidade = parseInt(quantidade);
                atualizacoes.data_entrada = dataEntrada;
                
                console.log('Atualizações a serem enviadas:', atualizacoes);
                
                // Primeiro, vamos verificar se o material existe
                console.log('Verificando se o material existe antes da atualização...');
                console.log(`Enviando GET request para: http://localhost:3000/api/materiais/${materialId}`);
                const checkResponse = await fetch(`http://localhost:3000/api/materiais/${materialId}`);
                console.log('Resposta da verificação:', checkResponse.status);
                
                if (!checkResponse.ok) {
                    const errorText = await checkResponse.text();
                    console.error('Erro ao verificar material:', checkResponse.status, errorText);
                    throw new Error(`Material não encontrado na verificação: ${checkResponse.status} ${checkResponse.statusText}. Detalhes: ${errorText}`);
                }
                
                const checkMaterial = await checkResponse.json();
                console.log('Material verificado:', checkMaterial);
                
                // Ajusta a quantidade disponível com base na nova quantidade total
                const quantidadeOriginal = checkMaterial.quantidade || 0;
                const disponivelOriginal = checkMaterial.quantidade_disponivel !== undefined
                    ? checkMaterial.quantidade_disponivel
                    : quantidadeOriginal;
                const saidasRegistradas = Math.max(0, quantidadeOriginal - disponivelOriginal);
                const novaQuantidadeDisponivel = Math.max(0, parseInt(quantidade) - saidasRegistradas);
                atualizacoes.quantidade_disponivel = novaQuantidadeDisponivel;
                
                console.log('Calculando nova disponibilidade:', {
                    quantidadeOriginal,
                    disponivelOriginal,
                    saidasRegistradas,
                    novaQuantidadeDisponivel
                });
                
                console.log(`Enviando PATCH request para: http://localhost:3000/api/materiais/${materialId}`);
                const response = await fetch(`http://localhost:3000/api/materiais/${materialId}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(atualizacoes)
                });
                
                console.log('Resposta do servidor:', response.status);
                console.log('Resposta OK:', response.ok);
                
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('Erro na resposta do servidor:', errorText);
                    throw new Error(`Erro ao atualizar o material: ${response.status} ${response.statusText}. Detalhes: ${errorText}`);
                }
                
                const materialAtualizado = await response.json();
                console.log('Material atualizado:', materialAtualizado);
                
                alert('Material atualizado com sucesso!');
                window.location.href = '../index.html';
            } else {
                // Adicionar novo material
                console.log('Criando novo material...');
                
                // Gera (ou reutiliza) uma chave de idempotência por envio
                let idemKey = form.dataset.idemKey;
                if (!idemKey) {
                    try {
                        idemKey = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : `idem-${Date.now()}-${Math.random().toString(16).slice(2)}`;
                    } catch (_) {
                        idemKey = `idem-${Date.now()}-${Math.random().toString(16).slice(2)}`;
                    }
                    form.dataset.idemKey = idemKey;
                }
                
                const materialData = {
                    nome,
                    tipo: tipoTexto, // O servidor espera 'tipo' e não 'tipo_id'
                    quantidade: parseInt(quantidade),
                    data_entrada: dataEntrada || new Date().toISOString().split('T')[0],
                    requestId: idemKey
                };
                
                console.log('Dados a serem enviados para a API:', materialData);
                
                try {
                    const response = await fetch('http://localhost:3000/api/materiais', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-Idempotency-Key': idemKey
                        },
                        body: JSON.stringify(materialData)
                    });
                    
                    const data = await response.json();
                    
                    if (!response.ok) {
                        throw new Error(data.error || 'Erro ao salvar o material');
                    }
                    
                    console.log('Resposta da API:', data);
                    alert('Material cadastrado com sucesso!');
                    form.reset();
                    // Redireciona para o dashboard após 1 segundo
                    setTimeout(() => {
                        window.location.href = '../index.html';
                    }, 1000);
                } catch (error) {
                    console.error('Erro ao enviar para a API:', error);
                    throw new Error('Erro ao conectar com o servidor: ' + error.message);
                }
            }
        } catch (error) {
            alert(`Erro: ${error.message}`);
            console.error('Erro ao processar material:', error);
        } finally {
            if (btnSalvar) {
                btnSalvar.disabled = false;
                btnSalvar.classList.remove('is-loading');
            }
            if (btnEditar) {
                btnEditar.disabled = false;
                btnEditar.classList.remove('is-loading');
            }
        }
    });
}
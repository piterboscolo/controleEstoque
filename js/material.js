// Classe para gerenciar os materiais
class Material {
    constructor(nome, tipo, quantidade, dataEntrada) {
        this.id = ''; // Será definido pelo banco de dados
        this.nome = nome;
        this.tipo = tipo;
        this.quantidade = parseInt(quantidade);
        this.quantidadeDisponivel = parseInt(quantidade);
        this.dataEntrada = dataEntrada || new Date().toISOString().split('T')[0];
    }
}

// Classe para gerenciar o armazenamento no localStorage
class MaterialStorage {
    // Chave para armazenar os materiais no localStorage
    static get STORAGE_KEY() {
        return 'materiais_estoque';
    }

    // Chave para armazenar os tipos de material no localStorage
    static get TIPOS_STORAGE_KEY() {
        return 'tipos_material';
    }

    // Inicializa os dados no localStorage se necessário
    static _initStorage() {
        if (!localStorage.getItem(this.STORAGE_KEY)) {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify([]));
        }
        if (!localStorage.getItem(this.TIPOS_STORAGE_KEY)) {
            // Tipos padrão
            const tiposPadrao = [
                { id: '1', nome: 'Material de Informatica' },
                { id: '2', nome: 'Material de Impressora' },
                { id: '3', nome: 'Material Periférico' },
                { id: '4', nome: 'Material de Redes' },
                { id: '5', nome: 'Outros' }
            ];
            localStorage.setItem(this.TIPOS_STORAGE_KEY, JSON.stringify(tiposPadrao));
        }
    }

    // Obtém todos os materiais do localStorage
    static obterMateriais() {
        this._initStorage();
        return JSON.parse(localStorage.getItem(this.STORAGE_KEY)) || [];
    }

    // Obtém um material pelo ID
    static obterMaterialPorId(id) {
        const materiais = this.obterMateriais();
        return materiais.find(m => m.id === id) || null;
    }
    
    // Alias para obterMateriais para compatibilidade com código existente
    static obterTodosMateriais() {
        return this.obterMateriais();
    }
    
    // Alias para obterMaterialPorId para compatibilidade com código existente
    static obterMaterial(id) {
        return this.obterMaterialPorId(id);
    }
    
    // Alias para salvarMaterial para compatibilidade com código existente
    static adicionarMaterial(material) {
        try {
            this.salvarMaterial(material);
            return true;
        } catch (error) {
            console.error('Erro ao adicionar material:', error);
            return false;
        }
    }
    
    // Alias para obterMateriais para compatibilidade com código existente
    static carregarMateriais() {
        return this.obterMateriais();
    }

    // Salva um novo material no localStorage
    static salvarMaterial(material) {
        this._initStorage();
        const materiais = this.obterMateriais();
        
        // Gera um ID único para o material
        const novoMaterial = {
            ...material,
            id: Date.now().toString(),
            data_entrada: material.dataEntrada || new Date().toISOString().split('T')[0],
            quantidade_disponivel: material.quantidadeDisponivel || material.quantidade
        };
        
        materiais.push(novoMaterial);
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(materiais));
        
        return novoMaterial;
    }

    // Atualiza um material existente
    static atualizarMaterial(id, atualizacoes) {
        this._initStorage();
        const materiais = this.obterMateriais();
        const index = materiais.findIndex(m => m.id === id);
        
        if (index === -1) return null;
        
        materiais[index] = {
            ...materiais[index],
            ...atualizacoes,
            id // Garante que o ID não seja alterado
        };
        
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(materiais));
        return materiais[index];
    }

    // Remove um material
    static removerMaterial(id) {
        this._initStorage();
        let materiais = this.obterMateriais();
        materiais = materiais.filter(m => m.id !== id);
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(materiais));
        return true;
    }

    // Registra uma saída de material
    static registrarSaida(materialId, quantidade, responsavel, dataSaida, pago = false) {
        this._initStorage();
        const materiais = this.obterMateriais();
        const material = materiais.find(m => m.id === materialId);
        
        if (!material) {
            throw new Error('Material não encontrado');
        }
        
        // Atualiza a quantidade disponível
        material.quantidade_disponivel = (material.quantidade_disponivel || material.quantidade) - quantidade;
        
        // Salva as alterações
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(materiais));
        
        return {
            id: Date.now().toString(),
            material_id: materialId,
            quantidade,
            responsavel,
            data_saida: dataSaida,
            pago,
            data_registro: new Date().toISOString()
        };
    }

    // Obtém as saídas de um material (não implementado no localStorage padrão)
    static obterSaidasMaterial(materialId) {
        // Como não temos uma tabela de saídas no localStorage,
        // retornamos um array vazio
        return [];
    }

    // Obtém todos os tipos de material
    static obterTiposMaterial() {
        this._initStorage();
        return JSON.parse(localStorage.getItem(this.TIPOS_STORAGE_KEY)) || [];
    }

    // Obtém estatísticas gerais
    static obterEstatisticas() {
        const materiais = this.obterMateriais();
        
        let totalMateriais = materiais.length;
        let totalDisponivel = 0;
        let totalSaidas = 0;

        materiais.forEach(material => {
            const disponivel = material.quantidade_disponivel !== undefined ? 
                            material.quantidade_disponivel : material.quantidade;
            totalDisponivel += disponivel;
            totalSaidas += (material.quantidade - disponivel);
        });

        return {
            totalMateriais,
            totalDisponivel,
            totalSaidas
        };
    }
}

// Expõe classes no escopo global para acesso por módulos
window.MaterialStorage = window.MaterialStorage || MaterialStorage;
window.Material = window.Material || Material;

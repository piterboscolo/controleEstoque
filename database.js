const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'estoque.json');

// Estrutura inicial do banco
const estruturaInicial = {
  materiais: [],
  saidas: []
};

// Carrega o banco de dados do arquivo
function carregarBanco() {
  try {
    if (fs.existsSync(dbPath)) {
      const data = fs.readFileSync(dbPath, 'utf8');
      return JSON.parse(data);
    }
    return estruturaInicial;
  } catch (error) {
    console.error('Erro ao carregar banco:', error);
    return estruturaInicial;
  }
}

// Salva o banco de dados no arquivo
function salvarBanco(dados) {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(dados, null, 2), 'utf8');
  } catch (error) {
    console.error('Erro ao salvar banco:', error);
    throw error;
  }
}

// Operações de materiais
const materiais = {
  getAll: () => {
    const db = carregarBanco();
    return db.materiais.sort((a, b) => a.nome.localeCompare(b.nome));
  },
  
  getById: (id) => {
    const db = carregarBanco();
    return db.materiais.find(m => m.id === id) || null;
  },
  
  create: (material) => {
    const db = carregarBanco();
    db.materiais.push(material);
    salvarBanco(db);
    return material;
  },
  
  update: (id, atualizacoes) => {
    const db = carregarBanco();
    const index = db.materiais.findIndex(m => m.id === id);
    if (index === -1) return null;
    
    db.materiais[index] = { ...db.materiais[index], ...atualizacoes };
    salvarBanco(db);
    return db.materiais[index];
  },
  
  delete: (id) => {
    const db = carregarBanco();
    const index = db.materiais.findIndex(m => m.id === id);
    if (index === -1) return false;
    
    db.materiais.splice(index, 1);
    salvarBanco(db);
    return true;
  }
};

// Operações de saídas
const saidas = {
  getAll: () => {
    const db = carregarBanco();
    return db.saidas.sort((a, b) => new Date(b.data_saida) - new Date(a.data_saida));
  },
  
  create: (saida) => {
    const db = carregarBanco();
    db.saidas.push(saida);
    salvarBanco(db);
    return saida;
  }
};

// Inicializa o banco se não existir
if (!fs.existsSync(dbPath)) {
  salvarBanco(estruturaInicial);
  console.log('✅ Banco de dados criado: estoque.json');
}

console.log('✅ Banco de dados inicializado');

module.exports = { materiais, saidas };

const express = require('express');
const cors = require('cors');
const { materiais, saidas } = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Gerador de ID simples
function gerarId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

// Rota de teste
app.get('/api/test', (req, res) => {
  res.json({ message: 'API funcionando' });
});

// Obter todos os materiais
app.get('/api/materiais', (req, res) => {
  try {
    const lista = materiais.getAll();
    res.json(lista);
  } catch (error) {
    console.error('Erro ao buscar materiais:', error);
    res.status(500).json({ error: 'Erro ao buscar materiais' });
  }
});

// Obter um material por ID
app.get('/api/materiais/:id', (req, res) => {
  try {
    const material = materiais.getById(req.params.id);
    if (!material) {
      return res.status(404).json({ error: 'Material não encontrado' });
    }
    res.json(material);
  } catch (error) {
    console.error('Erro ao buscar material:', error);
    res.status(500).json({ error: 'Erro ao buscar material' });
  }
});

// Criar material
app.post('/api/materiais', (req, res) => {
  try {
    const { nome, tipo, quantidade, data_entrada } = req.body;
    
    if (!nome || !tipo || !quantidade) {
      return res.status(400).json({ error: 'Nome, tipo e quantidade são obrigatórios' });
    }
    
    const material = {
      id: gerarId(),
      nome,
      tipo,
      quantidade: parseInt(quantidade),
      quantidade_disponivel: parseInt(quantidade),
      data_entrada: data_entrada || new Date().toISOString().split('T')[0]
    };
    
    const criado = materiais.create(material);
    res.status(201).json(criado);
  } catch (error) {
    console.error('Erro ao criar material:', error);
    res.status(500).json({ error: 'Erro ao criar material' });
  }
});

// Atualizar material
app.patch('/api/materiais/:id', (req, res) => {
  try {
    const { id } = req.params;
    const atualizacoes = req.body;
    
    // Converte campos numéricos
    if (atualizacoes.quantidade !== undefined) {
      atualizacoes.quantidade = parseInt(atualizacoes.quantidade);
    }
    if (atualizacoes.quantidade_disponivel !== undefined) {
      atualizacoes.quantidade_disponivel = parseInt(atualizacoes.quantidade_disponivel);
    }
    
    const atualizado = materiais.update(id, atualizacoes);
    if (!atualizado) {
      return res.status(404).json({ error: 'Material não encontrado' });
    }
    res.json(atualizado);
  } catch (error) {
    console.error('Erro ao atualizar material:', error);
    res.status(500).json({ error: 'Erro ao atualizar material' });
  }
});

// Excluir material
app.delete('/api/materiais/:id', (req, res) => {
  try {
    const { id } = req.params;
    const deletado = materiais.delete(id);
    if (!deletado) {
      return res.status(404).json({ error: 'Material não encontrado' });
    }
    res.status(204).send();
  } catch (error) {
    console.error('Erro ao excluir material:', error);
    res.status(500).json({ error: 'Erro ao excluir material' });
  }
});

// Registrar saída
app.post('/api/materiais/:id/saida', (req, res) => {
  try {
    const { id } = req.params;
    const { quantidade, responsavel, data_saida, destino, numero_recibo } = req.body;
    
    if (!quantidade || !responsavel) {
      return res.status(400).json({ error: 'Quantidade e responsável são obrigatórios' });
    }
    
    const quantidadeSaida = parseInt(quantidade);
    
    // Busca o material
    const material = materiais.getById(id);
    if (!material) {
      return res.status(404).json({ error: 'Material não encontrado' });
    }
    
    if (quantidadeSaida > material.quantidade_disponivel) {
      return res.status(400).json({
        error: 'Quantidade solicitada maior que a disponível',
        disponivel: material.quantidade_disponivel
      });
    }
    
    // Atualiza quantidade disponível
    const novaQuantidade = material.quantidade_disponivel - quantidadeSaida;
    materiais.update(id, { quantidade_disponivel: novaQuantidade });
    
    // Registra a saída
    const saida = {
      id: gerarId(),
      material_id: id,
      material_nome: material.nome,
      quantidade: quantidadeSaida,
      quantidade_disponivel: novaQuantidade,
      data_saida: data_saida || new Date().toISOString().split('T')[0],
      responsavel,
      destino: destino || '',
      numero_recibo: numero_recibo || ''
    };
    
    const criada = saidas.create(saida);
    res.status(201).json(criada);
  } catch (error) {
    console.error('Erro ao registrar saída:', error);
    res.status(500).json({ error: 'Erro ao registrar saída' });
  }
});

// Obter histórico de saídas
app.get('/api/saidas', (req, res) => {
  try {
    const lista = saidas.getAll();
    res.json(lista);
  } catch (error) {
    console.error('Erro ao buscar histórico:', error);
    res.status(500).json({ error: 'Erro ao buscar histórico' });
  }
});

// Tipos de material
app.get('/api/materiais/tipos', (req, res) => {
  res.json([
    { id: '1', nome: 'Material de Informatica' },
    { id: '2', nome: 'Material de Impressora' },
    { id: '3', nome: 'Material Periférico' },
    { id: '4', nome: 'Material de Redes' },
    { id: '5', nome: 'Outros' }
  ]);
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`Banco de dados: estoque.json`);
});

module.exports = app;

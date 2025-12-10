# Sistema de Controle de Estoque

Sistema simples para gerenciamento de entrada e saída de materiais em estoque.

## Estrutura do Projeto

```
controleEstoque-main/
├── pages/           # Páginas HTML
│   ├── cadastro.html
│   └── saida.html
├── js/              # Scripts JavaScript
│   ├── api.js       # Cliente da API
│   ├── app.js       # Lógica principal
│   ├── cadastro.js  # Cadastro de materiais
│   ├── material.js  # Gerenciamento de materiais
│   └── saida.js     # Saída de materiais
├── css/             # Estilos
│   └── style.css
├── img/             # Imagens
├── estoque.json     # Banco de dados (JSON) - gerado automaticamente
├── database.js      # Camada de dados (leitura/gravação em JSON)
├── server.js        # Servidor API (Node.js/Express)
└── index.html       # Dashboard principal
```

## Configuração

1. **Instale as dependências**
   ```bash
   npm install
   ```

2. **Inicie o servidor**
   ```bash
   npm start
   ```
   
   O servidor estará disponível em `http://localhost:3000`
   O banco de dados em arquivo JSON será criado automaticamente como `estoque.json`

## Banco de Dados

O sistema usa **armazenamento em arquivo JSON** - simples e eficiente:

- **Arquivo único**: `estoque.json` (criado automaticamente)
- **Zero dependências**: Não precisa instalar banco de dados
- **Zero configuração**: Funciona imediatamente
- **Backup simples**: Basta copiar o arquivo `estoque.json`
- **Fácil de visualizar**: Arquivo texto legível

### Estrutura do Banco

- **Array `materiais`**: Armazena os materiais em estoque
- **Array `saidas`**: Registra todas as saídas de materiais

## Funcionalidades

- **Cadastro de Materiais**: Adicione novos materiais ao estoque
- **Saída de Materiais**: Registre saídas com controle de quantidade disponível
- **Histórico**: Visualize histórico de saídas
- **Persistência**: Dados salvos em arquivo JSON (persistente)

## Tecnologias

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node.js, Express
- **Banco de Dados**: Arquivo JSON (sem dependências)

## Capturas de Tela

> Salve as imagens na pasta `img/` com os nomes abaixo.

![Dashboard](img/dashboard.png)

![Cadastrar Material](img/cadastrar-material.png)

![Saída de Materiais](img/saida-materiais.png)

![Últimos Materiais Cadastrados](img/ultimos-materiais.png)

## Requisitos

- Node.js 16+ (recomendado 18+)

## Scripts

- `npm start` — inicia a API em produção
- `npm run dev` — inicia com nodemon (hot reload)

## Variáveis de Ambiente

- `PORT` (opcional): porta da API. Padrão `3000`.

## Endpoints da API

- `GET /api/test` — status da API
- `GET /api/materiais` — lista materiais
- `GET /api/materiais/:id` — obtém material por ID
- `POST /api/materiais` — cria material
- `PATCH /api/materiais/:id` — atualiza material (parcial)
- `DELETE /api/materiais/:id` — remove material
- `POST /api/materiais/:id/saida` — registra saída de material
- `GET /api/saidas` — histórico de saídas
- `GET /api/materiais/tipos` — tipos de material suportados

### Exemplos

Criar material:

```bash
curl -X POST http://localhost:3000/api/materiais \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Cabo HDMI",
    "tipo": "Material de Periférico",
    "quantidade": 10
  }'
```

Registrar saída:

```bash
curl -X POST http://localhost:3000/api/materiais/<ID_DO_MATERIAL>/saida \
  -H "Content-Type: application/json" \
  -d '{
    "quantidade": 2,
    "responsavel": "João",
    "destino": "Sala 101",
    "numero_recibo": "REC-001"
  }'
```

## Estrutura dos Dados (JSON)

```json
{
  "materiais": [
    {
      "id": "...",
      "nome": "...",
      "tipo": "...",
      "quantidade": 10,
      "quantidade_disponivel": 8,
      "data_entrada": "2025-01-01"
    }
  ],
  "saidas": [
    {
      "id": "...",
      "material_id": "...",
      "material_nome": "...",
      "quantidade": 2,
      "quantidade_disponivel": 8,
      "data_saida": "2025-01-02",
      "responsavel": "...",
      "destino": "...",
      "numero_recibo": "..."
    }
  ]
}
```

## Vantagens do Armazenamento JSON

✅ Zero configuração - arquivo JSON simples  
✅ Zero dependências - não precisa instalar nada  
✅ Backup simples - copiar o arquivo  
✅ Fácil de visualizar e editar manualmente  
✅ Rápido e eficiente para pequenos/médios volumes  
✅ Ideal para desenvolvimento e projetos pequenos  

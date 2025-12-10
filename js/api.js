const API_BASE_URL = 'http://localhost:3000/api';

async function apiRequest(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const error = new Error(data.error || 'Erro na requisição');
      error.response = response;
      error.data = data;
      throw error;
    }

    return data;
  } catch (error) {
    throw error;
  }
}

// Implementação padrão (HTTP local)
const MaterialAPI_HTTP = {
  getAll: async () => {
    return apiRequest('/materiais');
  },

  getById: async (id) => {
    return apiRequest(`/materiais/${id}`);
  },

  create: async (material) => {
    return apiRequest('/materiais', {
      method: 'POST',
      body: material,
    });
  },

  update: async (id, material) => {
    return apiRequest(`/materiais/${id}`, {
      method: 'PUT',
      body: material,
    });
  },
  
  patch: async (id, updates) => {
    return apiRequest(`/materiais/${id}`, {
      method: 'PATCH',
      body: updates,
    });
  },
  
  excluirMaterial: async (id) => {
    if (!id) return false;
    
    try {
      const response = await fetch(`${API_BASE_URL}/materiais/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      
      return response.ok;
    } catch (error) {
      return false;
    }
  },
  
  obterTiposMaterial: async () => {
    try {
      return await apiRequest('/materiais/tipos');
    } catch (error) {
      return [];
    }
  },

  registrarSaida: async (materialId, saidaData) => {
    return apiRequest(`/materiais/${materialId}/saida`, {
      method: 'POST',
      body: saidaData,
    });
  }
};

// Implementação Firebase (Firestore compat) - opcional
function isFirestoreReady() {
  return typeof window !== 'undefined' && !!window.db && !!window.db.collection;
}

const MaterialAPIFirebase = {
  getAll: async () => {
    const snap = await window.db.collection('materiais').get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },
  getById: async (id) => {
    const doc = await window.db.collection('materiais').doc(String(id)).get();
    if (!doc.exists) throw new Error('Material não encontrado');
    return { id: doc.id, ...doc.data() };
  },
  create: async (material) => {
    const ref = await window.db.collection('materiais').add(material);
    const doc = await ref.get();
    return { id: doc.id, ...doc.data() };
  },
  update: async (id, material) => {
    await window.db.collection('materiais').doc(String(id)).set(material, { merge: true });
    const doc = await window.db.collection('materiais').doc(String(id)).get();
    return { id: doc.id, ...doc.data() };
  },
  patch: async (id, updates) => {
    await window.db.collection('materiais').doc(String(id)).set(updates, { merge: true });
    const doc = await window.db.collection('materiais').doc(String(id)).get();
    return { id: doc.id, ...doc.data() };
  },
  excluirMaterial: async (id) => {
    await window.db.collection('materiais').doc(String(id)).delete();
    return true;
  },
  obterTiposMaterial: async () => {
    // Tipos estáticos por enquanto
    return [
      { id: '1', nome: 'Material de Informatica' },
      { id: '2', nome: 'Material de Impressora' },
      { id: '3', nome: 'Material Periférico' },
      { id: '4', nome: 'Material de Redes' },
      { id: '5', nome: 'Outros' }
    ];
  },
  registrarSaida: async (materialId, saidaData) => {
    const matRef = window.db.collection('materiais').doc(String(materialId));
    const doc = await matRef.get();
    if (!doc.exists) throw new Error('Material não encontrado');
    const material = { id: doc.id, ...doc.data() };
    const disponivel = parseInt(material.quantidade_disponivel ?? material.quantidade ?? 0, 10) || 0;
    const quantidadeSaida = parseInt(saidaData.quantidade, 10) || 0;
    if (quantidadeSaida <= 0) throw new Error('Quantidade inválida');
    if (quantidadeSaida > disponivel) throw new Error('Quantidade solicitada maior que a disponível');

    const novaQtd = disponivel - quantidadeSaida;
    await matRef.set({ quantidade_disponivel: novaQtd }, { merge: true });

    const saida = {
      material_id: material.id,
      material_nome: material.nome,
      quantidade: quantidadeSaida,
      quantidade_disponivel: novaQtd,
      data_saida: saidaData.data_saida || new Date().toISOString().split('T')[0],
      responsavel: saidaData.responsavel || '',
      destino: saidaData.destino || '',
      numero_recibo: saidaData.numero_recibo || ''
    };
    const ref = await window.db.collection('saidas').add(saida);
    const created = await ref.get();
    return { id: created.id, ...created.data() };
  }
};

const SaidaAPIFirebase = {
  getHistorico: async () => {
    // Ordenar por data_saida desc (string yyyy-mm-dd)
    const snap = await window.db.collection('saidas').get();
    const lista = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return lista.sort((a,b) => new Date(b.data_saida || 0) - new Date(a.data_saida || 0));
  }
};

// Seleção dinâmica: se Firestore estiver pronto, usa Firebase; senão, HTTP
const MaterialAPI = isFirestoreReady() ? MaterialAPIFirebase : MaterialAPI_HTTP;

window.MaterialAPI = MaterialAPI;

const SaidaAPI = isFirestoreReady() ? SaidaAPIFirebase : {
  getHistorico: async () => {
    return apiRequest('/saidas');
  },
};

window.SaidaAPI = SaidaAPI;

async function testConnection() {
  try {
    await apiRequest('/test');
    return true;
  } catch (error) {
    return false;
  }
}

window.testConnection = testConnection;


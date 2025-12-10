// Inicialização do Firebase (compat)
// Defina window.FIREBASE_CONFIG antes de carregar este arquivo, por exemplo:
// window.FIREBASE_CONFIG = { apiKey: "...", authDomain: "...", projectId: "...", appId: "...", ... }

(function(){
  try {
    if (!window.FIREBASE_CONFIG) {
      console.warn('[firebase] FIREBASE_CONFIG não definido. Integração com Firebase não será ativada.');
      return;
    }
    if (!window.firebase || !firebase.initializeApp) {
      console.error('[firebase] SDK Firebase (compat) não carregado. Inclua firebase-app-compat.js e firebase-firestore-compat.js antes.');
      return;
    }
    // Evita re-inicialização
    if (firebase.apps && firebase.apps.length === 0) {
      firebase.initializeApp(window.FIREBASE_CONFIG);
    }
    // Firestore
    if (firebase.firestore) {
      window.db = firebase.firestore();
      console.log('[firebase] Firestore disponível e inicializado.');
    } else {
      console.error('[firebase] Firestore (compat) não disponível.');
    }
  } catch (e) {
    console.error('[firebase] Erro ao inicializar:', e);
  }
})();

const chokidar = require('chokidar');
const axios = require('axios');
const path = require('path');

// Dossier à surveiller
const folderPath = 'C:\PartageSecure';  // Chemin vers le dossier partagé

// Surveillance
const watcher = chokidar.watch(folderPath, {
  persistent: true,
  ignoreInitial: true
});

// Quand un fichier est ajouté
watcher.on('add', filePath => {
  sendAction('write', filePath);
});

// Quand un fichier est modifié
watcher.on('change', filePath => {
  sendAction('modify', filePath);
});

// Quand un fichier est supprimé
watcher.on('unlink', filePath => {
  sendAction('delete', filePath);
});

// Envoi vers l'API Blockchain
function sendAction(action, filePath) {
  const fileName = path.basename(filePath);
  const resource = 'PartageSecure';
  const user = 'maria';  // 🔁 Tu peux détecter le vrai utilisateur si besoin
  const url = 'http://localhost:3000/api/access';

  axios.post(url, {
    user,
    action,
    resource: `${resource}/${fileName}`
  }).then(res => {
    console.log(`[✓] ${action.toUpperCase()} enregistré pour ${fileName}`);
  }).catch(err => {
    console.error(`[✗] Erreur d'enregistrement :`, err.message);
  });
}

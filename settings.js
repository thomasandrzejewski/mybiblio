// settings.js — page for settings (clear storage)
import { LocalStorageAdapter as Storage } from './storage-local.js';

const clearBtn = document.getElementById('clearBtn');

clearBtn.addEventListener('click', async ()=>{
  if(!confirm('Cette action supprimera toutes les données locales (livres et étagères). Continuer ?')) return;
  await Storage.clear();
  alert('Stockage local vidé.');
  // redirect to recherche (home)
  window.location.href = 'index.html';
});

// settings.js — page for settings (clear storage)
import { Storage } from './storage.js';

const clearBtn = document.getElementById('clearBtn');

clearBtn.addEventListener('click', async ()=>{
  if(!confirm('Cette action supprimera toutes les données dans Supabase (livres et étagères). Continuer ?')) return;
  try {
    await Storage.clear();
    alert('Données Supabase supprimées.');
    // redirect to recherche (home)
    window.location.href = 'index.html';
  } catch(err) {
    alert('Erreur: ' + (err.message || err));
  }
});

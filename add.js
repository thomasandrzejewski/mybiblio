// add.js — page-specific logic for add.html
import { LocalStorageAdapter as Storage } from './storage-local.js';

const dom = {
  shelfSelect: document.getElementById('shelfSelect'),
  createShelfBtn: document.getElementById('createShelfBtn'),
  newShelfContainer: document.getElementById('newShelfContainer'),
  newShelfName: document.getElementById('newShelfName'),
  addNewShelf: document.getElementById('addNewShelf'),
  cancelNewShelf: document.getElementById('cancelNewShelf'),
  addBookForm: document.getElementById('addBookForm'),
  exportBtn: document.getElementById('exportBtn'),
  importFile: document.getElementById('importFile'),
  clearBtn: document.getElementById('clearBtn')
};

async function fetchShelves(){
  const shelves = await Storage.getShelves();
  populateShelves(shelves);
}

function populateShelves(shelves){
  const sel = dom.shelfSelect;
  sel.querySelectorAll('option:not([value=""])').forEach(o => o.remove());
  shelves.sort((a,b)=>a.name.localeCompare(b.name));
  for(const s of shelves){
    const opt = document.createElement('option');
    opt.value = s.id;
    opt.textContent = s.name;
    sel.appendChild(opt);
  }
}

// show/hide new shelf form
dom.createShelfBtn.addEventListener('click', ()=>{
  dom.newShelfContainer.classList.remove('hidden');
  dom.newShelfName.focus();
});

dom.cancelNewShelf.addEventListener('click', ()=>{
  dom.newShelfContainer.classList.add('hidden');
  dom.newShelfName.value = '';
});

// create shelf inline
dom.addNewShelf.addEventListener('click', async ()=>{
  const name = (dom.newShelfName.value||'').trim();
  if(!name) return alert('Nom requis');
  try{
    const shelf = await Storage.createShelf(name);
    await fetchShelves();
    for(const opt of dom.shelfSelect.options){
      if(opt.textContent.toLowerCase() === shelf.name.toLowerCase()){
        opt.selected = true; break;
      }
    }
    dom.newShelfContainer.classList.add('hidden');
    dom.newShelfName.value = '';
  }catch(err){
    alert(err.message || 'Erreur');
  }
});

// submit new book (shelf required)
dom.addBookForm.addEventListener('submit', async (e)=>{
  e.preventDefault();
  const title = document.getElementById('title').value.trim();
  const author = document.getElementById('author').value.trim();
  const shelfId = dom.shelfSelect.value || null;

  if(!title){ alert('Le titre est requis'); return; }
  if(!shelfId){ alert("Veuillez sélectionner une étagère avant d'enregistrer."); return; }

  try{
    await Storage.createBook({title,author,shelfId});
    dom.addBookForm.reset();
    dom.shelfSelect.value = '';
    alert('Livre ajouté');
  }catch(err){
    alert(err.message || 'Erreur lors de l\'enregistrement');
  }
});

// export / import
dom.exportBtn.addEventListener('click', async ()=>{
  const data = await Storage.exportData();
  const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'mybiblio-export.json';
  document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
});

dom.importFile && dom.importFile.addEventListener('change', async (e)=>{
  const file = e.target.files && e.target.files[0];
  if(!file) return;
  try{
    const txt = await file.text();
    const data = JSON.parse(txt);
    await Storage.importData(data);
    await fetchShelves();
    alert('Import terminé');
  }catch(err){
    alert('Échec de l\'import: ' + err.message);
  }finally{
    e.target.value = '';
  }
});

dom.clearBtn && dom.clearBtn.addEventListener('click', async ()=>{
  if(!confirm('Cette action supprime les données stockées localement. Continuer ?')) return;
  await Storage.clear();
  await fetchShelves();
});

// init
fetchShelves().catch(console.error);

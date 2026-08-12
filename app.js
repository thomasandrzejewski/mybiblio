// app.js — main UI logic
import { LocalStorageAdapter as Storage } from './storage-local.js';

const dom = {
  shelfSelect: document.getElementById('shelfSelect'),
  createShelfBtn: document.getElementById('createShelfBtn'),
  newShelfContainer: document.getElementById('newShelfContainer'),
  newShelfName: document.getElementById('newShelfName'),
  addNewShelf: document.getElementById('addNewShelf'),
  cancelNewShelf: document.getElementById('cancelNewShelf'),
  addBookForm: document.getElementById('addBookForm'),
  booksList: document.getElementById('booksList'),
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
  // keep the placeholder option (value=="") and remove others
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
    // select the new shelf
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

// submit new book
dom.addBookForm.addEventListener('submit', async (e)=>{
  e.preventDefault();
  const title = document.getElementById('title').value.trim();
  const author = document.getElementById('author').value.trim();
  const shelfId = dom.shelfSelect.value || null;

  if(!title){ alert('Le titre est requis'); return; }

  if(!shelfId){
    const ok = confirm('Aucune étagère sélectionnée. Enregistrer sans étagère ?');
    if(!ok) return;
  }

  try{
    await Storage.createBook({title,author,shelfId});
    dom.addBookForm.reset();
    // keep placeholder selected
    dom.shelfSelect.value = '';
    renderBooks();
    alert('Livre ajouté');
  }catch(err){
    alert(err.message || 'Erreur lors de l\'enregistrement');
  }
});

async function renderBooks(){
  const books = await Storage.getBooks();
  const shelves = await Storage.getShelves();
  const shelfById = new Map(shelves.map(s=>[s.id,s]));
  const container = dom.booksList;
  container.innerHTML = '';
  if(books.length === 0){ container.textContent = 'Aucun livre pour le moment.'; return; }
  for(const b of books.slice().reverse()){
    const div = document.createElement('div');
    div.className = 'book';
    const h3 = document.createElement('h3'); h3.textContent = b.title; div.appendChild(h3);
    const p1 = document.createElement('p'); p1.textContent = b.author ? `Auteur: ${b.author}` : 'Auteur: —'; div.appendChild(p1);
    const shelf = b.shelfId ? (shelfById.get(b.shelfId)?.name || 'Inconnue') : 'Sans étagère';
    const p2 = document.createElement('p'); p2.textContent = `Étagère: ${shelf}`; div.appendChild(p2);
    container.appendChild(div);
  }
}

// export / import
dom.exportBtn.addEventListener('click', async ()=>{
  const data = await Storage.exportData();
  const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'mybiblio-export.json';
  document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
});

dom.importFile.addEventListener('change', async (e)=>{
  const file = e.target.files && e.target.files[0];
  if(!file) return;
  try{
    const txt = await file.text();
    const data = JSON.parse(txt);
    await Storage.importData(data);
    await fetchShelves();
    await renderBooks();
    alert('Import terminé');
  }catch(err){
    alert('Échec de l\'import: ' + err.message);
  }finally{
    e.target.value = '';
  }
});

// clear storage
dom.clearBtn.addEventListener('click', async ()=>{
  if(!confirm('Cette action supprime les données stockées localement. Continuer ?')) return;
  await Storage.clear();
  await fetchShelves();
  await renderBooks();
});

// initial load
fetchShelves().then(renderBooks).catch(err=>{
  console.error(err);
});

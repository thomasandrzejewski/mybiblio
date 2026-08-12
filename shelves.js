// shelves.js — list books grouped by shelf with edit & delete
import { LocalStorageAdapter as Storage } from './storage-local.js';

const shelvesList = document.getElementById('shelvesList');
const booksByShelf = document.getElementById('booksByShelf');
const panelTitle = document.getElementById('panelTitle');

function createBookElement(b){
  const div = document.createElement('div'); div.className='book';
  const title = document.createElement('h3'); title.textContent = b.title; div.appendChild(title);
  const author = document.createElement('p'); author.textContent = b.author ? `Auteur: ${b.author}` : 'Auteur: —'; div.appendChild(author);
  const controls = document.createElement('div'); controls.className = 'inline-controls';
  const del = document.createElement('button'); del.className='secondary'; del.textContent='Supprimer';
  del.addEventListener('click', async ()=>{
    if(!confirm('Supprimer ce livre ?')) return;
    await Storage.deleteBook(b.id);
    await loadAndRender();
  });
  controls.appendChild(del);
  div.appendChild(controls);
  return div;
}

function renderGrouping(shelves, books){
  booksByShelf.innerHTML = '';
  const grouping = new Map();
  for(const s of shelves) grouping.set(s.id, {shelf: s, books: []});
  const noShelf = { id: null, name: 'Sans étagère' };
  grouping.set(null, {shelf: noShelf, books: []});
  for(const b of books){
    const key = b.shelfId === null ? null : b.shelfId;
    const g = grouping.get(key);
    if(g) g.books.push(b);
    else grouping.get(null).books.push(b);
  }

  for(const [id, group] of grouping){
    const h = document.createElement('h3'); h.textContent = group.shelf.name; booksByShelf.appendChild(h);
    if(group.books.length === 0){ const p = document.createElement('p'); p.textContent = 'Aucun livre'; p.className='muted'; booksByShelf.appendChild(p); continue; }
    for(const b of group.books.slice().reverse()){
      booksByShelf.appendChild(createBookElement(b));
    }
  }
}

function renderShelvesSidebar(shelves){
  shelvesList.innerHTML = '';
  const allItem = document.createElement('li'); allItem.innerHTML = `<strong>Tous</strong><div class="muted">Voir tous les livres</div>`;
  allItem.addEventListener('click', ()=>{ panelTitle.textContent='Tous les livres'; loadAndRender(); });
  shelvesList.appendChild(allItem);
  for(const s of shelves){
    const li = document.createElement('li');
    const nameSpan = document.createElement('strong'); nameSpan.textContent = s.name;
    const meta = document.createElement('div'); meta.className='muted'; meta.textContent = new Date(s.createdAt).toLocaleDateString();
    const actions = document.createElement('div'); actions.className='inline-controls';
    const editBtn = document.createElement('button'); editBtn.className='secondary'; editBtn.textContent='Éditer';
    editBtn.addEventListener('click', async ()=>{
      const newName = prompt('Nom de l\'étagère', s.name);
      if(newName === null) return;
      try{
        await Storage.updateShelf(s.id, newName);
        await loadAndRender();
      }catch(err){
        alert(err.message || 'Erreur');
      }
    });
    actions.appendChild(editBtn);
    li.appendChild(nameSpan); li.appendChild(meta); li.appendChild(actions);
    li.addEventListener('click', (e)=>{
      // avoid triggering when clicking edit button
      if(e.target === editBtn) return;
      panelTitle.textContent = s.name; loadAndRender(s.id);
    });
    shelvesList.appendChild(li);
  }
}

async function loadAndRender(filterShelfId){
  const shelves = await Storage.getShelves();
  const books = await Storage.getBooks();
  renderShelvesSidebar(shelves);
  if(typeof filterShelfId === 'undefined'){
    renderGrouping(shelves, books);
  }else{
    const groupShelf = shelves.find(s=>s.id===filterShelfId) || {id:null,name:'Sans étagère'};
    booksByShelf.innerHTML = '';
    const h = document.createElement('h3'); h.textContent = groupShelf.name; booksByShelf.appendChild(h);
    const filtered = books.filter(b => (b.shelfId||null) === filterShelfId);
    if(filtered.length===0){ const p = document.createElement('p'); p.textContent='Aucun livre'; p.className='muted'; booksByShelf.appendChild(p); return; }
    for(const b of filtered.slice().reverse()){
      booksByShelf.appendChild(createBookElement(b));
    }
  }
}

async function init(){
  await loadAndRender();
}

init().catch(console.error);

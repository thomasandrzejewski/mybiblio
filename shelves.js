// shelves.js — list books grouped by shelf
import { LocalStorageAdapter as Storage } from './storage-local.js';

const shelvesList = document.getElementById('shelvesList');
const booksByShelf = document.getElementById('booksByShelf');
const panelTitle = document.getElementById('panelTitle');

function renderGrouping(shelves, books){
  booksByShelf.innerHTML = '';
  // Map shelf id to shelf and include a "Sans étagère" group
  const grouping = new Map();
  for(const s of shelves) grouping.set(s.id, {shelf: s, books: []});
  const noShelf = { id: null, name: 'Sans étagère' };
  grouping.set(null, {shelf: noShelf, books: []});
  for(const b of books){
    const g = grouping.get(b.shelfId === null ? null : b.shelfId);
    if(g) g.books.push(b);
    else grouping.get(null).books.push(b);
  }

  // Render each group
  for(const [id, group] of grouping){
    const h = document.createElement('h3'); h.textContent = group.shelf.name; booksByShelf.appendChild(h);
    if(group.books.length === 0){ const p = document.createElement('p'); p.textContent = 'Aucun livre'; p.className='muted'; booksByShelf.appendChild(p); continue; }
    for(const b of group.books.slice().reverse()){
      const div = document.createElement('div'); div.className='book';
      const title = document.createElement('h3'); title.textContent = b.title; div.appendChild(title);
      const author = document.createElement('p'); author.textContent = b.author ? `Auteur: ${b.author}` : 'Auteur: —'; div.appendChild(author);
      booksByShelf.appendChild(div);
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
    li.innerHTML = `<strong>${s.name}</strong><div class="muted">${new Date(s.createdAt).toLocaleDateString()}</div>`;
    li.addEventListener('click', ()=>{ panelTitle.textContent = s.name; loadAndRender(s.id); });
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
    // render only selected shelf
    const groupShelf = shelves.find(s=>s.id===filterShelfId) || {id:null,name:'Sans étagère'};
    booksByShelf.innerHTML = '';
    const h = document.createElement('h3'); h.textContent = groupShelf.name; booksByShelf.appendChild(h);
    const filtered = books.filter(b => (b.shelfId||null) === filterShelfId);
    if(filtered.length===0){ const p = document.createElement('p'); p.textContent='Aucun livre'; p.className='muted'; booksByShelf.appendChild(p); return; }
    for(const b of filtered.slice().reverse()){
      const div = document.createElement('div'); div.className='book';
      const title = document.createElement('h3'); title.textContent = b.title; div.appendChild(title);
      const author = document.createElement('p'); author.textContent = b.author ? `Auteur: ${b.author}` : 'Auteur: —'; div.appendChild(author);
      booksByShelf.appendChild(div);
    }
  }
}

async function init(){
  await loadAndRender();
}

init().catch(console.error);

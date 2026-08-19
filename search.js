// search.js — simple client-side search over title, author and ISBN with delete
import { Storage } from './storage.js';

const q = document.getElementById('q');
const results = document.getElementById('searchResults');

function createBookElement(b, shelves){
  const div = document.createElement('div'); div.className = 'book';
  const title = document.createElement('h3'); title.textContent = b.title; div.appendChild(title);
  const author = document.createElement('p'); author.textContent = b.author ? `Auteur: ${b.author}` : 'Auteur: —'; div.appendChild(author);
  const shelfName = b.shelfId ? (shelves.find(s=>s.id===b.shelfId)?.name || 'Inconnue') : 'Sans étagère';
  const p = document.createElement('p'); p.textContent = `Étagère: ${shelfName}`; div.appendChild(p);
  const controls = document.createElement('div'); controls.className='inline-controls';
  const del = document.createElement('button'); del.className='secondary'; del.textContent='Supprimer';
  del.addEventListener('click', async ()=>{
    if(!confirm('Supprimer ce livre ?')) return;
    await Storage.deleteBook(b.id);
    await doSearch();
  });
  controls.appendChild(del);
  div.appendChild(controls);
  return div;
}

function renderResults(items, shelves){
  results.innerHTML = '';
  if(items.length === 0){ results.textContent = 'Aucun résultat.'; return; }
  for(const b of items){
    results.appendChild(createBookElement(b, shelves));
  }
}

let shelvesCache = [];
async function loadShelves(){ shelvesCache = await Storage.getShelves(); }

async function doSearch(){
  const qv = (q.value||'').trim().toLowerCase();
  const books = await Storage.getBooks();
  if(!qv) return renderResults([], shelvesCache);
  const filtered = books.filter(b => (b.title||'').toLowerCase().includes(qv) || (b.author||'').toLowerCase().includes(qv) || (b.id||'').toLowerCase() === qv || (b.isbn||'').toLowerCase() === qv);
  renderResults(filtered, shelvesCache);
}

q.addEventListener('input', ()=>{ doSearch().catch(console.error); });

// init
loadShelves().catch(console.error);

// search.js — simple client-side search over title and author
import { LocalStorageAdapter as Storage } from './storage-local.js';

const q = document.getElementById('q');
const results = document.getElementById('searchResults');

function renderResults(items, shelves){
  results.innerHTML = '';
  if(items.length === 0){ results.textContent = 'Aucun résultat.'; return; }
  const shelfById = new Map(shelves.map(s=>[s.id,s]));
  for(const b of items){
    const div = document.createElement('div'); div.className = 'book';
    const title = document.createElement('h3'); title.textContent = b.title; div.appendChild(title);
    const author = document.createElement('p'); author.textContent = b.author ? `Auteur: ${b.author}` : 'Auteur: —'; div.appendChild(author);
    const shelfName = b.shelfId ? (shelfById.get(b.shelfId)?.name || 'Inconnue') : 'Sans étagère';
    const p = document.createElement('p'); p.textContent = `Étagère: ${shelfName}`; div.appendChild(p);
    results.appendChild(div);
  }
}

let shelvesCache = [];
async function loadShelves(){ shelvesCache = await Storage.getShelves(); }

async function doSearch(){
  const qv = (q.value||'').trim().toLowerCase();
  const books = await Storage.getBooks();
  if(!qv) return renderResults([], shelvesCache);
  const filtered = books.filter(b => (b.title||'').toLowerCase().includes(qv) || (b.author||'').toLowerCase().includes(qv));
  renderResults(filtered, shelvesCache);
}

q.addEventListener('input', ()=>{ doSearch().catch(console.error); });

// init
loadShelves().catch(console.error);

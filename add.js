// add.js — page-specific logic for add.html (with ISBN lookup and scanner)
import { Storage } from './storage.js';

const dom = {
  isbn: document.getElementById('isbn'),
  fetchIsbnBtn: document.getElementById('fetchIsbn'),
  scanBtn: document.getElementById('scanBtn'),
  scannerContainer: document.getElementById('scannerContainer'),
  scannerVideo: document.getElementById('scannerVideo'),
  stopScanBtn: document.getElementById('stopScan'),
  shelfSelect: document.getElementById('shelfSelect'),
  createShelfBtn: document.getElementById('createShelfBtn'),
  newShelfContainer: document.getElementById('newShelfContainer'),
  newShelfName: document.getElementById('newShelfName'),
  addNewShelf: document.getElementById('addNewShelf'),
  cancelNewShelf: document.getElementById('cancelNewShelf'),
  addBookForm: document.getElementById('addBookForm'),
  clearBtn: document.getElementById('clearBtn')
};

let _scannerStream = null;
let _scannerInterval = null;
let _barcodeDetector = null;

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

// ISBN lookup using OpenLibrary
async function lookupISBN(isbn){
  const cleaned = (isbn||'').replace(/[^0-9Xx]/g,'');
  if(!cleaned) throw new Error('ISBN invalide');
  const url = `https://openlibrary.org/api/books?bibkeys=ISBN:${cleaned}&format=json&jscmd=data`;
  const res = await fetch(url);
  if(!res.ok) throw new Error('Erreur réseau lors de la recherche ISBN');
  const data = await res.json();
  const key = `ISBN:${cleaned}`;
  if(!data[key]) throw new Error('Aucun résultat trouvé pour cet ISBN');
  const book = data[key];
  const title = book.title || '';
  const authors = Array.isArray(book.authors) ? book.authors.map(a=>a.name).join(', ') : '';
  return { title, authors };
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

// ISBN button
dom.fetchIsbnBtn.addEventListener('click', async ()=>{
  const val = (dom.isbn.value||'').trim();
  if(!val) return alert('Veuillez saisir un ISBN');
  dom.fetchIsbnBtn.disabled = true;
  dom.fetchIsbnBtn.textContent = 'Recherche...';
  try{
    const info = await lookupISBN(val);
    if(info.title) document.getElementById('title').value = info.title;
    if(info.authors) document.getElementById('author').value = info.authors;
    alert('Données récupérées. Vérifiez et complétez si nécessaire.');
  }catch(err){
    alert(err.message || 'Recherche ISBN échouée');
  }finally{
    dom.fetchIsbnBtn.disabled = false;
    dom.fetchIsbnBtn.textContent = 'Chercher par ISBN';
  }
});

// Scanner logic using BarcodeDetector if available
async function startScanner(){
  if(!_barcodeDetector){
    // check support
    if('BarcodeDetector' in window){
      try{
        const supportedFormats = await BarcodeDetector.getSupportedFormats();
        _barcodeDetector = new BarcodeDetector({formats: supportedFormats});
      }catch(e){
        // ignore and fallback
        _barcodeDetector = null;
      }
    }
  }

  if(!_barcodeDetector){
    alert('Scanner non pris en charge par ce navigateur.');
    return;
  }

  try{
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
    _scannerStream = stream;
    dom.scannerVideo.srcObject = stream;
    dom.scannerContainer.classList.remove('hidden');
    dom.scanBtn.disabled = true;

    _scannerInterval = setInterval(async ()=>{
      try{
        const barcodes = await _barcodeDetector.detect(dom.scannerVideo);
        if(barcodes && barcodes.length){
          const code = barcodes[0].rawValue;
          if(code){
            dom.isbn.value = code;
            stopScanner();
            // try to lookup
            try{
              const info = await lookupISBN(code);
              if(info.title) document.getElementById('title').value = info.title;
              if(info.authors) document.getElementById('author').value = info.authors;
              alert('ISBN scanné et données pré-remplies.');
            }catch(err){
              alert('ISBN scanné: ' + code + ' (pas de métadonnées trouvées)');
            }
          }
        }
      }catch(err){
        // ignore detection errors
        // console.error(err);
      }
    }, 500);
  }catch(err){
    alert('Impossible d\'accéder à la caméra: ' + err.message);
    stopScanner();
  }
}

function stopScanner(){
  if(_scannerInterval){ clearInterval(_scannerInterval); _scannerInterval = null; }
  if(_scannerStream){
    _scannerStream.getTracks().forEach(t => t.stop());
    _scannerStream = null;
  }
  dom.scannerVideo.srcObject = null;
  dom.scannerContainer.classList.add('hidden');
  dom.scanBtn.disabled = false;
}

dom.scanBtn.addEventListener('click', ()=>{ startScanner().catch(err=>{ alert(err.message || 'Erreur scanner'); }); });
dom.stopScanBtn.addEventListener('click', ()=>{ stopScanner(); });

// submit new book (shelf required)
dom.addBookForm.addEventListener('submit', async (e)=>{
  e.preventDefault();
  const title = document.getElementById('title').value.trim();
  const author = document.getElementById('author').value.trim();
  const shelfId = dom.shelfSelect.value || null;
  const isbnVal = (dom.isbn.value||'').trim();

  if(!title){ alert('Le titre est requis'); return; }
  if(!shelfId){ alert("Veuillez sélectionner une étagère avant d'enregistrer."); return; }

  try{
    // include isbn if present by extending createBook signature later if desired
    await Storage.createBook({title,author,shelfId});
    dom.addBookForm.reset();
    dom.shelfSelect.value = '';
    alert('Livre ajouté');
  }catch(err){
    alert(err.message || 'Erreur lors de l\'enregistrement');
  }
});

// clear storage
dom.clearBtn && dom.clearBtn.addEventListener('click', async ()=>{
  if(!confirm('Cette action supprime les données stockées localement. Continuer ?')) return;
  await Storage.clear();
  await fetchShelves();
});

// init
fetchShelves().catch(console.error);

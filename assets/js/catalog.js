import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getFirestore, collection, query, orderBy, onSnapshot } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { getStorage, ref, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-storage.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

const $grid = document.getElementById('grid');
const $buscar = document.getElementById('buscar');
const $vacio = document.getElementById('vacio');

let productos = [];

function formatGs(n){
  if (typeof n !== 'number') return n;
  return new Intl.NumberFormat('es-PY', { style:'currency', currency:'PYG', maximumFractionDigits:0 }).format(n);
}

function render(lista){
  $grid.innerHTML = '';
  if (!lista.length){ $vacio.classList.remove('hidden'); return; }
  $vacio.classList.add('hidden');
  for (const p of lista){
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <img class="prod mb-3" src="${p.imageUrl || ''}" alt="${p.nombre || ''}" onerror="this.src='https://placehold.co/600x400?text=Sin+Foto'">
      <div class="flex items-center justify-between">
        <div class="font-bold">${p.nombre || '-'}</div>
        <div class="price-pill">${formatGs(p.precio ?? 0)}</div>
      </div>
    `;
    $grid.appendChild(card);
  }
}

$buscar.addEventListener('input', e => {
  const q = e.target.value.toLowerCase().trim();
  const filtered = productos.filter(p => (p.nombre||'').toLowerCase().includes(q));
  render(filtered);
});

const qRef = query(collection(db, 'productos'), orderBy('nombre'));
onSnapshot(qRef, snap => {
  productos = snap.docs.map(d => ({ id:d.id, ...d.data() }));
  render(productos);
});

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getFirestore, collection, addDoc, doc, updateDoc, deleteDoc, onSnapshot, serverTimestamp, query, orderBy } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-storage.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// UI refs
const secLogin = document.getElementById('secLogin');
const secPanel = document.getElementById('secPanel');
const btnLogout = document.getElementById('btnLogout');

const formLogin = document.getElementById('formLogin');
const email = document.getElementById('email');
const pass = document.getElementById('pass');

const formProd = document.getElementById('formProd');
const docId = document.getElementById('docId');
const foto = document.getElementById('foto');
const nombre = document.getElementById('nombre');
const costo = document.getElementById('costo');
const porcentaje = document.getElementById('porcentaje');
const precio = document.getElementById('precio');
const chkManual = document.getElementById('chkManual');
const cantidad_caja = document.getElementById('cantidad_caja');
const uni_por_caja = document.getElementById('uni_por_caja');
const cantidad_unitario = document.getElementById('cantidad_unitario');
const btnReset = document.getElementById('btnReset');
const btnDelete = document.getElementById('btnDelete');
const msg = document.getElementById('msg');
const buscarAdmin = document.getElementById('buscarAdmin');
const lista = document.getElementById('lista');

function gs(n){
  if (typeof n !== 'number') return n;
  return new Intl.NumberFormat('es-PY', { style:'currency', currency:'PYG', maximumFractionDigits:0 }).format(n);
}

function compute(){
  const c = parseFloat(costo.value||'0');
  const p = parseFloat(porcentaje.value||'0');
  if (!chkManual.checked){
    const calc = c * (1 + (p/100));
    precio.value = isFinite(calc) ? calc.toFixed(0) : '';
  }
  const cc = parseInt(cantidad_caja.value||'0', 10);
  const upc = parseInt(uni_por_caja.value||'0', 10);
  const cu = cc * upc;
  cantidad_unitario.value = isFinite(cu) ? String(cu) : '';
}

[costo, porcentaje, cantidad_caja, uni_por_caja].forEach(i => i.addEventListener('input', compute));
chkManual.addEventListener('change', () => {
  precio.disabled = !chkManual.checked;
  compute();
});

onAuthStateChanged(auth, user => {
  const logged = !!user;
  secLogin.classList.toggle('hidden', logged);
  secPanel.classList.toggle('hidden', !logged);
  btnLogout.classList.toggle('hidden', !logged);
});

formLogin.addEventListener('submit', async (e) => {
  e.preventDefault();
  try{
    await signInWithEmailAndPassword(auth, email.value, pass.value);
  }catch(err){
    alert('Error de login: ' + err.message);
  }
});

btnLogout.addEventListener('click', async () => {
  await signOut(auth);
});

function clearForm(){
  formProd.reset();
  docId.value = '';
  cantidad_unitario.value = '';
  precio.disabled = !chkManual.checked;
  btnDelete.classList.add('hidden');
  msg.textContent = '';
}

btnReset.addEventListener('click', clearForm);

formProd.addEventListener('submit', async (e) => {
  e.preventDefault();
  msg.textContent = 'Guardando...';
  try{
    const data = {
      nombre: nombre.value.trim(),
      costo: parseFloat(costo.value||'0'),
      porcentaje: parseFloat(porcentaje.value||'0'),
      precio: parseFloat(precio.value||'0'),
      cantidad_caja: parseInt(cantidad_caja.value||'0',10),
      uni_por_caja: parseInt(uni_por_caja.value||'0',10),
      cantidad_unitario: parseInt(cantidad_unitario.value||'0',10),
      updatedAt: serverTimestamp(),
    };

    if (!data.nombre){ alert('Nombre es requerido'); return; }

    let refDoc;
    if (docId.value){
      refDoc = doc(db, 'productos', docId.value);
      await updateDoc(refDoc, data);
    }else{
      data.createdAt = serverTimestamp();
      refDoc = await addDoc(collection(db, 'productos'), data);
      docId.value = refDoc.id;
    }

    // Si hay foto: subimos y guardamos URL
    if (foto.files[0]){
      const path = `productos/${refDoc.id}-${Date.now()}`;
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, foto.files[0]);
      const url = await getDownloadURL(storageRef);
      await updateDoc(refDoc, { imageUrl:url, imagePath:path });
    }

    msg.textContent = '✅ Guardado';
  }catch(err){
    console.error(err);
    msg.textContent = '❌ Error: ' + err.message;
  }
});

// Lista realtime
let cache = [];
function render(list){
  lista.innerHTML = '';
  for (const p of list){
    const row = document.createElement('div');
    row.className = 'py-3 flex items-center gap-3';
    row.innerHTML = `
      <img src="${p.imageUrl || 'https://placehold.co/96x64?text=Sin+Foto'}" class="w-16 h-16 object-cover rounded border border-white/10">
      <div class="flex-1">
        <div class="font-semibold">${p.nombre || '-'}</div>
        <div class="text-sm text-slate-400">Costo: ${gs(p.costo||0)} · %: ${p.porcentaje||0} · Precio: <strong>${gs(p.precio||0)}</strong></div>
        <div class="text-xs text-slate-500">Caja: ${p.cantidad_caja||0} · Uni/Caja: ${p.uni_por_caja||0} · Unitaria: ${p.cantidad_unitario||0}</div>
      </div>
      <div class="flex items-center gap-2">
        <button class="btn bg-white/10 hover:bg-white/20" data-edit="${p.id}">Editar</button>
        <button class="btn bg-red-600/80 hover:bg-red-600" data-del="${p.id}">Borrar</button>
      </div>
    `;
    lista.appendChild(row);
  }
}

buscarAdmin.addEventListener('input', e => {
  const q = e.target.value.toLowerCase().trim();
  const filtered = cache.filter(p => (p.nombre||'').toLowerCase().includes(q));
  render(filtered);
});

const qRef = query(collection(db, 'productos'), orderBy('nombre'));
onSnapshot(qRef, snap => {
  cache = snap.docs.map(d => ({ id:d.id, ...d.data() }));
  render(cache);
});

// Delegación de eventos (editar / borrar)
lista.addEventListener('click', async (e) => {
  const t = e.target;
  if (t.dataset.edit){
    const p = cache.find(x => x.id === t.dataset.edit);
    if (!p) return;
    docId.value = p.id;
    nombre.value = p.nombre || '';
    costo.value = p.costo ?? '';
    porcentaje.value = p.porcentaje ?? '';
    precio.value = p.precio ?? '';
    cantidad_caja.value = p.cantidad_caja ?? '';
    uni_por_caja.value = p.uni_por_caja ?? '';
    cantidad_unitario.value = p.cantidad_unitario ?? '';
    chkManual.checked = false; // por defecto auto
    precio.disabled = true;
    btnDelete.classList.remove('hidden');
    msg.textContent = 'Editando...';
  }
  if (t.dataset.del){
    if (!confirm('¿Eliminar este producto?')) return;
    const id = t.dataset.del;
    const p = cache.find(x => x.id === id);
    try{
      // Borra imagen si existe
      if (p?.imagePath){
        try{
          await deleteObject(ref(storage, p.imagePath));
        }catch{}
      }
      await deleteDoc(doc(db, 'productos', id));
      if (docId.value === id) clearForm();
    }catch(err){
      alert('Error al borrar: '+ err.message);
    }
  }
});

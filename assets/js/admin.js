import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-storage.js";
import { firebaseConfig } from "./firebase-config.js";

// Init
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// UI refs
const secLogin = document.getElementById("secLogin");
const secAdmin = document.getElementById("secAdmin");
const btnLogin = document.getElementById("btnLogin");
const btnSalir = document.getElementById("btnSalir");

const email = document.getElementById("email");
const pass = document.getElementById("pass");

const frm = document.getElementById("frmProducto");
const id = document.getElementById("id");
const nombre = document.getElementById("nombre");
const codigo_barra = document.getElementById("codigo_barra");
const uni_caja = document.getElementById("uni_caja");
const cantidad_caja = document.getElementById("cantidad_caja");
const costo_caja = document.getElementById("costo_caja");
const porcen = document.getElementById("porcen");
const costo_unit = document.getElementById("costo_unit");
const precio_venta = document.getElementById("precio_venta");
const foto = document.getElementById("foto");

const lista = document.getElementById("lista");
const cant = document.getElementById("cant");

function show(el, yes){ el?.classList.toggle("hidden", !yes); }

// Cálculo automático
function calc() {
  const uc = Math.max(parseFloat(uni_caja.value || "1"), 1);
  const cc = Math.max(parseFloat(costo_caja.value || "0"), 0);
  const p = Math.max(parseFloat(porcen.value || "0"), 0);
  const cu = uc ? (cc / uc) : 0;
  const pv = cu * (1 + p/100);
  costo_unit.value = cu.toFixed(2);
  precio_venta.value = pv.toFixed(2);
}
[uni_caja, costo_caja, porcen].forEach((x)=> x.addEventListener("input", calc));
calc();

// Auth state
onAuthStateChanged(auth, (user) => {
  const ok = !!user;
  show(secLogin, !ok);
  show(secAdmin, ok);
  if (!ok) {
    // Limpia formulario
    frm.reset();
    id.value = "";
    calc();
  }
});

// Login
btnLogin?.addEventListener("click", async () => {
  try {
    await signInWithEmailAndPassword(auth, email.value, pass.value);
  } catch (e) {
    alert("No se pudo iniciar sesión: " + e.message);
  }
});

// Salir (logout manual)
btnSalir?.addEventListener("click", async () => {
  try {
    await signOut(auth);
  } catch (e) {}
  location.href = "./index.html";
});

// Auto-cerrar sesión al salir de admin (mejor esfuerzo)
window.addEventListener("pagehide", async () => {
  if (auth.currentUser) {
    try { await signOut(auth); } catch(e) {}
  }
});

// Solo permitir acceso si está logueado
if (location.pathname.endsWith("admin.html")) {
  onAuthStateChanged(auth, (user) => {
    if (!user) {
      show(secLogin, true);
      show(secAdmin, false);
    }
  });
}

// Realtime lista
const colRef = collection(db, "productos");
onSnapshot(colRef, (snap) => {
  const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  cant.textContent = data.length;
  renderLista(data);
});

function card(p) {
  const img = p.fotoURL || "";
  return `
  <article class="card p-3">
    <div class="aspect-square rounded-xl overflow-hidden bg-slate-800 border border-white/10 mb-2">
      ${img ? `<img src="${img}" class="w-full h-full object-cover">` : `<div class="w-full h-full grid place-items-center text-slate-500">Sin foto</div>`}
    </div>
    <div class="text-sm">
      <h3 class="font-bold">${p.nombre || ""}</h3>
      <div class="text-slate-400">Gs ${Number(p.precio_venta||0).toLocaleString("es-PY")}</div>
      <div class="text-xs text-slate-500">Stock: ${Number(p.cantidad_uni||0)} un.</div>
    </div>
    <div class="mt-2 grid grid-cols-2 gap-2">
      <button class="btn text-xs justify-center" data-edit="${p.id}">Editar</button>
      <button class="btn text-xs justify-center" data-del="${p.id}">Borrar</button>
    </div>
  </article>`;
}

function renderLista(arr) {
  lista.innerHTML = arr.map(card).join("");
}

// Click en lista (delegación)
lista?.addEventListener("click", async (e) => {
  const t = e.target;
  const idEdit = t.getAttribute("data-edit");
  const idDel = t.getAttribute("data-del");
  if (idEdit) {
    // Cargar doc en formulario
    const docData = (await getDocs(colRef)).docs.find(d => d.id === idEdit)?.data() || {};
    id.value = idEdit;
    nombre.value = docData.nombre||"";
    codigo_barra.value = docData.codigo_barra||"";
    uni_caja.value = docData.uni_caja||1;
    cantidad_caja.value = docData.cantidad_caja||0;
    costo_caja.value = docData.costo_caja||0;
    porcen.value = docData.porcen||0;
    calc();
    window.scrollTo({top:0, behavior:"smooth"});
  }
  if (idDel) {
    if (confirm("¿Borrar producto?")) {
      await deleteDoc(doc(db, "productos", idDel));
    }
  }
});

// Nuevo
document.getElementById("btnNuevo")?.addEventListener("click", () => {
  frm.reset(); id.value=""; calc();
});

// Guardar
frm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const uc = Math.max(parseFloat(uni_caja.value || "1"), 1);
  const cc = Math.max(parseFloat(costo_caja.value || "0"), 0);
  const p  = Math.max(parseFloat(porcen.value || "0"), 0);
  const cu = uc ? (cc / uc) : 0;
  const pv = cu * (1 + p/100);
  const cantCaja = Math.max(parseFloat(cantidad_caja.value||"0"),0);
  const cantUni = Math.round(cantCaja * uc);

  const payload = {
    nombre: nombre.value.trim(),
    codigo_barra: codigo_barra.value.trim(),
    uni_caja: uc,
    cantidad_caja: cantCaja,
    cantidad_uni: cantUni,
    costo_caja: cc,
    costo_unit: Number(cu.toFixed(2)),
    porcen: p,
    precio_venta: Number(pv.toFixed(2)),
    actualizado: serverTimestamp(),
  };

  try {
    let docRef;
    if (id.value) {
      docRef = doc(db, "productos", id.value);
      await updateDoc(docRef, payload);
    } else {
      docRef = await addDoc(colRef, payload);
      id.value = docRef.id;
    }

    // Subir foto si hay
    if (foto.files && foto.files[0]) {
      const f = foto.files[0];
      const r = ref(storage, `productos/${id.value}`);
      await uploadBytes(r, f);
      const url = await getDownloadURL(r);
      await updateDoc(doc(db, "productos", id.value), { fotoURL: url });
    }

    alert("Guardado");
    frm.reset(); id.value=""; calc();
  } catch (e) {
    alert("Error al guardar: " + e.message);
  }
});

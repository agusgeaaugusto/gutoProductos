import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getFirestore,
  collection,
  query,
  orderBy,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const $buscar = document.getElementById("buscar");
const $grid = document.getElementById("grid");
const $vacio = document.getElementById("vacio");

let productos = [];

function card(p) {
  const img = p.fotoURL || "";
  const precioPY = Number(p.precio_venta || 0).toLocaleString("es-PY");
  return `
  <article class="card overflow-hidden">
    <div class="aspect-square bg-slate-800 border border-white/10">
      ${img ? `<img src="${img}" class="w-full h-full object-cover" loading="lazy">` : ""}
    </div>
    <div class="p-3 text-sm">
      <h3 class="font-bold leading-tight">${p.nombre || ""}</h3>
      <div class="text-slate-400">Gs ${precioPY}</div>
      <div class="text-xs text-slate-500 mt-1">Stock: ${Number(p.cantidad_uni||0)} un.</div>
    </div>
  </article>`;
}

function render(arr) {
  $grid.innerHTML = arr.map(card).join("");
  $vacio.classList.toggle("hidden", arr.length > 0);
}

$buscar?.addEventListener("input", (e) => {
  const q = e.target.value.toLowerCase().trim();
  const filtered = productos.filter((p) => (p.nombre || "").toLowerCase().includes(q));
  render(filtered);
});

const qRef = query(collection(db, "productos"), orderBy("nombre"));
onSnapshot(qRef, (snap) => {
  productos = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  render(productos);
});

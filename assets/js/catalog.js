import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getFirestore,
  collection,
  query,
  orderBy,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import {
  getStorage,
  ref,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-storage.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

const $grid = document.getElementById("grid");
const $buscar = document.getElementById("buscar");
const $vacio = document.getElementById("vacio");

// 🔔 CAMBIÁ ESTE NÚMERO POR EL TUYO (formato internacional sin +)
const WHATSAPP_PHONE = "595985676607"; // ejemplo Paraguay

let productos = [];

function formatGs(n) {
  const num = parseFloat(n);
  if (isNaN(num)) return "-";
  return num.toLocaleString("es-PY") + " Gs";
}

function createCard(p) {
  const card = document.createElement("div");
  card.className =
    "card bg-slate-900/80 border border-white/10 rounded-2xl p-3 flex flex-col gap-2";

  const img = document.createElement("img");
  img.className = "w-full h-40 object-cover rounded-xl mb-2 bg-black/40";
  img.alt = p.nombre || "";

  if (p.imageUrl) {
    img.src = p.imageUrl;
  } else if (p.imagePath) {
    // si solo guardaste imagePath
    getDownloadURL(ref(storage, p.imagePath))
      .then((url) => (img.src = url))
      .catch(() => {
        img.src = "./assets/img/placeholder.png";
      });
  } else {
    img.src = "./assets/img/placeholder.png";
  }

  const title = document.createElement("div");
  title.className = "font-semibold text-sm text-slate-50";
  title.textContent = p.nombre || "Sin nombre";

  const desc = document.createElement("div");
  desc.className = "text-[11px] text-slate-400 min-h-[24px]";
  desc.textContent = p.descripcion || "";

  const meta = document.createElement("div");
  meta.className = "flex items-center justify-between text-[11px] text-slate-400";
  const precio = p.precio ? formatGs(p.precio) : "-";
  const stockTxt =
    typeof p.stock === "number"
      ? (p.stock > 0 ? `Stock: ${p.stock}` : "Sin stock")
      : "";
  meta.innerHTML = `<span>${precio}</span><span>${stockTxt}</span>`;

  const qty = document.createElement("input");
  qty.type = "number";
  qty.min = "1";
  qty.placeholder = "Cantidad";
  qty.className =
    "mt-1 w-full px-2 py-1 text-xs bg-slate-900/80 border border-white/15 rounded-lg text-slate-100";

  const btn = document.createElement("button");
  btn.textContent = "Pedir por WhatsApp";
  btn.className =
    "mt-2 w-full px-3 py-1.5 text-xs rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold";

  btn.addEventListener("click", () => {
    const cantidad = parseInt(qty.value || "0", 10);

    if (!cantidad || cantidad <= 0) {
      alert("Ingresá una cantidad válida.");
      return;
    }

    if (typeof p.stock === "number" && cantidad > p.stock) {
      alert(`No hay stock suficiente. Disponible: ${p.stock}`);
      return;
    }

    const precioUnit = parseFloat(p.precio || "0") || 0;
    const total = precioUnit * cantidad;

    const mensaje = `
Hola, quiero hacer un pedido:

Producto: ${p.nombre || "-"}
Cantidad: ${cantidad}
Precio unitario: ${precio ? precio : "-"}
Total aprox: ${total ? formatGs(total) : "-"}

Enviado desde el catálogo Guto.
`.trim();

    const url = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(
      mensaje
    )}`;
    window.open(url, "_blank");
  });

  card.append(img, title, desc, meta, qty, btn);
  return card;
}

function render(list) {
  $grid.innerHTML = "";

  if (!list.length) {
    $vacio.classList.remove("hidden");
    return;
  }

  $vacio.classList.add("hidden");

  list.forEach((p) => {
    $grid.appendChild(createCard(p));
  });
}

// Buscar
$buscar?.addEventListener("input", (e) => {
  const q = e.target.value.toLowerCase().trim();
  const filtered = productos.filter((p) =>
    (p.nombre || "").toLowerCase().includes(q)
  );
  render(filtered);
});

// Realtime productos
const qRef = query(collection(db, "productos"), orderBy("nombre"));
onSnapshot(qRef, (snap) => {
  productos = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  render(productos);
});

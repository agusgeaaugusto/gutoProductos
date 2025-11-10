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
  getDoc,
  onSnapshot,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-storage.js";
import { firebaseConfig } from "./firebase-config.js";

// Init
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Secciones
const secLogin = document.getElementById("secLogin");
const secPanel = document.getElementById("secPanel");
const btnLogout = document.getElementById("btnLogout");

// Login
const formLogin = document.getElementById("formLogin");
const emailInput = document.getElementById("emailLogin");
const passInput = document.getElementById("passLogin");

// Form producto
const formProducto = document.getElementById("formProducto");
const docId = document.getElementById("docId");
const nombre = document.getElementById("nombre");
const descripcion = document.getElementById("descripcion");
const precio = document.getElementById("precio");
const stock = document.getElementById("stock");
const fileImagen = document.getElementById("fileImagen");

// Lista
const $lista = document.getElementById("lista");
const $buscarAdmin = document.getElementById("buscarAdmin");

let productosCache = [];

// ---------- AUTH ----------
onAuthStateChanged(auth, (user) => {
  if (user) {
    secLogin.classList.add("hidden");
    secPanel.classList.remove("hidden");
  } else {
    secPanel.classList.add("hidden");
    secLogin.classList.remove("hidden");
  }
});

formLogin?.addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    await signInWithEmailAndPassword(auth, emailInput.value.trim(), passInput.value.trim());
  } catch (err) {
    alert("Error de login: " + err.message);
  }
});

btnLogout?.addEventListener("click", async () => {
  await signOut(auth);
});

// ---------- UTIL ----------
function sanitizeNumber(v) {
  const n = parseFloat(v);
  return isNaN(n) ? 0 : n;
}

function renderLista(data) {
  $lista.innerHTML = "";
  data.forEach((p) => {
    const row = document.createElement("div");
    row.className = "py-2 flex items-center gap-3";

    const thumb = document.createElement("img");
    thumb.src = p.imageUrl || "./assets/img/placeholder.png";
    thumb.alt = p.nombre || "";
    thumb.className = "w-12 h-12 rounded object-cover border border-white/10";

    const info = document.createElement("div");
    info.className = "flex-1";
    info.innerHTML = `
      <div class="font-semibold text-sm">${p.nombre || ""}</div>
      <div class="text-xs text-slate-400">
        Precio: ${p.precio ? p.precio.toLocaleString("es-PY") + " Gs" : "-"} —
        Stock: ${typeof p.stock === "number" ? p.stock : "-"}
      </div>
    `;

    const btns = document.createElement("div");
    btns.className = "flex gap-2";

    const btnEdit = document.createElement("button");
    btnEdit.textContent = "Editar";
    btnEdit.className =
      "px-2 py-1 text-xs rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30";
    btnEdit.onclick = () => loadProducto(p.id);

    const btnDel = document.createElement("button");
    btnDel.textContent = "Borrar";
    btnDel.className =
      "px-2 py-1 text-xs rounded bg-red-500/20 text-red-300 border border-red-500/40 hover:bg-red-500/30";
    btnDel.onclick = () => borrarProducto(p);

    btns.append(btnEdit, btnDel);
    row.append(thumb, info, btns);
    $lista.appendChild(row);
  });

  if (!data.length) {
    $lista.innerHTML =
      '<div class="py-4 text-sm text-slate-500">Sin productos cargados.</div>';
  }
}

function clearForm() {
  docId.value = "";
  nombre.value = "";
  descripcion.value = "";
  precio.value = "";
  stock.value = "";
  if (fileImagen) fileImagen.value = "";
}

// ---------- CRUD PRODUCTO ----------
formProducto?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const id = docId.value.trim();
  const data = {
    nombre: nombre.value.trim(),
    descripcion: descripcion.value.trim(),
    precio: sanitizeNumber(precio.value),
    stock: parseInt(stock.value || "0", 10),
    updatedAt: new Date(),
  };

  if (!data.nombre) {
    alert("Ingresá un nombre.");
    return;
  }

  // Archivo de imagen (si se seleccionó)
  const file = fileImagen?.files?.[0] || null;

  try {
    let imagePath = null;
    let oldImagePath = null;

    if (id) {
      const snap = await getDoc(doc(db, "productos", id));
      if (snap.exists()) {
        const p = snap.data();
        oldImagePath = p.imagePath || null;
      }
    }

    if (file) {
      // si hay imagen nueva, subimos
      imagePath = `productos/${Date.now()}_${file.name}`;
      const storageRef = ref(storage, imagePath);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      data.imageUrl = url;
      data.imagePath = imagePath;

      // si había imagen anterior, borramos
      if (oldImagePath) {
        try {
          await deleteObject(ref(storage, oldImagePath));
        } catch {}
      }
    }

    if (!id) {
      await addDoc(collection(db, "productos"), {
        ...data,
        createdAt: new Date(),
      });
    } else {
      await updateDoc(doc(db, "productos", id), data);
    }

    clearForm();
    alert("Producto guardado correctamente.");
  } catch (err) {
    console.error(err);
    alert("Error al guardar: " + err.message);
  }
});

// Cargar para editar
async function loadProducto(id) {
  try {
    const snap = await getDoc(doc(db, "productos", id));
    if (!snap.exists()) return;
    const p = snap.data();
    docId.value = id;
    nombre.value = p.nombre || "";
    descripcion.value = p.descripcion || "";
    precio.value = p.precio || "";
    stock.value = p.stock ?? "";
    if (fileImagen) fileImagen.value = "";
    window.scrollTo({ top: 0, behavior: "smooth" });
  } catch (err) {
    alert("Error al cargar: " + err.message);
  }
}

// Borrar
async function borrarProducto(p) {
  if (!confirm(`¿Borrar "${p.nombre}"?`)) return;
  try {
    if (p.imagePath) {
      try {
        await deleteObject(ref(storage, p.imagePath));
      } catch {}
    }
    await deleteDoc(doc(db, "productos", p.id));
    if (docId.value === p.id) clearForm();
  } catch (err) {
    alert("Error al borrar: " + err.message);
  }
}

// ---------- LISTA REALTIME ----------
const qRef = query(collection(db, "productos"), orderBy("nombre"));
onSnapshot(qRef, (snap) => {
  productosCache = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  renderLista(productosCache);
});

// Buscador admin
$buscarAdmin?.addEventListener("input", (e) => {
  const q = e.target.value.toLowerCase().trim();
  const filtered = productosCache.filter((p) =>
    (p.nombre || "").toLowerCase().includes(q)
  );
  renderLista(filtered);
});

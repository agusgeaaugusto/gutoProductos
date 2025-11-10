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

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// ELEMENTOS
const secLogin   = document.getElementById("secLogin");
const secPanel   = document.getElementById("secPanel");
const btnLogout  = document.getElementById("btnLogout");
const formLogin  = document.getElementById("formLogin");
const emailInput = document.getElementById("emailLogin");
const passInput  = document.getElementById("passLogin");

// Login seguro (sin romper si falta algo)
if (formLogin && emailInput && passInput) {
  formLogin.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = emailInput.value.trim();
    const pass = passInput.value.trim();

    if (!email || !pass) {
      alert("Ingresá correo y contraseña.");
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (err) {
      console.error(err);
      alert("Error de login: " + err.message);
    }
  });
}

// Logout
if (btnLogout) {
  btnLogout.addEventListener("click", async () => {
    await signOut(auth);
  });
}

// Mostrar/ocultar secciones según sesión
onAuthStateChanged(auth, (user) => {
  if (!secLogin || !secPanel) return;

  if (user) {
    secLogin.classList.add("hidden");
    secPanel.classList.remove("hidden");
  } else {
    secPanel.classList.add("hidden");
    secLogin.classList.remove("hidden");
  }
});

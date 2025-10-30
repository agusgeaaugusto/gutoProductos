# Guto Productos — Firebase Realtime App

App web lista para GitHub Pages con **catálogo público** y **panel admin** con login.
Guarda productos en **Firebase Firestore**, fotos en **Firebase Storage** y muestra
los cambios **en tiempo real**.

## Estructura
- `index.html` — Catálogo público (grid moderno con foto, nombre y precio).
- `admin.html` — Login + formulario para agregar/editar productos.
- `assets/js/firebase-config.js` — **Rellena aquí tu configuración de Firebase**.
- `assets/js/catalog.js` — Lógica del catálogo (lectura en tiempo real).
- `assets/js/admin.js` — Lógica de admin (auth, CRUD, uploads).
- `assets/css/styles.css` — Estilos extra (además de Tailwind CDN).

## Campos del producto
- `nombre` (string)
- `costo` (number)
- `porcentaje` (number) — markup, ej. 30 = +30%
- `precio` (number) — se calcula automático como `costo * (1 + porcentaje/100)`,
  pero **puede editarse manualmente** si marcas “Editar precio manual”.
- `cantidad_caja` (number)
- `uni_por_caja` (number) — unidades que vienen en cada caja
- `cantidad_unitario` (number) — calculado automático `cantidad_caja * uni_por_caja`
- `imageUrl` (string) — URL pública de la foto (Storage)
- `imagePath` (string) — ruta interna en Storage
- `createdAt`, `updatedAt` (timestamps)

## Requisitos
- Firebase requiere contraseñas de **6+ caracteres**. Propuse `guto@demo.local / 123456`.
  Si quieres “123”, puedes dejar esa UI en pantalla, pero **Auth de Firebase** pedirá 6+.
- Habilita en tu proyecto Firebase:
  - Authentication (Email/Password)
  - Firestore Database (modo producción, reglas por defecto)
  - Storage (reglas por defecto)

## Pasos de configuración
1) Crea un proyecto en [Firebase Console].
2) Ve a **Project settings → Your apps → Web** y copia tu `firebaseConfig`.
3) Abre `assets/js/firebase-config.js` y pega tu config en el objeto `firebaseConfig`.
4) En **Authentication → Sign-in method** habilita **Email/Password**.
5) En **Users**, crea el usuario admin (por ejemplo `guto@demo.local` con clave `123456`).

## Despliegue en GitHub Pages
1) Crea un repositorio y sube todos estos archivos al **branch `main`**.
2) En GitHub: **Settings → Pages → Deploy from a branch → main / root**.
3) La URL pública será `https://tuusuario.github.io/tu-repo/`.
4) Prueba: abre `index.html` y `admin.html` desde esa URL.

## Seguridad
- `admin.html` requiere login. Cierra sesión con el botón “Salir”.
- No guardamos secretos en el front (Firebase usa config pública por diseño).
- Opcional: restringe reglas de Firestore/Storage para que **solo usuarios autenticados** puedan escribir.
  Catalogo `index.html` solo **lee**.

¡Listo! Disfruta y adapta el diseño/funciones a tu gusto.

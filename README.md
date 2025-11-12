# Guto Productos

Catálogo en `index.html` (primera pantalla) y panel `admin.html` para agregar/editar. 
Admin usa Firebase Auth + Firestore + Storage.

## Campos guardados
- `nombre`, `codigo_barra`
- `uni_caja`, `cantidad_caja`, `cantidad_uni` (auto = uni_caja * cantidad_caja)
- `costo_caja`, `costo_unit` (auto = costo_caja / uni_caja)
- `porcen` (% de ganancia), `precio_venta` (auto = costo_unit * (1 + porcen/100))
- `fotoURL` (opcional)

## Cómo funciona el cierre de sesión
- Botón **Salir** en `admin.html` cierra sesión y vuelve a `index.html`.
- Además, al **salir de la página** admin intenta cerrar sesión automáticamente.

> Recordatorio: Configura reglas de Firestore/Storage para que **solo usuarios autenticados** puedan escribir.

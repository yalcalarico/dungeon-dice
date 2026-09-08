# Área: Renderizado y mundo

## Objetivo

Crear una cripta procedural voxel-ish con iluminación atmosférica, suelo húmedo y comportamientos ambientales sin descargar assets.

## Dirección visual

- Geometría modular low-poly.
- Paleta de piedra, musgo, bronce y luz cálida.
- Sombras suaves y niebla.
- Materiales compartidos siempre que sea posible.
- Suelo mojado mediante roughness, clearcoat, variación procedural y reflejos de coste controlado.

## Mundo vivo

- Llamas con flicker.
- Partículas limitadas.
- Ondas en charcos.
- Humo o polvo barato.
- Variación ambiental no determinista solo donde no afecte gameplay.

## Tareas

- [ ] Separar `WorldBuilder` de `GameScene`.
- [ ] Compartir geometrías y materiales repetidos.
- [ ] Crear módulos de paredes, suelo y altar.
- [x] Crear metadatos y detección visual inicial de objetos interactivos.
- [x] Mejorar material de suelo húmedo y añadir charcos procedurales.
- [ ] Añadir reflejos aproximados medibles.
- [x] Añadir lluvia procedural con pool de partículas.
- [ ] Añadir estados visuales para flags de gameplay.
- [ ] Liberar geometrías, materiales y luces durante `destroy()`.
- [ ] Probar fallback cuando WebGL no esté disponible.

## Criterios de aceptación

- La escena se crea y destruye repetidamente sin listeners, loops ni recursos huérfanos.
- Los objetos repetidos reutilizan materiales o geometrías cuando sea posible.
- El suelo comunica humedad mediante una combinación visible de roughness, luz y variación.
- Las animaciones ambientales no modifican el estado de gameplay por accidente.
- No se incorpora ningún asset descargado.

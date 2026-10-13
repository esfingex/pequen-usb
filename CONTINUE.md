# CONTINUE.md — pequen-usb

Última ejecución: 2026-10-13 ~00:30 (-03, zeus)

## Estado del sistema
- Último commit estable: (ver `git log -1` tras este commit)
  `fix(gnome-extension): [Wave 2026-10-13_1] add GNOME Shell 51 support (metadata v6)`
- Tests/linters: gate binario = verificación de JSON y contenido del zip PASS
  (no hay suite aplicable a metadata.json).

## Última wave
`docs/planning/wave_2026-10-13_1.md` — soporte GNOME 51, instalado en el
sistema, pendiente de verificación tras logout/login del usuario.

## Punto exacto de reanudación
1. Usuario cierra y reabre sesión (Wayland).
2. Verificar: `gnome-extensions info pequen-usb@esfingex.github.io`
   → Versión: 6, Estado: ACTIVE.
3. Si aparece INCOMPATIBLE/ERROR en 51: auditar APIs usadas contra el
   changelog de GNOME 51 y abrir wave de compatibilidad.

## Contexto/bloqueos
- Ninguno activo. Backend (daemon + USBGuard) verificado sano por DBus el
  2026-10-13: `org.pequen.USBGuard` responde GetDevices/GetHistory.
- ADR: el bump de versión (5→6) en metadata es requisito para que GNOME
  recargue la extensión tras el estado OUT OF DATE; no eliminarlo.

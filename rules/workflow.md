# pequen-usb - Workflow Obligatorio del Agente

Este proyecto forma parte del ecosistema de herramientas de seguridad de CachyOS / Alicanto (GNOME Extension + Python 3 DBus Daemon).

## WORKFLOW OBLIGATORIO DEL AGENTE

### Fase 1 - Antes de Modificar Código: Consultar CaveMem
Antes de solucionar cualquier bug, refactorizar o añadir características, **DEBES** realizar una búsqueda semántica en la base de datos CaveMem del proyecto:
```bash
rtk cavemem query "<task keywords>"
```

### Fase 2 - Al Resolver: Guardar en CaveMem (BCF)
Al solucionar un bug complejo, definir una convención de código o resolver un problema técnico (gotcha), **DEBES** registrarlo en CaveMem usando el Formato Caveman Bilingüe (BCF):
- **`[EN]`**: Inglés comprimido al estilo "caveman" (omitiendo artículos, pronombres y verbos auxiliares) para minimizar tokens LLM.
- **`[ES]`**: Español natural completo para referencia del desarrollador y panel web.

```bash
cavemem add <category> "[EN] compressed fact... [ES] descripción en español..." -t "pequen-usb,<tags>"
```
*Categorías Válidas*: `gotcha`, `rule`, `flow`, `config`, `dependency`.

## RTK es Obligatorio en Terminales
**TODOS** los comandos de terminal DEBEN llevar el prefijo `rtk`:
```bash
rtk git status
rtk python3 -m pytest
```

## Estándares del Proyecto
1. **Python 3.10+**: Anotaciones de tipos de unión (`list[str] | None`), `match/case`, y uso exclusivo de `pathlib.Path`.
2. **GNOME Shell Extension Standard (GNOME 45+ EGO Guidelines)**:
   - Compatible con GNOME Shell 45 a 50+.
   - `metadata.json`: Solo claves estándar (`uuid`, `name`, `description`, `shell-version`, `url`, `version`, `gettext-domain`, `settings-schema`). Prohibidas claves no estándar (`license`, `author`, `contributors`).
   - `build.sh`: NUNCA incluir `schemas/gschemas.compiled` ni imágenes PNG en el archivo `.zip` para EGO.
   - Sin ejecución global: No instanciar proxies DBus ni ejecutar funciones en el scope global del módulo.
   - Ciclo de vida de señales: Usar exclusivamente `connectObject()` y `disconnectObject()`.
   - Reinicio de sistema: Usar `SystemActions.getDefault().activateRestart()`, NUNCA `Util.spawn()`.
3. **Planificación GSD**: Documentación en `.planning/` (`PROJECT.md`, `ROADMAP.md`, `STATE.md`, `CONSTITUTION.md`, `CHECKLIST.md`, `continue-here.md`).

## Información del Proyecto
- **Nombre**: pequen-usb
- **Tipo**: gnome-extension + python
- **Path**: /home/esfingex/workspace/pequen-usb

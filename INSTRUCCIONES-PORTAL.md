#  Portal del Cliente - Sistema Completo

## Resumen

Portal web simplificado para que los clientes consulten sus casos sin acceso a funciones internas del estudio.

---

## Estructura de Archivos

```
src/app/portal/
├── layout.tsx                    # Layout limpio (sin sidebar complejo)
├── page.tsx                      # Dashboard del cliente
├── components/
│   └── PortalHeader.tsx          # Header del portal
├── casos/
│   ├── page.tsx                  # Listado de mis casos
│   └── [id]/
│       └── page.tsx              # Detalle del caso (vista cliente)
├── documentos/
│   └── page.tsx                  # Gestión de documentos (placeholder)
├── mensajes/
│   └── page.tsx                  # Mensajes con abogado (placeholder)
└── configuracion/
    └── page.tsx                  # Configuración de cuenta
```

---

## Archivos a Copiar

| Archivo | Destino |
|---------|---------|
| `layout.tsx` | `src/app/portal/layout.tsx` |
| `page.tsx` | `src/app/portal/page.tsx` |
| `components/PortalHeader.tsx` | `src/app/portal/components/PortalHeader.tsx` |
| `casos/page.tsx` | `src/app/portal/casos/page.tsx` |
| `casos/[id]/page.tsx` | `src/app/portal/casos/[id]/page.tsx` |
| `documentos/page.tsx` | `src/app/portal/documentos/page.tsx` |
| `mensajes/page.tsx` | `src/app/portal/mensajes/page.tsx` |
| `configuracion/page.tsx` | `src/app/portal/configuracion/page.tsx` |

---

## Características del Portal

### 1. Layout Diferente
- **Sin Sidebar complejo** - Diseño limpio tipo Home Banking
- **Header minimalista** - Logo, navegación básica, usuario
- **Navegación simple** - Inicio, Mis Casos

### 2. Dashboard del Cliente
- Saludo personalizado: "Bienvenido, [Nombre]"
- Tarjetas de resumen:
  - Casos Activos
  - Casos Finalizados
  - Tareas Pendientes
- Lista de casos activos (últimos 3)
- Próximos vencimientos
- Acciones rápidas (Subir Documento, Enviar Mensaje)
- Panel de notificaciones (placeholder)

### 3. Listado de Casos
- Tabs: "En Curso" / "Finalizados"
- Tarjetas con información básica
- Enlace a detalle

### 4. Detalle del Caso (Vista Simplificada)
El cliente ve:
- Estado actual y etapa procesal
- Barra de progreso
- Historial de movimientos (solo hitos públicos, NO notas internas)
- Tareas pendientes
- Abogado responsable
- Acciones: Subir documento, Enviar mensaje

El cliente NO ve:
- Notas internas del abogado
- Información financiera detallada
- Auditoría completa
- Bitácora manual

### 5. Estados Vacíos Elegantes
Todos los estados vacíos tienen:
- Icono grande en gris claro
- Mensaje principal
- Descripción secundaria
- Sin emojis ni colores chillones

---

## Diseño Visual

### Paleta de Colores
- **Fondo**: `bg-slate-50`
- **Cards**: `bg-white border-slate-200`
- **Headers de cards**: `bg-slate-50/50`
- **Texto principal**: `text-slate-900`
- **Texto secundario**: `text-slate-600`
- **Texto terciario**: `text-slate-500`
- **Acentos**: 
  - Azul para casos activos
  - Verde para finalizados/éxito
  - Ámbar para pendientes/alertas

### Estados Vacíos
```
┌────────────────────────────────────┐
│                                    │
│           [  Icono  ]              │  <- Icono en slate-200
│                                    │
│      Título en slate-700           │
│                                    │
│   Descripción en slate-500         │
│   Texto pequeño y centrado         │
│                                    │
│       [Botón deshabilitado]        │  <- Opcional
│                                    │
└────────────────────────────────────┘
```

---

## Seguridad

### Verificaciones en cada página:
1. Usuario autenticado
2. Rol = CLIENTE
3. Cliente vinculado al usuario
4. Caso pertenece al cliente (en detalle)

### Datos ocultos al cliente:
- `bitacoras` con `tipo: 'manual'` (notas internas)
- `montoDisputa` y `montoFinal` (información financiera)
- Información de otros casos/clientes
- Auditoría detallada

---

## Pruebas

### Test 1: Acceso al portal
1. Login como usuario con rol CLIENTE
2. Middleware redirige a `/portal`
3. Ver dashboard con saludo personalizado

### Test 2: Ver casos
1. Ir a "Mis Casos"
2. Ver tabs de casos activos y finalizados
3. Click en un caso
4. Ver detalle simplificado

### Test 3: Estado vacío
1. Cliente sin casos
2. Dashboard muestra "No tiene casos activos"
3. Diseño elegante, sin errores

### Test 4: Restricción de acceso
1. Como cliente, intentar ir a `/casos`
2. Middleware redirige a `/portal`
3. No puede ver rutas internas

---

## Próximas Funcionalidades

Placeholder creados para:
- **Documentos**: Subir archivos a los casos
- **Mensajes**: Comunicación con el abogado
- **Notificaciones**: Alertas de movimientos

Estas funcionalidades muestran estados vacíos elegantes con mensaje "Próximamente".

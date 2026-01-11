# Notificaciones Push con Next.js

Este proyecto es una implementación completa de notificaciones push usando Next.js 16, React 19, Service Workers y la biblioteca `web-push`. Las notificaciones push permiten a las aplicaciones web enviar mensajes a los usuarios incluso cuando la aplicación no está abierta en el navegador.

## 📋 Tabla de Contenidos

- [Requisitos Previos](#requisitos-previos)
- [Configuración Inicial](#configuración-inicial)
- [Generación de Claves VAPID](#generación-de-claves-vapid)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Explicación del Código](#explicación-del-código)
- [Uso](#uso)
- [Despliegue](#despliegue)
- [Solución de Problemas](#solución-de-problemas)

## 🔧 Requisitos Previos

- Node.js 18+ instalado
- npm, yarn, pnpm o bun
- Un navegador moderno que soporte Service Workers y Push API (Chrome, Firefox, Edge, Opera)
- HTTPS (requerido para notificaciones push en producción, localhost funciona sin HTTPS)

## 🚀 Configuración Inicial

### 1. Instalar Dependencias

```bash
npm install
# o
yarn install
# o
pnpm install
```

### 2. Generar Claves VAPID

Las claves VAPID (Voluntary Application Server Identification) son necesarias para autenticar tu servidor con los servicios de push del navegador.

```bash
npx web-push generate-vapid-keys
```

Esto generará un par de claves:
- **Public Key**: Se usa en el cliente (navegador)
- **Private Key**: Se mantiene secreta en el servidor

### 3. Configurar Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto:

```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY=tu_clave_publica_aqui
VAPID_PRIVATE_KEY=tu_clave_privada_aqui
```

**Importante**: 
- La clave pública debe tener el prefijo `NEXT_PUBLIC_` para estar disponible en el cliente
- La clave privada nunca debe exponerse al cliente
- No subas el archivo `.env.local` a tu repositorio (ya debería estar en `.gitignore`)

### 4. Ejecutar el Servidor de Desarrollo

```bash
npm run dev
# o
yarn dev
# o
pnpm dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## 📁 Estructura del Proyecto

```
push-notifications/
├── app/
│   ├── actions.ts          # Server Actions para manejar suscripciones y notificaciones
│   ├── manifest.ts         # Web App Manifest para PWA
│   ├── push.tsx            # Componente cliente para gestionar notificaciones
│   ├── page.tsx            # Página principal
│   └── layout.tsx          # Layout de la aplicación
├── public/
│   └── sw.js               # Service Worker para recibir notificaciones
└── .env.local              # Variables de entorno (no incluido en el repo)
```

## 💻 Explicación del Código

### Service Worker (`public/sw.js`)

El Service Worker es el componente clave que recibe las notificaciones push cuando la aplicación no está abierta:

```javascript
// Escucha eventos push
self.addEventListener('push', function (event) {
    // Muestra la notificación cuando llega un mensaje push
})

// Maneja clics en las notificaciones
self.addEventListener('notificationclick', function (event) {
    // Abre la aplicación cuando el usuario hace clic
})
```

### Server Actions (`app/actions.ts`)

Las Server Actions manejan la lógica del servidor:

- **`subscribeUser()`**: Almacena la suscripción del usuario (en producción, debería guardarse en una base de datos)
- **`unsubscribeUser()`**: Elimina la suscripción del usuario
- **`sendNotification()`**: Envía una notificación push usando la biblioteca `web-push`

**Nota importante**: Los objetos `PushSubscription` del navegador no pueden pasarse directamente a Server Actions. Deben serializarse a objetos planos primero.

### Componente Cliente (`app/push.tsx`)

El componente cliente gestiona:

1. **Registro del Service Worker**: Registra el Service Worker necesario para recibir notificaciones
2. **Suscripción**: Solicita permiso al usuario y crea una suscripción push
3. **Serialización**: Convierte el objeto `PushSubscription` a un objeto plano serializable
4. **Envío de notificaciones de prueba**: Permite probar las notificaciones desde la interfaz

#### Funciones Clave:

- **`urlBase64ToUint8Array()`**: Convierte la clave pública VAPID del formato URL-safe base64 a `Uint8Array`
- **`subscriptionToPlainObject()`**: Convierte `PushSubscription` a un objeto plano serializable, extrayendo las claves `p256dh` y `auth` como strings base64

### Web App Manifest (`app/manifest.ts`)

Define los metadatos de la aplicación web progresiva (PWA), incluyendo iconos, nombre y configuración de visualización.

## 🎯 Uso

### Suscribirse a Notificaciones

1. Abre la aplicación en tu navegador
2. Haz clic en el botón "Suscribirme"
3. El navegador pedirá permiso para mostrar notificaciones
4. Acepta el permiso

### Enviar Notificación de Prueba

1. Una vez suscrito, verás un área de texto
2. Escribe un mensaje en el textarea
3. Haz clic en "Enviar prueba"
4. Deberías recibir una notificación push

### Cancelar Suscripción

Haz clic en el botón "Cancelar suscripción" para dejar de recibir notificaciones.

## 🌐 Despliegue

### Consideraciones para Producción

1. **HTTPS Obligatorio**: Las notificaciones push solo funcionan en HTTPS (excepto localhost)
2. **Base de Datos**: En producción, almacena las suscripciones en una base de datos en lugar de una variable en memoria
3. **Variables de Entorno**: Configura las variables de entorno en tu plataforma de despliegue (Vercel, Netlify, etc.)
4. **Service Worker**: Asegúrate de que el Service Worker esté accesible en `/sw.js`

### Desplegar en Vercel

1. Conecta tu repositorio a Vercel
2. Configura las variables de entorno en el dashboard de Vercel:
   - `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
   - `VAPID_PRIVATE_KEY`
3. Despliega

### Ejemplo de Almacenamiento en Base de Datos

```typescript
// En app/actions.ts
import { db } from './db' // Tu cliente de base de datos

export async function subscribeUser(sub: SerializedSubscription) {
  await db.subscriptions.upsert({
    where: { endpoint: sub.endpoint },
    update: sub,
    create: sub,
  })
  return { success: true }
}

export async function sendNotificationToAll(message: string) {
  const subscriptions = await db.subscriptions.findMany()
  
  await Promise.all(
    subscriptions.map(sub => sendNotification(message, sub))
  )
}
```

## 🔍 Solución de Problemas

### Error: "Only plain objects can be passed to Server Functions"

**Problema**: Estás pasando un objeto `PushSubscription` directamente a una Server Action.

**Solución**: Usa la función `subscriptionToPlainObject()` para serializar la suscripción antes de pasarla:

```typescript
const serializedSub = subscriptionToPlainObject(subscription)
await subscribeUser(serializedSub)
```

### Error: "Registration failed"

**Problema**: El Service Worker no se puede registrar.

**Soluciones**:
- Verifica que `public/sw.js` existe y es accesible
- Asegúrate de estar usando HTTPS (o localhost)
- Revisa la consola del navegador para más detalles

### Las notificaciones no aparecen

**Posibles causas**:
1. El usuario no ha dado permiso para notificaciones
2. Las claves VAPID no están configuradas correctamente
3. La suscripción no está guardada correctamente
4. El Service Worker no está registrado

**Solución**: Revisa la consola del navegador y los logs del servidor para identificar el problema específico.

### Error: "VAPID keys are not set"

**Problema**: Las claves VAPID no están configuradas en las variables de entorno.

**Solución**: Verifica que `.env.local` existe y contiene las claves correctas. Reinicia el servidor de desarrollo después de agregar las variables.

## 📚 Recursos Adicionales

- [Web Push Protocol](https://datatracker.ietf.org/doc/html/rfc8030)
- [Push API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [Service Workers - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Next.js Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- [web-push Library](https://github.com/web-push-libs/web-push)

## 📝 Notas

- Este proyecto es un ejemplo educativo. En producción, implementa manejo de errores robusto, validación de datos y almacenamiento persistente de suscripciones.
- Las notificaciones push requieren permisos del usuario. Respeta la decisión del usuario si rechaza los permisos.
- Considera implementar una estrategia de reintento para el envío de notificaciones fallidas.

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor, abre un issue o pull request si encuentras algún problema o tienes sugerencias de mejora.

## 📄 Licencia

Este proyecto es de código abierto y está disponible bajo la licencia MIT.

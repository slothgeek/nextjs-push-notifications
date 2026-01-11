'use server'
 
import webpush from 'web-push'
import type { PushSubscription } from 'web-push'

type SerializedSubscription = {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  } | null
}

type PushMessage = {
    title: string
    body: string
    url: string
}
 
webpush.setVapidDetails(
  'mailto:tu@correo.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)
 
let subscription: SerializedSubscription | null = null
 
export async function subscribeUser(sub: SerializedSubscription) {
  subscription = sub
  // En un entorno de producción, se almacenaría la suscripción en una base de datos
  // Por ejemplo: await db.subscriptions.create({ data: sub })
  return { success: true }
}
 
export async function unsubscribeUser() {
  subscription = null
  // En un entorno de producción, se eliminaría la suscripción de la base de datos
  // Por ejemplo: await db.subscriptions.delete({ where: { ... } })
  return { success: true }
}
 
export async function sendNotification(message: PushMessage, sub: SerializedSubscription) {
  if (!sub || !sub.keys) {
    throw new Error('No hay suscripción disponible')
  }
 
  // Convertir el objeto serializado al formato que espera web-push
  const pushSubscription: PushSubscription = {
    endpoint: sub.endpoint,
    keys: {
      p256dh: sub.keys.p256dh,
      auth: sub.keys.auth,
    },
  }

  try {
    await webpush.sendNotification(
      pushSubscription,
      JSON.stringify({
        title: message.title,
        body: message.body,
        icon: '/icon.png',
        url: message.url,
      })
    )
    return { success: true }
  } catch (error) {
    console.error('Error al enviar la notificación:', error)
    return { success: false, error: 'Error al enviar la notificación' }
  }
}
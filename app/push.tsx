'use client'

import { useState, useEffect } from 'react'
import { subscribeUser, unsubscribeUser, sendNotification } from './actions'

function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
}

function subscriptionToPlainObject(subscription: PushSubscription) {
    // Convertir ArrayBuffer a base64 para las claves
    const p256dh = subscription.getKey('p256dh')
    const auth = subscription.getKey('auth')
    
    function arrayBufferToBase64(buffer: ArrayBuffer): string {
        const bytes = new Uint8Array(buffer)
        let binary = ''
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i])
        }
        return btoa(binary)
    }
    
    const keys = p256dh && auth
        ? {
              p256dh: arrayBufferToBase64(p256dh),
              auth: arrayBufferToBase64(auth),
          }
        : null

    return {
        endpoint: subscription.endpoint,
        keys,
    }
}

export default function PushNotificationManager() {
    const [isSupported, setIsSupported] = useState(false)
    const [subscription, setSubscription] = useState<PushSubscription | null>(
        null
    )
    const [message, setMessage] = useState('')

    useEffect(() => {
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            setIsSupported(true)
            registerServiceWorker()
        }
    }, [])

    async function registerServiceWorker() {
        const registration = await navigator.serviceWorker.register('/sw.js', {
            scope: '/',
            updateViaCache: 'none',
        })
        const sub = await registration.pushManager.getSubscription()
        setSubscription(sub)
    }

    async function subscribeToPush() {
        const registration = await navigator.serviceWorker.ready
        const sub = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(
                process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
            ),
        })
        setSubscription(sub)
        const serializedSub = subscriptionToPlainObject(sub)
        await subscribeUser(serializedSub)
    }

    async function unsubscribeFromPush() {
        await subscription?.unsubscribe()
        setSubscription(null)
        await unsubscribeUser()
    }

    async function sendTestNotification() {
        if (subscription) {
            console.log('Enviando notificación de prueba:', message)
            const serializedSub = subscriptionToPlainObject(subscription)
            await sendNotification(message, serializedSub)
            setMessage('')
        }
    }

    if (!isSupported) {
        return <p>Push notifications are not supported in this browser.</p>
    }

    return (
        <div className="flex flex-col gap-4 items-start justify-start w-full">
            {subscription ? (
                <>
                    <p>Estas suscrito a notificaciones push.</p>
                    <button
                        onClick={unsubscribeFromPush}
                        className='bg-red-500 text-white py-2 px-4 rounded-md cursor-pointer'
                    >
                        Cancelar suscripción
                    </button>
                    <div className='border-t border-gray-300 w-full'></div>
                    <h2 className='text-lg font-bold'>Enviar notificación de prueba</h2>
                    <textarea
                        placeholder="Ingrese el mensaje de la notificación"
                        className='w-full p-2 rounded-md border border-gray-300 bg-white placeholder:text-gray-500 text-black'
                        value={message}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setMessage(e.target.value)}
                    >{message}</textarea>
                    <button
                        onClick={sendTestNotification}
                        className='bg-blue-500 text-white py-2 px-4 rounded-md cursor-pointer'
                    >
                        Enviar prueba
                    </button>
                </>
            ) : (
                <>
                    <p>No estás suscrito a notificaciones push.</p>
                    <button
                        onClick={subscribeToPush}
                        className='bg-blue-500 text-white py-2 px-4 rounded-md cursor-pointer'
                    >
                        Suscribirme
                    </button>
                </>
            )}
        </div>
    )
}


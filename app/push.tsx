'use client'

import { useState, useEffect } from 'react'
import { subscribeUser, unsubscribeUser, sendNotification } from './actions'

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!

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

export default function PushNotificationManager() {
    const [isSupported, setIsSupported] = useState(false)
    const [subscription, setSubscription] = useState<PushSubscription | null>(
        null
    )
    const [title, setTitle] = useState('')
    const [message, setMessage] = useState('')
    const [url, setUrl] = useState('')

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
        if (!VAPID_PUBLIC_KEY) {
            alert('Error: La clave VAPID pública no está configurada. Por favor, configura NEXT_PUBLIC_VAPID_PUBLIC_KEY en tu archivo .env.local')
            return
        }
        const registration = await navigator.serviceWorker.ready
        const sub = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        })
        setSubscription(sub)
        const serializedSub = JSON.parse(JSON.stringify(sub))
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
            const serializedSub = JSON.parse(JSON.stringify(subscription))
            await sendNotification({ title, body: message, url }, serializedSub)
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
                    <input
                        type="text"
                        placeholder="Ingrese el titulo de la notificación"
                        className='w-full max-w-xs p-2 rounded-md border border-gray-300 bg-white placeholder:text-gray-500 text-black'
                        value={title}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
                    />
                    <textarea
                        placeholder="Ingrese el mensaje de la notificación"
                        className='w-full p-2 rounded-md border border-gray-300 bg-white placeholder:text-gray-500 text-black'
                        value={message}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setMessage(e.target.value)}
                    >{message}</textarea>
                    <input
                        type="text"
                        placeholder="Ingrese la url de la notificación"
                        className='w-full p-2 rounded-md border border-gray-300 bg-white placeholder:text-gray-500 text-black'
                        value={url}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUrl(e.target.value)}
                    />
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


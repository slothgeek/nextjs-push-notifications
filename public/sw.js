self.addEventListener('push', function (event) {
    if (event.data) {
        const data = event.data.json()
        const options = {
            body: data.body,
            icon: data.icon || '/icon.png',
            badge: '/badge.png',
            vibrate: [100, 50, 100],
            data: {
                dateOfArrival: Date.now(),
                primaryKey: '2',
            },
        }
        event.waitUntil(self.registration.showNotification(data.title, options))
    }
})

self.addEventListener('notificationclick', function (event) {
    console.log('Notificación clicada.')
    event.notification.close()

    // Los datos están en event.notification.data, no en event.data
    const data = event.notification.data
    const url = data?.url || 'https://jorgecastrillo.blog'
    event.waitUntil(clients.openWindow(url))
})
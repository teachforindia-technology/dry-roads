function updateServiceWorker(worker) {
	//code to ask user to refresh
	worker.postMessage({action: 'skipWaiting'})
}

if ('serviceWorker' in navigator) {
	navigator.serviceWorker
		.register('/serviceWorker.js')
		.then(function(registration) {
			if (!navigator.serviceWorker.controller) return
			if (registration.waiting) {
				updateServiceWorker(registration.waiting)
				return
			}
			if (registration.installing) {
				var worker = registration.installing
				worker.addEventListener('statechange', function() {
					if (worker.state === 'installed') {
						updateServiceWorker(worker)
					}
				})
				return
			}
			registration.addEventListener('updatefound', function() {
				registration.addEventListener('statechange', function() {
					if (registration.state === 'installed') {
						updateServiceWorker(registration)
					}
				})
			})
		})
		.catch(function(err) {
			console.log('ServiceWorker registration failed: ', err)
		})

	navigator.serviceWorker.addEventListener('controllerchange', function() {
		window.location.reload()
	})
}

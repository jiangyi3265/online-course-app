const TAB_ROUTES = new Set([
	'/pages/index/index',
	'/pages/mycourse/mycourse',
	'/pages/member/member'
])

function currentRouteSignature() {
	const pages = typeof getCurrentPages === 'function' ? getCurrentPages() : []
	const page = pages[pages.length - 1]
	if (page && page.route) return page.route
	if (typeof window !== 'undefined' && window.location) return window.location.href
	return ''
}

function fallbackTo(url = '/pages/index/index') {
	const cleanUrl = String(url || '/pages/index/index')
	const route = cleanUrl.split('?')[0]
	const method = TAB_ROUTES.has(route) ? 'switchTab' : 'redirectTo'
	uni[method]({
		url: cleanUrl,
		fail() {
			uni.reLaunch({ url: cleanUrl })
		}
	})
}

export function safeNavigateBack(fallback = '/pages/index/index') {
	const before = currentRouteSignature()
	const pages = typeof getCurrentPages === 'function' ? getCurrentPages() : []
	let handled = false

	const finishWithFallback = () => {
		if (handled) return
		const after = currentRouteSignature()
		if (before && after && after !== before) {
			handled = true
			return
		}
		handled = true
		fallbackTo(fallback)
	}

	if (pages.length > 1) {
		uni.navigateBack({
			fail: finishWithFallback
		})
		setTimeout(finishWithFallback, 420)
		return
	}

	if (typeof window !== 'undefined' && window.history && window.history.length > 1) {
		window.history.back()
		setTimeout(finishWithFallback, 420)
		return
	}

	finishWithFallback()
}

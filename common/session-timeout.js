export const SESSION_INACTIVITY_LIMIT_MS = 15 * 60 * 1000

const LAST_ACTIVE_KEY = 'authSessionLastActiveAt'
const INACTIVE_SINCE_KEY = 'authSessionInactiveSince'
const AUTH_STORAGE_KEYS = ['apiToken', 'logined', 'userInfo']
const SESSION_HEARTBEAT_MS = 60 * 1000

let heartbeatTimer = null
let expiryTimer = null
let h5EventsBound = false
let networkEventsBound = false
let networkOffline = false

function toTimestamp(value) {
	const timestamp = Number(value || 0)
	return Number.isFinite(timestamp) && timestamp > 0 ? timestamp : 0
}

function isPageVisible() {
	return typeof document === 'undefined' || !document.hidden
}

function isOffline() {
	if (networkOffline) return true
	return typeof navigator !== 'undefined' && navigator.onLine === false
}

function stopHeartbeat() {
	if (!heartbeatTimer) return
	clearInterval(heartbeatTimer)
	heartbeatTimer = null
}

function stopExpiryTimer() {
	if (!expiryTimer) return
	clearTimeout(expiryTimer)
	expiryTimer = null
}

function currentRoute() {
	const pages = typeof getCurrentPages === 'function' ? getCurrentPages() : []
	const current = pages.length ? pages[pages.length - 1] : null
	return current && (current.route || current.$page && current.$page.fullPath) || ''
}

function redirectToLogin() {
	if (String(currentRoute()).includes('pages/login/login')) return
	setTimeout(() => {
		uni.reLaunch({ url: '/pages/login/login?reason=inactive' })
	}, 0)
}

function startExpiryTimer() {
	stopExpiryTimer()
	if (!hasAuthenticatedSession()) return
	const remaining = Math.max(0, SESSION_INACTIVITY_LIMIT_MS - getSessionInactiveDuration())
	expiryTimer = setTimeout(() => {
		if (hasSessionTimedOut()) {
			expireAuthenticatedSession()
			stopHeartbeat()
			redirectToLogin()
		}
	}, remaining + 50)
}

function startHeartbeat() {
	stopHeartbeat()
	heartbeatTimer = setInterval(() => {
		if (!isPageVisible() || isOffline()) {
			pauseSessionTimeout()
			return
		}
		markSessionActive()
	}, SESSION_HEARTBEAT_MS)
}

function handleNetworkChange(isConnected) {
	networkOffline = !isConnected
	if (isConnected) resumeSessionTimeout()
	else pauseSessionTimeout()
}

function bindNetworkEvents() {
	if (networkEventsBound) return
	networkEventsBound = true
	if (typeof uni.getNetworkType === 'function') {
		uni.getNetworkType({
			success: result => handleNetworkChange(result.networkType !== 'none')
		})
	}
	if (typeof uni.onNetworkStatusChange === 'function') {
		uni.onNetworkStatusChange(result => handleNetworkChange(result.isConnected))
	}
}

function bindH5Events() {
	if (h5EventsBound || typeof document === 'undefined' || typeof window === 'undefined') return
	h5EventsBound = true
	document.addEventListener('visibilitychange', () => {
		if (document.hidden) pauseSessionTimeout()
		else resumeSessionTimeout()
	})
	window.addEventListener('pagehide', pauseSessionTimeout)
	window.addEventListener('pageshow', resumeSessionTimeout)
	window.addEventListener('offline', () => handleNetworkChange(false))
	window.addEventListener('online', () => handleNetworkChange(true))
}

export function hasAuthenticatedSession() {
	return !!uni.getStorageSync('apiToken') || !!uni.getStorageSync('logined')
}

export function startAuthenticatedSession(now = Date.now()) {
	uni.setStorageSync(LAST_ACTIVE_KEY, now)
	uni.removeStorageSync(INACTIVE_SINCE_KEY)
}

export function markSessionActive(now = Date.now()) {
	if (!hasAuthenticatedSession()) {
		clearSessionTiming()
		return
	}
	startAuthenticatedSession(now)
}

export function markSessionInactive(now = Date.now()) {
	if (!hasAuthenticatedSession()) {
		clearSessionTiming()
		return
	}
	if (!toTimestamp(uni.getStorageSync(INACTIVE_SINCE_KEY))) {
		uni.setStorageSync(INACTIVE_SINCE_KEY, now)
	}
	uni.setStorageSync(LAST_ACTIVE_KEY, now)
}

export function getSessionInactiveDuration(now = Date.now()) {
	const inactiveSince = toTimestamp(uni.getStorageSync(INACTIVE_SINCE_KEY))
	return inactiveSince ? Math.max(0, now - inactiveSince) : 0
}

export function hasSessionTimedOut(now = Date.now()) {
	if (!hasAuthenticatedSession()) return false
	const inactiveSince = toTimestamp(uni.getStorageSync(INACTIVE_SINCE_KEY))
	if (inactiveSince) return now - inactiveSince >= SESSION_INACTIVITY_LIMIT_MS
	const lastActiveAt = toTimestamp(uni.getStorageSync(LAST_ACTIVE_KEY))
	return !!lastActiveAt && now - lastActiveAt >= SESSION_INACTIVITY_LIMIT_MS
}

export function clearSessionTiming() {
	uni.removeStorageSync(LAST_ACTIVE_KEY)
	uni.removeStorageSync(INACTIVE_SINCE_KEY)
}

export function expireAuthenticatedSession() {
	AUTH_STORAGE_KEYS.forEach(key => uni.removeStorageSync(key))
	clearSessionTiming()
}

export function pauseSessionTimeout() {
	stopHeartbeat()
	markSessionInactive()
	startExpiryTimer()
}

export function resumeSessionTimeout() {
	stopExpiryTimer()
	if (!hasAuthenticatedSession()) {
		stopHeartbeat()
		clearSessionTiming()
		return
	}
	if (hasSessionTimedOut()) {
		expireAuthenticatedSession()
		stopHeartbeat()
		redirectToLogin()
		return
	}
	if (!isPageVisible() || isOffline()) {
		pauseSessionTimeout()
		return
	}
	markSessionActive()
	startHeartbeat()
}

export function initializeSessionTimeout() {
	bindH5Events()
	bindNetworkEvents()
	resumeSessionTimeout()
}

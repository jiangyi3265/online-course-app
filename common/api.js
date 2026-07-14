const TOKEN_KEY = 'apiToken'
const LOCAL_API_ORIGIN = 'http://127.0.0.1:8007'
const APP_API_PATH = '/course/app'
const ADMIN_API_PATH = '/course/admin'

function isH5Runtime() {
	return typeof window !== 'undefined' && !!window.location
}

function isLocalHost() {
	if (!isH5Runtime()) return false
	return ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname)
}

function isLoopbackUrl(url = '') {
	return /^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?(\/|$)/i.test(url)
}

function trimTrailingSlash(url = '') {
	return String(url).replace(/\/+$/, '')
}

function getRuntimeApiOrigin() {
	if (!isH5Runtime()) return ''
	return trimTrailingSlash(window.__COURSE_API_ORIGIN__ || '')
}

function getDefaultBaseUrl(admin = false) {
	const path = admin ? ADMIN_API_PATH : APP_API_PATH
	const runtimeOrigin = getRuntimeApiOrigin()
	if (runtimeOrigin) return `${runtimeOrigin}${path}`
	if (isH5Runtime() && !isLocalHost()) return path
	return `${LOCAL_API_ORIGIN}${path}`
}

function getBaseUrl(admin = false) {
	const key = admin ? 'adminApiBase' : 'courseApiBase'
	const stored = uni.getStorageSync(key)
	if (stored && !(isH5Runtime() && !isLocalHost() && isLoopbackUrl(stored))) {
		return trimTrailingSlash(stored)
	}
	return getDefaultBaseUrl(admin)
}

function getApiOrigin() {
	const base = getBaseUrl(false)
	if (/^https?:\/\//i.test(base)) {
		return trimTrailingSlash(base.replace(/\/course\/app$/i, '').replace(/\/course\/admin$/i, ''))
	}
	return ''
}

function encodeMediaUrl(url = '') {
	const text = String(url || '')
	try {
		return text
			.replace(/%(?![0-9a-fA-F]{2})/g, '%25')
			.replace(/[^\x00-\x7F]/g, char => encodeURIComponent(char))
			.replace(/[\u0000-\u0020<>"'`{}|\\^]/g, char => encodeURIComponent(char))
			.replace(/#/g, '%23')
	} catch (err) {
		return text
	}
}

function decodeMediaText(url = '') {
	let text = String(url || '')
	for (let i = 0; i < 2; i += 1) {
		try {
			const decoded = decodeURIComponent(text)
			if (decoded === text) break
			text = decoded
		} catch (err) {
			break
		}
	}
	return text
}

export function decodeRouteText(value = '') {
	let text = String(value || '')
	for (let i = 0; i < 3; i += 1) {
		try {
			const decoded = decodeURIComponent(text)
			if (decoded === text) break
			text = decoded
		} catch (err) {
			break
		}
	}
	return text
}

function normalizeRawMediaUrl(url = '') {
	const text = decodeMediaText(String(url || '').trim().replace(/&amp;/g, '&').replace(/\\/g, '/'))
	if (!text) return ''
	return text
}

function backendMediaUrl(path = '', search = '', hash = '') {
	const origin = getApiOrigin() || (isH5Runtime() ? window.location.origin : '')
	return encodeMediaUrl(`${origin}${path}${search}${hash}`)
}

export function resolveMediaUrl(url = '') {
	const value = normalizeRawMediaUrl(url)
	if (!value) return ''
	if (/^(data:|blob:|file:)/i.test(value)) return value
	if (/^\/\//.test(value)) {
		const protocol = isH5Runtime() ? window.location.protocol : 'https:'
		return encodeMediaUrl(`${protocol}${value}`)
	}
	if (/^https?:\/\//i.test(value)) {
		try {
			const parsed = new URL(value)
			if (isH5Runtime()) {
				const apiOrigin = getApiOrigin()
				const apiHost = apiOrigin ? new URL(apiOrigin, window.location.origin).host : ''
				const mediaPath = parsed.pathname || ''
				const isBackendMedia = /^\/(prod-api\/)?(avatar|profile|upload|uploads)\//i.test(mediaPath)
				const sameHost = parsed.host === window.location.host || parsed.hostname === window.location.hostname || parsed.host === apiHost
				if (!isLocalHost() && isLoopbackUrl(value)) {
					return encodeMediaUrl(`${window.location.origin}${parsed.pathname}${parsed.search}${parsed.hash}`)
				}
				if (!isLocalHost() && isBackendMedia) {
					return backendMediaUrl(mediaPath.replace(/^\/prod-api/i, ''), parsed.search, parsed.hash)
				}
				if (window.location.protocol === 'https:' && parsed.protocol === 'http:' && (sameHost || isBackendMedia)) {
					parsed.protocol = 'https:'
				}
			}
			return encodeMediaUrl(parsed.toString())
		} catch (err) {
			return encodeMediaUrl(value)
		}
	}
	const clean = value.replace(/^\/+/, '')
	if (/^static\//i.test(clean)) return encodeMediaUrl(`/${clean}`)
	if (/^(prod-api\/)?(avatar|profile|upload|uploads)\//i.test(clean)) {
		const path = `/${clean.replace(/^prod-api\//i, '')}`
		return backendMediaUrl(path)
	}
	return encodeMediaUrl(value)
}

export function isUsableMediaUrl(url = '') {
	const value = String(url || '').trim()
	if (!value) return false
	return !/^(blob:|file:|wxfile:|data:|http:\/\/tmp|https?:\/\/tmp)/i.test(value)
}

function buildQuery(params = {}) {
	const query = Object.keys(params)
		.filter(key => params[key] !== undefined && params[key] !== null && params[key] !== '')
		.map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
		.join('&')
	return query ? `?${query}` : ''
}

function request(path, options = {}) {
	const method = options.method || 'GET'
	const url = `${getBaseUrl(options.admin)}${path}${method === 'GET' ? buildQuery(options.params || options.data) : ''}`
	const token = getToken()
	return new Promise((resolve, reject) => {
		uni.request({
			url,
			method,
			data: method === 'GET' ? undefined : (options.data || {}),
			header: {
				'Content-Type': 'application/json',
				...(token ? { Authorization: `Bearer ${token}` } : {})
			},
			success(res) {
				const body = res.data || {}
				if (res.statusCode >= 200 && res.statusCode < 300 && (body.code === 200 || body.code === 0 || body.data !== undefined)) {
					resolve(body.data !== undefined ? body.data : body)
					return
				}
				reject(new Error(body.msg || `接口请求失败：${res.statusCode}`))
			},
			fail(err) {
				reject(new Error(err.errMsg || '后端接口连接失败'))
			}
		})
	})
}

export function uploadAnswerImage(filePath) {
	if (!filePath) return Promise.resolve('')
	if (/^(https?:\/\/|\/(avatar|profile|upload|uploads)\/)/i.test(filePath)) return Promise.resolve(resolveMediaUrl(filePath))
	const token = getToken()
	return new Promise((resolve, reject) => {
		uni.uploadFile({
			url: `${getBaseUrl(false)}/upload`,
			filePath,
			name: 'file',
			header: token ? { Authorization: `Bearer ${token}` } : {},
			success(res) {
				let body = res.data || {}
				if (typeof body === 'string') {
					try {
						body = JSON.parse(body)
					} catch (e) {
						reject(new Error('上传返回格式异常'))
						return
					}
				}
				const data = body.data || body
				if (res.statusCode >= 200 && res.statusCode < 300 && (body.code === 200 || body.code === 0 || data.url || data.fileName)) {
					resolve(normalizeUploadedMediaUrl(data))
					return
				}
				reject(new Error(body.msg || `图片上传失败：${res.statusCode}`))
			},
			fail(err) {
				reject(new Error(err.errMsg || '图片上传失败'))
			}
		})
	})
}

export function uploadAnswerImageFile(file) {
	if (!file) return Promise.resolve('')
	const rawFile = file.file || file
	const fallbackPath = file.path || file.tempFilePath || file.url || ''
	if (typeof Blob !== 'undefined' && rawFile instanceof Blob && typeof FormData !== 'undefined' && typeof fetch !== 'undefined') {
		const token = getToken()
		const form = new FormData()
		form.append('file', rawFile, rawFile.name || 'paper-image.jpg')
		return fetch(`${getBaseUrl(false)}/upload`, {
			method: 'POST',
			headers: token ? { Authorization: `Bearer ${token}` } : {},
			body: form
		}).then(async res => {
			let body = {}
			try {
				body = await res.json()
			} catch (e) {}
			const data = body.data || body
			if (res.ok && (body.code === 200 || body.code === 0 || data.url || data.fileName)) {
				return normalizeUploadedMediaUrl(data)
			}
			throw new Error(body.msg || `图片上传失败：${res.status}`)
		})
	}
	return uploadAnswerImage(fallbackPath)
}

function normalizeUploadedMediaUrl(data = {}) {
	if (typeof data === 'string') return resolveMediaUrl(data)
	const url = data.fileName || data.url || data.newFileName || ''
	return resolveMediaUrl(url)
}

export function getToken() {
	return uni.getStorageSync(TOKEN_KEY) || ''
}

export function isLoggedIn() {
	return !!getToken() || !!uni.getStorageSync('logined')
}

export function saveSession(session = {}) {
	if (session.token) uni.setStorageSync(TOKEN_KEY, session.token)
	if (session.user) {
		const user = { ...session.user }
		if (!user.id) user.id = user.userId || user.user_id || user.uid || user.accountId || ''
		uni.setStorageSync('userInfo', user)
	}
	uni.setStorageSync('logined', true)
}

export function clearSession() {
	uni.removeStorageSync(TOKEN_KEY)
	uni.removeStorageSync('logined')
	uni.removeStorageSync('userInfo')
}

export function login(phone, password) {
	return request('/login', {
		method: 'POST',
		data: { phone, password }
	})
}

export function register(name, phone, password) {
	return request('/register', {
		method: 'POST',
		data: typeof name === 'object' ? name : { name, phone, password }
	})
}

export function sendSmsCode(phone) {
	return request('/sms-code', {
		method: 'POST',
		data: { phone }
	})
}

export function resetPassword(payload) {
	return request('/password/reset', {
		method: 'POST',
		data: payload
	})
}

export function getProfile() {
	return request('/profile')
}

export function updateProfile(payload) {
	return request('/profile', {
		method: 'POST',
		data: payload
	})
}

export function submitFeedback(payload) {
	return request('/feedback', {
		method: 'POST',
		data: payload
	})
}

export function getFrontendSettings() {
	return request('/settings')
}

export function getCourses(params = {}) {
	return request('/courses', { params })
}

export function getCourse(id) {
	return request(`/courses/${encodeURIComponent(id)}`)
}

export function getMyCourses() {
	return request('/my/courses')
}

export function getMyDocs(kw = '', courseId = '', userId = '') {
	return request('/my/docs', { params: { kw, courseId, userId } })
}

export function getOfflinePaperReviews(courseId = '', userId = '') {
	return request('/offline-reviews', { params: { courseId, userId } })
}

export function saveOfflinePaperReview(payload = {}) {
	return request('/offline-reviews', {
		method: 'POST',
		data: payload
	})
}

export function getStudySummaryApi() {
	return request('/study/summary')
}

export function getStudyCheckins(params = {}) {
	return request('/study/checkins', { params })
}

export function saveStudyCheckin(payload = {}) {
	return request('/study/checkins', {
		method: 'POST',
		data: payload
	})
}

export function getStudyReport(courseId = '', userId = '') {
	return request('/study/report', { params: { courseId, userId } })
}

export function getStudyPlan(courseId = '', userId = '') {
	return request('/study/plan', { params: { courseId, userId } })
}

export function getLessonVideo(lessonId, courseId = '') {
	return request('/lesson/video', { params: { lessonId, courseId } })
}

export function saveLessonProgress(lessonId, payload) {
	return request('/lesson/progress', {
		method: 'POST',
		data: { lessonId, ...payload }
	})
}

export function getLessonRatingApi(lessonId) {
	return request('/lesson/rating', { params: { lessonId } })
}

export function saveLessonRatingApi(lessonId, rating, lessonTitle = lessonId, meta = {}) {
	return request('/lesson/rating', {
		method: 'POST',
		data: { lessonId, rating, lessonTitle, ...meta }
	})
}

export function getAdminDashboard() {
	return request('/dashboard', { admin: true })
}

export function getPractice(title, questionIds = [], type = 'practice', courseId = '', practiceTitle = '') {
	return request('/practice', { params: { title, questionIds: questionIds.join(','), type, courseId, practiceTitle } })
}

// 月卡顺序解锁：获取本课程被锁定的课时视频/配套练习标题
export function getLessonLocks(courseId = '') {
	return request('/course/lesson-locks', { params: { courseId } })
}

export function submitPractice(payload) {
	return request('/practice/submit', {
		method: 'POST',
		data: payload
	})
}

export function submitPracticeSelfReview(payload) {
	return request('/practice/self-review', {
		method: 'POST',
		data: payload
	})
}

export function getQuiz(quizId, courseId = '', questionIds = []) {
	return request('/quiz', { params: { quizId, courseId, questionIds: questionIds.join(',') } })
}

export function submitQuiz(payload) {
	return request('/quiz/submit', {
		method: 'POST',
		data: payload
	})
}

export function getWrongBook(source = '', courseId = '', userId = '') {
	return request('/wrongbook', { params: { source, courseId, userId } })
}

export function markWrongMastered(id) {
	return request('/wrongbook/mastered', {
		method: 'POST',
		data: { id }
	})
}

export function getWrongBookSummary(courseId = 'gk-math-full', userId = '') {
	return request('/wrongbook/summary', { params: { courseId, userId } })
}

export function getWrongBookRecords(source = '', courseId = '', userId = '') {
	return request('/wrongbook/records', { params: { source, courseId, userId } })
}

export function getWeakWrongBook(source = '', courseId = '', userId = '') {
	return request('/wrongbook/weak', { params: { source, courseId, userId } })
}

export function getWrongRetry(count = 5, source = '', courseId = '', userId = '') {
	return request('/wrongbook/retry', { params: { count, source, courseId, userId } })
}

export function getReinforce(courseId = 'gk-math-full') {
	return request('/reinforce', { params: { courseId } })
}

export function getReinforcePractice(pointId) {
	return request('/reinforce/practice', { params: { pointId } })
}

export function askAi(message, context = '') {
	return request('/ai/ask', {
		method: 'POST',
		data: { message, context }
	})
}

export function applyAuthorization(courseId, note = '申请授权') {
	return request('/authorization/apply', {
		method: 'POST',
		data: { courseId, note }
	})
}

export function activateCourse(payload) {
	const data = typeof payload === 'string' ? { code: payload } : (payload || {})
	return request('/activate', {
		method: 'POST',
		data
	})
}

export function getFavorites() {
	return request('/favorites')
}

export function toggleFavorite(payload) {
	return request('/favorites/toggle', {
		method: 'POST',
		data: payload
	})
}

export function answerFavoriteQuestion(payload) {
	return request('/favorites/question/answer', {
		method: 'POST',
		data: payload
	})
}

export function getMyStudents() {
	return request('/my/students')
}

export function getMyAgency() {
	return request('/my/agency')
}

export function bindStudent(payload) {
	return request('/my/students/bind', {
		method: 'POST',
		data: payload
	})
}

export function unbindStudent(studentUserId) {
	return request('/my/students/unbind', {
		method: 'POST',
		data: { studentUserId }
	})
}

export function getMyReferrer() {
	return request('/my/referrer')
}

export function bindReferrer(payload) {
	return request('/my/referrer/bind', {
		method: 'POST',
		data: payload
	})
}

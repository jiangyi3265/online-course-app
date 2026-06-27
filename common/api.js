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

export function resolveMediaUrl(url = '') {
	const value = String(url || '').trim()
	if (!value || /^(https?:\/\/|data:|blob:|file:)/i.test(value)) return value
	if (/^\/\//.test(value) && isH5Runtime()) return `${window.location.protocol}${value}`
	if (/^\/?static\//i.test(value)) return `/${value.replace(/^\/+/, '')}`
	if (/^\/?(profile|upload|uploads)\//i.test(value)) {
		const path = value.startsWith('/') ? value : `/${value}`
		return `${getApiOrigin()}${path}`
	}
	return value
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
	if (/^(https?:\/\/|\/profile\/)/i.test(filePath)) return Promise.resolve(filePath)
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
				if (res.statusCode >= 200 && res.statusCode < 300 && (body.code === 200 || body.code === 0 || data.url)) {
					resolve(resolveMediaUrl(data.url || data.fileName || ''))
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

export function getMyDocs(kw = '', courseId = '') {
	return request('/my/docs', { params: { kw, courseId } })
}

export function getStudySummaryApi() {
	return request('/study/summary')
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

export function getWrongBook(source = '', courseId = '') {
	return request('/wrongbook', { params: { source, courseId } })
}

export function markWrongMastered(id) {
	return request('/wrongbook/mastered', {
		method: 'POST',
		data: { id }
	})
}

export function getWrongBookSummary(courseId = 'gk-math-full') {
	return request('/wrongbook/summary', { params: { courseId } })
}

export function getWrongBookRecords(source = '', courseId = '') {
	return request('/wrongbook/records', { params: { source, courseId } })
}

export function getWeakWrongBook(source = '', courseId = '') {
	return request('/wrongbook/weak', { params: { source, courseId } })
}

export function getWrongRetry(count = 5, source = '', courseId = '') {
	return request('/wrongbook/retry', { params: { count, source, courseId } })
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

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

export function getToken() {
	return uni.getStorageSync(TOKEN_KEY) || ''
}

export function isLoggedIn() {
	return !!getToken() || !!uni.getStorageSync('logined')
}

export function saveSession(session = {}) {
	if (session.token) uni.setStorageSync(TOKEN_KEY, session.token)
	if (session.user) uni.setStorageSync('userInfo', session.user)
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

export function getCourses(params = {}) {
	return request('/courses', { params })
}

export function getCourse(id) {
	return request(`/courses/${encodeURIComponent(id)}`)
}

export function getMyCourses() {
	return request('/my/courses')
}

export function getMyDocs(kw = '') {
	return request('/my/docs', { params: { kw } })
}

export function getStudySummaryApi() {
	return request('/study/summary')
}

export function getStudyReport(courseId = '') {
	return request('/study/report', { params: { courseId } })
}

export function getStudyPlan(courseId = '') {
	return request('/study/plan', { params: { courseId } })
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

export function getPractice(title) {
	return request('/practice', { params: { title } })
}

export function submitPractice(payload) {
	return request('/practice/submit', {
		method: 'POST',
		data: payload
	})
}

export function getQuiz(quizId) {
	return request('/quiz', { params: { quizId } })
}

export function submitQuiz(payload) {
	return request('/quiz/submit', {
		method: 'POST',
		data: payload
	})
}

export function getWrongBook() {
	return request('/wrongbook')
}

export function markWrongMastered(id) {
	return request('/wrongbook/mastered', {
		method: 'POST',
		data: { id }
	})
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

export function bindStudent(payload) {
	return request('/my/students/bind', {
		method: 'POST',
		data: payload
	})
}

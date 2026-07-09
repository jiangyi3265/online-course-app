const padDuration = value => value || '00小时00分'

const makeLesson = (title, total = 5, read = 0) => ({
	title,
	open: false,
	children: [
		{ name: '技巧干货', type: 1, total: 1, read: title.startsWith('1.') ? 1 : 0 },
		{ name: '真题讲练', type: 2, total, read }
	]
})

const makeChapter = (title, lessons = []) => ({
	title,
	open: false,
	items: lessons.map((item, index) => {
		if (typeof item === 'string') return makeLesson(item, (index % 6) + 2, 0)
		return makeLesson(item.title, item.total, item.read || 0)
	})
})

const makeTrialChapter = (title, practiceTotal = 5) => ({
	title,
	open: true,
	audition: true,
	children: [
		{ name: '技巧干货', type: 1, total: 1, read: 0 },
		{ name: '真题讲练', type: 2, total: practiceTotal, read: 0 }
	]
})

const makeQuiz = (name, status, action = '去测评') => ({ name, status, action })

export function stripCourseYear(value = '') {
	return String(value || '')
		.replace(/((?:中考|高考)(?:语文|数学|英语|物理|化学|生物|历史|政治|地理))\s*20\d{2}/g, '$1')
		.replace(/(《[^》]+?)20\d{2}(》)/g, '$1$2')
		.replace(/(《[^》]+》)\s*20\d{2}/g, '$1')
		.trim()
}

export function cleanCourseDisplayName(value = '', fallback = '') {
	const text = stripCourseYear(value || fallback)
		.replace(/[《》]/g, '')
		.replace(/\s*试听课\s*/g, '')
		.trim()
	return text || stripCourseYear(fallback).replace(/[《》]/g, '').replace(/\s*试听课\s*/g, '').trim()
}

export const OFFICIAL_USER = {
	phone: '15585827319',
	name: '规划提升邓老师',
	id: '33075',
	tenantId: 52
}

const mathFullChapters = [
	makeChapter('一、复数', [
		{ title: '1.复数乘除的模（三角法）', total: 8, read: 2 },
		{ title: '2.复数加减的模（图解法）', total: 5 },
		'3.速算复数的模运算',
		'4.运算'
	]),
	makeChapter('二、集合与不等式', [
		'5.集合与不等式（答案反代法）',
		'6.幂方和不等式的应用',
		'7.万能K法解不等式',
		'8.对称法解不等式',
		'9.最大值、最小值与均值不等式',
		'10.充要条件的判断'
	]),
	makeChapter('三、平面向量', [
		'11.平面向量三板斧（坐标法）',
		'12.平面向量三板斧（图解法）',
		'13.平面向量三板斧（公式法）',
		'14.平面向量的基本定理与数量积运算',
		'15.等和线、极化恒等式与投影'
	]),
	makeChapter('四、函数与导数', [
		'16.抽象函数（构造法）',
		'17.抽象函数（赋值法）',
		'18.函数奇偶性与图像',
		'19.函数对称与周期',
		'20.三次函数图像和性质',
		'21.公切线方程',
		'22.指对跨界函数',
		'23.极值点效应',
		'24.导数中的隐零点代换',
		'25.导数双变量问题'
	]),
	makeChapter('五、解三角形', [
		'26.三角形中线、角平分线和高线',
		'27.射影定理核心应用',
		'28.托勒密定理应用',
		'29.三角形面积公式总结'
	]),
	makeChapter('六、立体几何', [
		'30.空间线面关系',
		'31.立体几何万能建系法',
		'32.空间外接球问题',
		'33.空间内切球问题',
		'34.动点坐标设法'
	]),
	makeChapter('七、圆锥曲线', [
		'35.圆锥曲线看图说话法',
		'36.圆锥曲线第三定义',
		'37.非对称韦达定理',
		'38.点乘双根法',
		'39.定比点差法',
		'40.焦点三角形总结'
	]),
	makeChapter('八、概率与统计', [
		'41.分布列的期望与方差',
		'42.条件概率与全概率公式',
		'43.正态分布核心解法',
		'44.二项式定理核心解法'
	]),
	makeChapter('九、数列', [
		'45.等差数列计算',
		'46.等差数列函数属性',
		'47.错位相减法求和',
		'48.数列通项与求和'
	]),
	makeChapter('十、三角函数', [
		'49.三角函数合一变形',
		'50.辅助角公式',
		'51.三角变换方向',
		'52.万能公式',
		'53.和差化积公式'
	])
]

const mathSkillChapters = [
	makeChapter('一、基础版', [
		'1.集合逻辑不等式',
		'2.函数的基本概念与表示',
		'3.指对幂',
		'4.奇偶性与单调性',
		'5.周期性与对称性',
		'6.函数图像',
		'7.导数切线专题',
		'8.导数单调性与极值',
		'9.等差数列系统总结',
		'10.等比数列系统总结',
		'11.三角函数恒等变换',
		'12.解三角形',
		'13.平面向量',
		'14.立体几何',
		'15.概率统计'
	]),
	makeChapter('二、进阶版', [
		'16.导函数构造不等式',
		'17.端点效应解题',
		'18.指对同构体系',
		'19.圆锥曲线焦点弦',
		'20.函数对称与周期',
		'21.排列组合速通',
		'22.数列不动点求通项',
		'23.解析几何对称绝招'
	])
]

export const GAOKAO_MATH_TRIAL = {
	kind: 'trial',
	subject: 'gaokao-math',
	id: '1935625152757805057',
	title: '高考数学',
	courseName: '《高考数学》试听课',
	introduction: '《高考数学》试听课',
	cover: '/static/courses/gk-shuxue.jpg',
	detailCover: '/static/courses/gk-shuxue-trial-detail.jpg',
	updatedAt: '2026-05-26T10:11:00',
	studyCount: 1450,
	totalLessons: 6,
	totalDuration: '02小时13分',
	practiceDuration: '01小时11分',
	readStudyCount: 0,
	readDuration: '00小时41分',
	progress: 0,
	versions: ['2026版'],
	chapters: [
		makeTrialChapter('1.集合逻辑不等式', 7),
		makeTrialChapter('2.奇偶性与单调性', 7),
		makeTrialChapter('3.周期性与对称性', 6),
		makeTrialChapter('4.导数单调性与极值', 6),
		makeTrialChapter('5.数列通项公式', 6),
		makeTrialChapter('6.定值与定点问题', 2)
	],
	quizzes: [
		makeQuiz('入门测', '未学习'),
		makeQuiz('第六章 数列', '学习中：1/14')
	]
}

export const GAOKAO_MATH_FULL = {
	kind: 'full',
	subject: 'gaokao-math',
	id: '1934443028361191426',
	title: '高考数学',
	courseName: '《高考数学》',
	introduction: '《高考数学》',
	cover: '/static/courses/gk-shuxue-full.jpg',
	detailCover: '/static/courses/gk-shuxue-full-detail.jpg',
	updatedAt: '2026-05-26T10:15:00',
	studyCount: 117,
	totalLessons: 76,
	totalDuration: '04小时53分',
	practiceDuration: '22小时00分',
	readStudyCount: 4,
	readDuration: '00小时21分',
	progress: 80,
	versions: [
		{ name: '复习加强课', totalLessons: 53, totalDuration: '04小时53分', chapters: mathFullChapters },
		{ name: '技巧绝招课', totalLessons: 23, totalDuration: '22小时00分', chapters: mathSkillChapters }
	],
	quizzes: [
		makeQuiz('入门测', '已完成7次', '去测评'),
		makeQuiz('第一章 集合、常用逻辑用语、不等式', '已完成1次', '去测评'),
		makeQuiz('第二章 函数的概念及其表示', '已完成1次', '测评报告'),
		makeQuiz('第三章 导数', '未学习'),
		makeQuiz('第四章 三角函数', '未学习'),
		makeQuiz('第五章 平面向量与复数', '未学习'),
		makeQuiz('第六章 数列', '未学习'),
		makeQuiz('第七章 立体几何与空间向量', '未学习'),
		makeQuiz('第八章 直线和圆', '未学习'),
		makeQuiz('第九章 圆锥曲线', '未学习'),
		makeQuiz('第十章 概率与统计', '未学习'),
		makeQuiz('出门测', '未学习')
	]
}

export const AUTHORIZED_COURSES = [
	{ title: '《中考英语》', sub: '《中考英语》', expiry: '2026-02-15', cover: '/static/courses/zk-yingyu.jpg' },
	{ title: '《中考数学》', sub: '《中考数学》', expiry: '2026-02-14', cover: '/static/courses/zk-shuxue.jpg' },
	{ title: GAOKAO_MATH_FULL.courseName, sub: GAOKAO_MATH_FULL.introduction, expiry: '2027-06-10', cover: GAOKAO_MATH_FULL.cover, subject: 'gaokao-math' },
	{ title: '《高考英语》', sub: '《高考英语》', expiry: '2026-01-27', cover: '/static/courses/gk-yingyu-full.jpg' },
	{ title: '《高考物理》', sub: '《高考物理》', expiry: '2026-02-05', cover: '/static/courses/gk-wuli-full.jpg' }
]

export function cloneData(data) {
	return JSON.parse(JSON.stringify(data))
}

export function getGaokaoMathCourse(kind = 'full') {
	const data = kind === 'trial' ? GAOKAO_MATH_TRIAL : GAOKAO_MATH_FULL
	const cloned = cloneData(data)
	cloned.totalDuration = padDuration(cloned.totalDuration)
	cloned.practiceDuration = padDuration(cloned.practiceDuration)
	cloned.readDuration = padDuration(cloned.readDuration)
	return cloned
}

export function isGaokaoMath(title = '') {
	let text = String(title || '')
	for (let i = 0; i < 2; i += 1) {
		try {
			const decoded = decodeURIComponent(text)
			if (decoded === text) break
			text = decoded
		} catch (err) {
			break
		}
	}
	return /gk-math|gaokao-math/i.test(text) || /高考数学|高中数学|楂樿€冩暟瀛|楂樹腑鏁板/.test(text)
}

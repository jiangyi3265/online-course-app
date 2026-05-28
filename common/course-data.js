const makeLesson = (title, total = 5, read = 0) => ({
	title,
	open: false,
	children: [
		{ name: '技巧干货', type: 1, total: 1, read: title.startsWith('1.') ? 1 : 0 },
		{ name: '真题讲练', type: 2, total, read }
	]
});

const makeChapter = (title, lessons) => ({
	title,
	open: false,
	items: lessons.map((item, index) => {
		if (typeof item === 'string') return makeLesson(item, (index % 8) + 2, 0);
		return makeLesson(item.title, item.total, item.read || 0);
	})
});

const makeTrialChapter = (title, practiceTotal) => ({
	title,
	open: true,
	audition: true,
	children: [
		{ name: '技巧干货', type: 1, total: 1, read: 0 },
		{ name: '真题讲练', type: 2, total: practiceTotal, read: 0 }
	]
});

const makeQuiz = (name, status, action = '去测评') => ({ name, status, action });

export function stripCourseYear(value = '') {
	return String(value)
		.replace(/((?:中考|高考)(?:语文|数学|英语|物理|化学|生物|历史|政治|地理))20\d{2}/g, '$1')
		.replace(/(《[^》]*?)20\d{2}(》)/g, '$1$2')
		.replace(/(《[^》]+》)\s*20\d{2}/g, '$1')
		.trim();
}

export function cleanCourseDisplayName(value = '', fallback = '') {
	const text = stripCourseYear(value || fallback)
		.replace(/[《》]/g, '')
		.replace(/\s*试听课\s*/g, '')
		.trim();
	return text || stripCourseYear(fallback).replace(/[《》]/g, '').replace(/\s*试听课\s*/g, '').trim();
}

export const OFFICIAL_USER = {
	phone: '15585827319',
	password: 'dyr594200',
	name: '规划提升邓老师',
	id: '33075',
	tenantId: 52
};

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
		makeTrialChapter('4.导数——单调性与极值、最值', 6),
		makeTrialChapter('5.通项公式前n项和', 6),
		makeTrialChapter('6.定值与定点问题', 2)
	],
	quizzes: [
		makeQuiz('入门测', '未学习'),
		makeQuiz('第六章 数列', '学习中：1/14')
	]
};

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
	readStudyCount: 1,
	readDuration: '00小时21分',
	progress: 1,
	versions: [
		{
			name: '2026版',
			chapters: [
				makeChapter('一、复数', [
					{ title: '1.复数乘除的模（三角法）', total: 8, read: 2 },
					{ title: '2.复数加减的模（图解法）', total: 5 },
					'3.速算复数的模运算',
					'4.零点权重思维'
				]),
				makeChapter('二、集合与不等式', [
					'5.集合与不等式（答案反代法）',
					'6.权方和不等式的应用',
					'7.万能K法解不等式',
					'8.对称法解不等式',
					'9.最大值、最小值与平凡恒等式',
					'10.充要条件的判断'
				]),
				makeChapter('三、平面向量', [
					'11.平面向量三板斧（坐标法）',
					'12.平面向量三板斧（图解法）',
					'13.平面向量三板斧（公式法）',
					'14.平面向量的基本定理与数量积的运算',
					'15.等和线、极化恒等式、向量的投影运用'
				]),
				makeChapter('四、函数与导数', [
					'16.抽象函数（构造法）',
					'17.抽象函数（赋值法）',
					'18.抽象函数广义奇偶性（图解法）',
					'19.函数的双对称和周期性（构造法）',
					'20.三次函数的图像和性质',
					'21.公切线的方程和条数（Kb法）',
					'22.指对跨界函数（改头换面）',
					'23.极值点效应（保号性定理）',
					'24.导数中的隐零点代换与估计问题',
					'25.导数中利用韦达定理研究极值点有关的双变量问题',
					'26.导数的同构体系',
					'27.构造对均不等式解决极值点偏移问题',
					'28.对数单身狗，指数找朋友',
					'29.导数邂逅三角函数'
				]),
				makeChapter('五、解三角形', [
					'30.三角形中线、角平分线、高线问题',
					'31.射影定理的核心应用',
					'32.托勒密定理的应用',
					'33.三角形面积公式大总结'
				]),
				makeChapter('六、立体几何', [
					'34.空间的线面关系（立方体法）',
					'35.立体几何（万能建系法）',
					'36.空间的外接球问题',
					'37.空间中的内切球问题',
					'38.立体几何大题动点坐标巧设'
				]),
				makeChapter('七、圆锥曲线', [
					'39.圆锥曲线难题的应对（看图说话法）',
					'40.圆锥曲线第三定义巧解选择题',
					'41.圆锥曲线非对称韦达定理',
					'42.圆锥曲线点乘双根法',
					'43.圆锥曲线齐次化',
					'44.圆锥曲线定比点差法',
					'45.圆锥曲线斜率双用',
					'46.圆锥曲线找母线',
					'47.抛物线之阿基米德三角形',
					'48.圆锥曲线的焦点三角形大总结',
					'49.椭圆和双曲线共焦点问题',
					'50.直线与圆位置关系',
					'51.椭圆的切线问题之蒙日圆',
					'52.求曲线轨迹方程的核心方法',
					'53.定比点差法破解极点、极线问题'
				]),
				makeChapter('八、概率与统计', [
					'54.三个分布列的期望、方差与性质的应用',
					'55.条件概率与全概率公式',
					'56.正态分布的核心解法',
					'57.二项式定理的核心解法',
					'58.马尔科夫链与一维游走等概率模型',
					'59.与概率相关的新定义问题'
				]),
				makeChapter('九、数列', [
					'60.等差数列的计算',
					'61.等差数列的函数属性',
					'62.周期数列的递推关系（定义法）',
					'63.错位相减法求和（公式法）',
					'64.等差三变量的方差计算（口算法）',
					'65.数列求通项问题',
					'66.数列求和问题',
					'67.数列放缩问题',
					'68.数列简单新定义问题'
				]),
				makeChapter('十、三角函数', [
					'69.三角函数的合一变形（口算法）',
					'70.一类三角函数求最值的妙招(辅助角公式)',
					'71.三角变换的三个方向',
					'72.三角函数的万能公式',
					'73.w函数卡根法模型',
					'74.三角函数的和差化积公式',
					'75.平面中的内切圆问题',
					'76.平面中的外接圆问题'
				])
			]
		},
		{
			name: '绝招课',
			chapters: [
				makeChapter('一、基础版', [
					'1.集合逻辑不等式',
					'2.函数的基本概念与表示',
					'3.指对幂',
					'4.奇偶性与单调性',
					'5.周期性与对称性',
					'6.函数的图像',
					'7.导数——切线专题',
					'8.导数——单调性与极值、最值',
					'9.导数——导函数构造基础巩固',
					'10.等差数列系统总结',
					'11.等比数列系统总结',
					'12.通项公式与前n项和',
					'13.数列秒杀技巧-特殊数列法',
					'14.三角函数恒等变换',
					'15.三角函数图像',
					'16.解三角形',
					'17.平面向量',
					'18.空间向量',
					'19.空间立体图形',
					'20.外接球与内切球',
					'21.空间最值问题',
					'22.椭圆与双曲线',
					'23.抛物线及其焦点弦',
					'24.动点轨迹方程',
					'25.联立与弦长公式',
					'26.定值与定点问题',
					'27.最值问题',
					'28.复数',
					'29.排列组合',
					'30.统计',
					'31.概率'
				]),
				makeChapter('二、进阶版', [
					'32.导函数构造不等式',
					'33.端点效应解题大招',
					'34.函数中的指对同构系统',
					'35.圆锥曲线焦点弦解题大招',
					'36.圆锥曲线—神奇三角形',
					'37.圆锥曲线中点弦解题大招',
					'38.长方体外接球体系解题大招',
					'39.侧棱垂直非Rt外接球体系',
					'40.立体几何“法向量速解”',
					'41.不等式速刷',
					'42.函数解析式、数列小题解题大招',
					'43.三角函数图像大招',
					'44.排列组合速通大招',
					'45.数列不动点求通项大招',
					'46.解析几何“对偶”绝招',
					'47.函数对称、周期双绝大招',
					'48.指对数大小判定神奇解法'
				])
			]
		}
	],
	quizzes: [
		makeQuiz('入门测', '学习中：0/20'),
		makeQuiz('第一章 集合、常用逻辑用语、不等式', '学习中：0/15'),
		makeQuiz('第二章 函数的概念及其表示', '已完成', '测评报告'),
		makeQuiz('第三章 导数', '已完成', '测评报告'),
		makeQuiz('第四章 三角函数', '未学习'),
		makeQuiz('第五章 平面向量与复数', '未学习'),
		makeQuiz('第六章 数列', '未学习'),
		makeQuiz('第七章 立体几何与空间向量', '未学习'),
		makeQuiz('第八章 直线和圆', '未学习'),
		makeQuiz('第九章 圆锥曲线', '未学习'),
		makeQuiz('第十章 统计与成对数据的统计分析', '未学习'),
		makeQuiz('第十一章 计数原理、概率、随机变量及其分布', '未学习'),
		makeQuiz('出门测', '未学习')
	]
};

export const AUTHORIZED_COURSES = [
	{ title: '《中考英语》', sub: '《中考英语》', expiry: '2026-02-15', cover: '/static/courses/zk-yingyu.jpg' },
	{ title: '《中考数学》', sub: '《中考数学》', expiry: '2026-02-14', cover: '/static/courses/zk-shuxue.jpg' },
	{ title: GAOKAO_MATH_FULL.courseName, sub: GAOKAO_MATH_FULL.introduction, expiry: '2026-05-07', cover: GAOKAO_MATH_FULL.cover, subject: 'gaokao-math' },
	{ title: '《高考英语》', sub: '《高考英语》', expiry: '2026-01-27', cover: '/static/courses/gk-yingyu-full.jpg' },
	{ title: '《高考物理》', sub: '《高考物理》', expiry: '2026-02-05', cover: '/static/courses/gk-wuli-full.jpg' }
];

export function cloneData(data) {
	return JSON.parse(JSON.stringify(data));
}

export function getGaokaoMathCourse(kind = 'full') {
	return cloneData(kind === 'trial' ? GAOKAO_MATH_TRIAL : GAOKAO_MATH_FULL);
}

export function isGaokaoMath(title = '') {
	return /高考数学|高中数学/.test(decodeURIComponent(title));
}

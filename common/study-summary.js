import { OFFICIAL_USER } from './course-data.js'

export const RATING_OPTIONS = [
	{ value: 1, label: '1星', text: '听不懂' },
	{ value: 2, label: '2星', text: '听了，没收获' },
	{ value: 3, label: '3星', text: '有一些收获' },
	{ value: 4, label: '4星', text: '有明显收获' },
	{ value: 5, label: '5星', text: '有很大收获' }
];

const LESSON_RATING_KEY = 'lessonRatings';

export function isAdminUser(user = {}) {
	return user.phone === OFFICIAL_USER.phone || user.id === OFFICIAL_USER.id || user.role === 'admin';
}

export function getLessonRatings() {
	return uni.getStorageSync(LESSON_RATING_KEY) || {};
}

export function getLessonRating(title = '') {
	return getLessonRatings()[title] || 0;
}

export function saveLessonRating(title = '', rating = 0) {
	const safeRating = Number(rating) || 0;
	if (!title || safeRating < 1 || safeRating > 5) return false;
	const ratings = getLessonRatings();
	ratings[title] = safeRating;
	uni.setStorageSync(LESSON_RATING_KEY, ratings);
	return true;
}

const STUDY_SUMMARY = {
	knowledge: {
		title: '知识点巩固',
		items: [
			{ label: '刷题数', value: '186道' },
			{ label: '正确', value: '142道' },
			{ label: '正确率', value: '76%' },
			{ label: '平均得分', value: '78分' }
		]
	},
	chapter: {
		title: '章节测评',
		items: [
			{ label: '测评次数', value: '8次' },
			{ label: '平均得分', value: '74分' }
		]
	},
	review: {
		title: '复习情况统计',
		items: [
			{ label: '复习课程完成情况', value: '68%' },
			{ label: '测评统计', value: '完成6次，平均72分' }
		]
	},
	thinking: {
		title: '思维技巧',
		items: [
			{ label: '课程完成度', value: '70%' },
			{ label: '训练做题', value: '96道' },
			{ label: '正确', value: '73道' },
			{ label: '平均得分', value: '76分' }
		]
	},
	english: {
		title: '英语外语科目',
		items: [
			{ label: '单词完成数量', value: '428个' },
			{ label: '今日完成', value: '36个' }
		]
	}
};

export const MASTERY_LEVELS = [
	{ min: 0, max: 44, label: '差', color: 'gray' },
	{ min: 45, max: 59, label: '薄弱', color: 'red' },
	{ min: 60, max: 74, label: '中等', color: 'yellow' },
	{ min: 75, max: 84, label: '良好', color: 'green' },
	{ min: 85, max: 100, label: '优秀', color: 'purple' }
];

const PLATE_SCORES = [
	{ name: '知识点巩固', score: 78 },
	{ name: '章节测评', score: 74 },
	{ name: '复习情况', score: 62 },
	{ name: '思维技巧', score: 86 },
	{ name: '真题讲练', score: 58 }
];

const ADMIN_RATING_BASE = [
	{ range: '30以内', students: 18, counts: { 1: 8, 2: 5, 3: 3, 4: 1, 5: 1 } },
	{ range: '30-50', students: 26, counts: { 1: 4, 2: 8, 3: 9, 4: 4, 5: 1 } },
	{ range: '50-70', students: 32, counts: { 1: 2, 2: 4, 3: 12, 4: 10, 5: 4 } },
	{ range: '70+', students: 41, counts: { 1: 1, 2: 2, 3: 8, 4: 16, 5: 14 } }
];

export function getMasteryLevel(score = 0) {
	const safeScore = Number(score) || 0;
	return MASTERY_LEVELS.find(item => safeScore >= item.min && safeScore <= item.max) || MASTERY_LEVELS[0];
}

export function getStudySummary() {
	return {
		sections: [STUDY_SUMMARY.knowledge, STUDY_SUMMARY.chapter, STUDY_SUMMARY.review, STUDY_SUMMARY.thinking, STUDY_SUMMARY.english],
		plateScores: PLATE_SCORES.map(item => ({
			...item,
			level: getMasteryLevel(item.score)
		}))
	};
}

export function getAdminRatingStats() {
	const localRatings = getLessonRatings();
	const totalCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
	ADMIN_RATING_BASE.forEach(group => {
		Object.keys(totalCounts).forEach(star => {
			totalCounts[star] += group.counts[star] || 0;
		});
	});
	Object.values(localRatings).forEach(rating => {
		if (totalCounts[rating] !== undefined) totalCounts[rating] += 1;
	});
	const chapterTotal = Object.values(totalCounts).reduce((sum, count) => sum + count, 0);
	const weightedTotal = Object.keys(totalCounts).reduce((sum, star) => sum + Number(star) * totalCounts[star], 0);
	const average = chapterTotal ? (weightedTotal / chapterTotal).toFixed(1) : '0.0';

	return {
		average,
		chapterTotal,
		totalCounts,
		localRatings,
		groups: ADMIN_RATING_BASE
	};
}

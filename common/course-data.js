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

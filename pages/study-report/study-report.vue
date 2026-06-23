<template>
	<view class="page">
		<view class="nav"><view class="back" @click="goBack">‹</view><view class="nav-title">学习报告</view></view>

		<view class="course-card">
			<view class="course-label">课程名字：</view>
			<view class="course-name">{{courseTitle}}</view>
		</view>

		<view class="panel learning-panel" :class="{collapsed: !showLearningRecords}">
			<view class="panel-head" @click="showLearningRecords = !showLearningRecords">
				<view>
					<view class="panel-title">学习记录</view>
					<view class="detail-sub">默认收起，展开后按日期倒序查看本课程所有视频学习记录。</view>
				</view>
				<view class="panel-toggle">{{showLearningRecords ? '收起' : '展开'}}</view>
			</view>
			<view class="record-grid" v-if="report.learningStats">
				<view><text>{{report.learningStats.todayText || '0分钟'}}</text><small>今日学习</small></view>
				<view><text>{{report.learningStats.weekText || '0分钟'}}</text><small>本周学习</small></view>
				<view><text>{{report.learningStats.totalText || '0分钟'}}</text><small>累计时长</small></view>
			</view>
			<view class="learning-body" v-if="showLearningRecords">
				<view class="record-tools">
					<picker mode="date" :value="recordDateFilter" @change="onRecordDateChange">
						<view class="date-filter">{{recordDateFilter || '全部日期'}}</view>
					</picker>
					<view class="clear-filter" v-if="recordDateFilter" @click.stop="recordDateFilter = ''">清除</view>
				</view>
				<view class="record-list">
					<view class="record video-record" v-for="item in filteredLearningRecords" :key="item.key">
						<view class="record-main">
							<view class="record-title">{{item.title}}</view>
							<view class="record-time">记录时间：{{item.timeText}}</view>
						</view>
						<view class="record-duration">学习时长 {{item.durationText}}</view>
					</view>
				</view>
				<view class="empty" v-if="!filteredLearningRecords.length">{{recordDateFilter ? '该日期暂无学习记录' : '暂无学习记录'}}</view>
			</view>
		</view>

		<view class="summary-grid">
			<view class="summary-item" @click="showPractice = !showPractice">
				<view class="summary-label">真题讲练</view>
				<view class="summary-value">{{practiceCount}}道</view>
				<view class="summary-tip">点击查看练习明细</view>
			</view>
			<view class="summary-item" :class="{readonly: readOnly}" @click="goWrongBook">
				<view class="summary-label">错题</view>
				<view class="summary-value">{{wrongCount}}道</view>
				<view class="summary-tip">{{readOnly ? '只读统计' : '进入错题复盘'}}</view>
			</view>
			<view class="summary-item" :class="metricWarningClass({ label: '正确率', value: accuracyText })">
				<view class="summary-label">正确率</view>
				<view class="summary-value">{{accuracyText}}</view>
				<view class="summary-tip">按已做题统计</view>
			</view>
		</view>

		<view class="detail-panel" :class="{collapsed: !showCourseRecords}">
			<view class="panel-head" @click="showCourseRecords = !showCourseRecords">
				<view>
					<view class="panel-title">课程记录与练习明细</view>
					<view class="detail-sub">默认收起，点击展开查看课程进度、章节扫雷、复习测试和真题统计。</view>
				</view>
				<view class="panel-toggle">{{showCourseRecords ? '收起' : '展开'}}</view>
			</view>
			<view class="detail-body" v-if="showCourseRecords">
			<view class="track-grid">
				<view class="track-card" v-for="item in courseTrackRows" :key="item.name">
					<view class="track-head">
						<view class="track-name">{{item.name}}</view>
						<view class="track-progress-text">{{item.progress}}%</view>
					</view>
					<view class="track-progress"><view :style="{width:item.progress + '%'}"></view></view>
					<view class="track-meta">
						<text>今日 {{item.today}}</text>
						<text>本周 {{item.week}}</text>
						<text>累计 {{item.total}}</text>
					</view>
					<view class="track-foot">
						<text>总节数 {{item.totalLessons}}节</text>
						<text>已学习 {{item.learnedLessons}}节</text>
						<text>累计打卡 {{item.checkins}}天</text>
					</view>
				</view>
			</view>
			<view class="report-stat-list">
				<view class="report-stat-row" v-for="item in reportDetailRows" :key="item.name">
					<view class="report-stat-title">{{item.name}}</view>
					<view class="report-metrics">
						<view class="report-metric" :class="metricWarningClass(metric)" v-for="metric in item.metrics" :key="metric.label">
							<text>{{metric.label}}</text>
							<text class="metric-value">{{metric.value}}</text>
						</view>
					</view>
				</view>
			</view>
			</view>
		</view>

		<view class="panel" v-if="showPractice">
			<view class="panel-title">真题讲练明细</view>
			<view class="practice-row" v-for="item in practiceRows" :key="item.id || item.createdAt || item.title" @click="selectedPractice = item">
				<text>{{item.title || '真题讲练'}}</text>
				<text>{{item.score || item.averageScore || 0}}分</text>
			</view>
			<view class="empty" v-if="!practiceRows.length">暂无真题讲练记录</view>
			<view class="practice-detail" v-if="selectedPractice">
				<view class="detail-title">{{selectedPractice.title || '练习详情'}}｜评分 {{selectedPractice.score || selectedPractice.averageScore || 0}} 分</view>
				<view class="question" v-for="detail in selectedPractice.details || []" :key="detail.id || detail.stem">
					<math-rich-text class="question-stem" :text="detail.stem" />
					<question-audio-player :src="stemAudio(detail)" />
					<view class="question-result" :class="{wrong: !detail.correct && !detail.manualReview, review: detail.manualReview}">{{detail.manualReview ? '已提交' : (detail.correct ? '正确' : '错误')}}</view>
					<analysis-viewer :item="detail" :text="detail.analysis" />
				</view>
			</view>
		</view>

		<view class="panel practice-stats-panel" :class="{collapsed: !showPracticeStats}">
			<view class="panel-head" @click="showPracticeStats = !showPracticeStats">
				<view>
					<view class="panel-title">练习统计</view>
					<view class="detail-sub">默认收起，展开后查看本课程练习、复习测试和线下自评统计。</view>
				</view>
				<view class="panel-toggle">{{showPracticeStats ? '收起' : '展开'}}</view>
			</view>
			<view class="practice-stats-body" v-if="showPracticeStats">
				<view class="row practice-stat-row" v-for="item in recentRows" :key="item._key">
					<view class="practice-stat-main">
						<view class="practice-stat-title">{{item.title}}</view>
						<view class="practice-stat-time">练习时间：{{item.practiceTimeText}}</view>
					</view>
					<view class="practice-stat-score">平均{{item.averageScore || item.score || 0}}分，错题{{item.wrongCount || 0}}道</view>
				</view>
				<view class="empty" v-if="!recentRows.length">暂无练习统计</view>
			</view>
		</view>

		<view class="panel" v-if="offlineRows.length">
			<view class="panel-title">线下试卷自评</view>
			<view class="row practice-stat-row" v-for="item in offlineRows" :key="item.id">
				<view class="practice-stat-main">
					<view class="practice-stat-title">{{item.title}}</view>
					<view class="practice-stat-time">练习时间：{{formatPracticeTime(item)}}</view>
				</view>
				<view class="practice-stat-score">{{item.score}}/{{item.totalScore}}分，错题{{item.wrongCount}}道</view>
			</view>
		</view>

		<view class="panel" v-if="suggestions.length">
			<view class="panel-title">学习建议</view>
			<view class="suggestion" v-for="item in suggestions" :key="item">{{item}}</view>
		</view>
	</view>
</template>

<script>
import { getStudyReport } from '@/common/api.js'
import { stripCourseYear } from '@/common/course-data.js'
import { safeNavigateBack } from '@/common/navigation.js'
import AnalysisViewer from '@/components/analysis-viewer.vue'
import MathRichText from '@/components/math-rich-text.vue'
import QuestionAudioPlayer from '@/components/question-audio-player.vue'

const REVIEW_KEY = 'offlineExamReviews';

export default {
	components: { AnalysisViewer, MathRichText, QuestionAudioPlayer },
	data() {
		return {
			report: { overview:[], attempts:[], recentPractice:[], suggestions:[] },
			courseId: 'gk-math-full',
			userId: '',
			readOnly: false,
			showPractice: false,
			showLearningRecords: false,
			showCourseRecords: false,
			showPracticeStats: false,
			recordDateFilter: '',
			selectedPractice: null,
			offlineReviews: []
		}
	},
	computed: {
		courseTitle() {
			return stripCourseYear(this.report.courseTitle || this.report.courseName || '高考数学');
		},
		recentRows() {
			const rows = this.report.recentPractice && this.report.recentPractice.length ? this.report.recentPractice : (this.report.attempts || []);
			return rows
				.concat(this.offlineRows)
				.map((item, index) => this.normalizePracticeRecord(item, index))
				.sort((a, b) => b.practiceTimeValue - a.practiceTimeValue);
		},
		offlineRows() {
			return this.offlineReviews
				.filter(item => !item.courseId || item.courseId === this.courseId)
				.map(item => ({
					...item,
					averageScore: item.totalScore ? Math.round(Number(item.score) * 100 / Number(item.totalScore)) : item.score,
					total: item.totalScore,
					correct: item.score
				}));
		},
		practiceRows() {
			return (this.report.practiceRows && this.report.practiceRows.length ? this.report.practiceRows : (this.report.attempts || [])).filter(item => item.type !== 'quiz');
		},
		chapterRows() {
			return this.report.chapterSweep || (this.report.attempts || []).filter(item => item.type === 'quiz');
		},
		learningRecords() {
			return (this.report.learningStats && this.report.learningStats.records) || this.report.learningRecords || [];
		},
		sortedLearningRecords() {
			return this.learningRecords
				.map((item, index) => this.normalizeLearningRecord(item, index))
				.sort((a, b) => b.timeValue - a.timeValue);
		},
		filteredLearningRecords() {
			if (!this.recordDateFilter) return this.sortedLearningRecords;
			return this.sortedLearningRecords.filter(item => item.dateText === this.recordDateFilter);
		},
		practiceCount() {
			if (this.report.practiceCount !== undefined) return this.report.practiceCount;
			return this.practiceRows.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
		},
		wrongCount() {
			const offlineWrong = this.offlineRows.reduce((sum, item) => sum + (Number(item.wrongCount) || 0), 0);
			if (this.report.wrongCount !== undefined) return this.report.wrongCount + offlineWrong;
			return this.recentRows.reduce((sum, item) => sum + (Number(item.wrongCount) || 0), 0);
		},
		accuracyText() {
			if (this.report.accuracy !== undefined && !this.offlineRows.length) return `${this.report.accuracy}%`;
			const rows = (this.report.attempts || []).concat(this.offlineRows);
			const total = rows.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
			const correct = rows.reduce((sum, item) => sum + (Number(item.correct) || 0), 0);
			return total ? `${Math.round(correct / total * 100)}%` : '0%';
		},
		suggestions() {
			return this.report.suggestions || [];
		},
		courseTrackRows() {
			const stats = this.report.learningStats || {};
			const totalLessons = Number(this.report.totalLessons || (this.report.course && this.report.course.totalLessons) || 0);
			const learnedLessons = Number(this.report.readStudyCount || (this.report.course && this.report.course.readStudyCount) || 0);
			const progress = Number(this.report.progress !== undefined ? this.report.progress : (totalLessons ? Math.round(learnedLessons * 100 / totalLessons) : 0));
			const base = {
				today: stats.todayText || '0分钟',
				week: stats.weekText || '0分钟',
				total: stats.totalText || '0分钟',
				totalLessons,
				learnedLessons,
				progress: Math.max(0, Math.min(100, progress || 0)),
				checkins: Number(this.report.checkinDays || stats.checkinDays || 0)
			};
			return [
				{ name:'复习加强课', ...base },
				{ name:'技巧绝招', ...base }
			];
		},
		reportDetailRows() {
			const chapterRows = this.chapterRows;
			const attempts = this.report.attempts || [];
			const reinforceRows = attempts.filter(item => item.type === 'reinforce');
			const retryRows = attempts.filter(item => item.type === 'wrongRetry');
			const practiceRows = this.practiceRows.filter(item => item.type !== 'reinforce' && item.type !== 'wrongRetry');
			const favoriteRows = this.report.favoriteRows || this.report.favoritePractice || [];
			const offlineRows = this.offlineRows;
			return [
				this.buildTestStats('章节扫雷', chapterRows, '测试', '平均得分'),
				this.buildTestStats('复习测试', reinforceRows, '测试', '平均得分'),
				this.buildPracticeStats('真题讲练', practiceRows, '完成', '正确率'),
				this.buildWrongRetryStats(retryRows),
				this.buildPracticeStats('我的收藏', favoriteRows, '完成', '正确率'),
				this.buildOfflineStats(offlineRows)
			];
		}
	},
	onLoad(opts = {}) {
		this.courseId = opts.courseId || 'gk-math-full';
		this.userId = opts.studentId || opts.userId || '';
		this.readOnly = opts.readonly === '1' || opts.readOnly === '1' || opts.readonly === true;
		this.offlineReviews = uni.getStorageSync(REVIEW_KEY) || [];
		this.loadData();
	},
	methods: {
		async loadData() {
			try {
				this.report = await getStudyReport(this.courseId, this.userId);
				this.selectedPractice = this.practiceRows[0] || null;
			} catch (err) {
				console.warn('学习报告接口不可用，使用本地报告', err);
				this.report = this.localReport();
				this.selectedPractice = this.practiceRows[0] || null;
			}
		},
		onRecordDateChange(e) {
			this.recordDateFilter = e.detail.value || '';
		},
		stemAudio(item = {}) {
			return item.stemAudioUrl || item.questionAudioUrl || item.audioUrl || item.stemAudio || '';
		},
		normalizeLearningRecord(item = {}, index = 0) {
			const rawTime = item.recordTime || item.learnTime || item.watchTime || item.updatedAt || item.createdAt || item.time || item.date || '';
			const date = this.toValidDate(rawTime);
			const title = item.lessonTitle || item.videoTitle || item.videoName || item.chapterTitle || item.chapterName || item.title || item.name || '课程视频';
			return {
				key: item.id || item.recordId || `${title}-${rawTime}-${index}`,
				title,
				timeValue: date ? date.getTime() : 0,
				timeText: this.formatDateTime(date, rawTime),
				dateText: this.formatDate(date, rawTime),
				durationText: this.formatDuration(item.duration || item.watchDuration || item.learnDuration || item.seconds || item.studySeconds || item.studyTime || item.timeLong)
			};
		},
		toValidDate(value) {
			if (!value) return null;
			if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
			const str = String(value).trim();
			// 后端返回形如 2026-06-17T20:55:56.214090116（带 T 分隔符与纳秒），
			// 用正则提取年月日时分秒，避免 new Date 在不同平台上解析失败。
			const match = str.match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:[ T](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/);
			if (match) {
				const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), Number(match[4] || 0), Number(match[5] || 0), Number(match[6] || 0));
				return Number.isNaN(date.getTime()) ? null : date;
			}
			const fallback = new Date(str.replace(/-/g, '/'));
			return Number.isNaN(fallback.getTime()) ? null : fallback;
		},
		formatDate(date, fallback = '') {
			if (!date) return String(fallback).slice(0, 10) || '--';
			const pad = value => String(value).padStart(2, '0');
			return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
		},
		formatDateTime(date, fallback = '') {
			if (!date) return fallback || '--';
			const pad = value => String(value).padStart(2, '0');
			// 统一展示为【年月日时分秒】：2026-06-17 20:55:56
			return `${this.formatDate(date)} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
		},
		normalizePracticeRecord(item = {}, index = 0) {
			const rawTime = this.practiceTimeValue(item);
			const date = this.toValidDate(rawTime);
			const title = item.title || item.name || '练习记录';
			return {
				...item,
				_key: item.id || item.recordId || `${title}-${rawTime || index}`,
				practiceTimeValue: date ? date.getTime() : 0,
				practiceTimeText: this.formatPracticeTime(item)
			};
		},
		practiceTimeValue(item = {}) {
			return item.practiceTime || item.completedAt || item.recordTime || item.updatedAt || item.createdAt || item.time || '';
		},
		formatPracticeTime(item = {}) {
			const rawTime = this.practiceTimeValue(item);
			const date = this.toValidDate(rawTime);
			// 统一展示为【年月日时分秒】，与学习记录保持一致
			return this.formatDateTime(date, rawTime);
		},
		formatDuration(value) {
			if (value === undefined || value === null || value === '') return '--';
			if (typeof value === 'string' && /[分秒小时]/.test(value)) return value;
			const seconds = Number(value);
			if (!Number.isFinite(seconds)) return String(value);
			if (seconds >= 3600) {
				const hours = Math.floor(seconds / 3600);
				const minutes = Math.round((seconds % 3600) / 60);
				return minutes ? `${hours}小时${minutes}分钟` : `${hours}小时`;
			}
			if (seconds >= 60) return `${Math.round(seconds / 60)}分钟`;
			return `${Math.max(0, Math.round(seconds))}秒`;
		},
		buildTestStats(name, rows = [], actionLabel = '测试', scoreLabel = '平均得分') {
			const todayRows = this.todayRows(rows);
			return {
				name,
				metrics: [
					{ label:`今日${actionLabel}`, value:`${todayRows.length}次` },
					{ label:`累计${actionLabel}`, value:`${rows.length}次` },
					{ label:'今日错题', value:`${this.sumField(todayRows, 'wrongCount')}道` },
					{ label:'累计错题', value:`${this.sumField(rows, 'wrongCount')}道` },
					{ label:scoreLabel, value:`${this.averageScoreOf(rows)}分` }
				]
			};
		},
		buildPracticeStats(name, rows = [], actionLabel = '完成', rateLabel = '正确率') {
			const todayRows = this.todayRows(rows);
			return {
				name,
				metrics: [
					{ label:`今日${actionLabel}`, value:`${todayRows.length}道` },
					{ label:`累计${actionLabel}`, value:`${this.totalQuestions(rows)}道` },
					{ label:'今日错题', value:`${this.sumField(todayRows, 'wrongCount')}道` },
					{ label:'累计错题', value:`${this.sumField(rows, 'wrongCount')}道` },
					{ label:rateLabel, value:this.accuracyFromRows(rows) }
				]
			};
		},
		buildWrongRetryStats(rows = []) {
			const todayRows = this.todayRows(rows);
			const totalWrong = this.wrongCount;
			const mastered = Math.max(0, totalWrong - this.sumField(rows, 'wrongCount'));
			return {
				name:'错题重练',
				metrics: [
					{ label:'今日完成', value:`${todayRows.length}道` },
					{ label:'累计完成', value:`${this.totalQuestions(rows)}道` },
					{ label:'总错题', value:`${totalWrong}道` },
					{ label:'未掌握', value:`${this.sumField(rows, 'wrongCount')}道` },
					{ label:'已掌握', value:`${mastered}道` },
					{ label:'掌握率', value:this.accuracyFromRows(rows) }
				]
			};
		},
		buildOfflineStats(rows = []) {
			const todayRows = this.todayRows(rows);
			return {
				name:'线下试卷',
				metrics: [
					{ label:'今日上传', value:`${todayRows.length}次` },
					{ label:'累计上传', value:`${rows.length}次` },
					{ label:'今日错题', value:`${this.sumField(todayRows, 'wrongCount')}道` },
					{ label:'累计错题', value:`${this.sumField(rows, 'wrongCount')}道` },
					{ label:'平均得分', value:`${this.averageScoreOf(rows)}分` }
				]
			};
		},
		todayRows(rows = []) {
			return rows.filter(item => this.isToday(item.createdAt || item.completedAt || item.updatedAt || item.time));
		},
		isToday(value) {
			if (!value) return false;
			const date = new Date(value);
			if (Number.isNaN(date.getTime())) return false;
			const now = new Date();
			return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate();
		},
		sumField(rows = [], field) {
			return rows.reduce((sum, item) => sum + (Number(item[field]) || 0), 0);
		},
		totalQuestions(rows = []) {
			return rows.reduce((sum, item) => sum + (Number(item.total || item.count || 1) || 1), 0);
		},
		averageScoreOf(rows = []) {
			if (!rows.length) return 0;
			return Math.round(rows.reduce((sum, item) => sum + (Number(item.averageScore || item.score) || 0), 0) / rows.length);
		},
		accuracyFromRows(rows = []) {
			const total = rows.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
			const correct = rows.reduce((sum, item) => sum + (Number(item.correct) || 0), 0);
			if (total) return `${Math.round(correct * 100 / total)}%`;
			return rows.length ? `${Math.max(0, 100 - this.sumField(rows, 'wrongCount') * 10)}%` : '0%';
		},
		metricWarningClass(metric = {}) {
			const label = String(metric.label || '');
			if (!/(平均得分|正确率)/.test(label)) return '';
			return `metric-warning metric-warning-${this.metricWarningLevel(metric.value)}`;
		},
		metricWarningLevel(value = '') {
			const score = this.metricNumber(value);
			if (score >= 70) return 'success';
			if (score >= 60) return 'warning';
			return 'danger';
		},
		metricNumber(value = '') {
			const match = String(value).match(/\d+(?:\.\d+)?/);
			return match ? Number(match[0]) : 0;
		},
		localReport() {
			return {
				courseTitle: this.courseId.includes('yingyu') ? '高考英语' : '高考数学',
				totalLessons: 22,
				readStudyCount: 5,
				progress: 23,
				checkinDays: 1,
				learningStats: {
					todayText: '5秒',
					weekText: '25秒',
					totalText: '25秒',
					records: [
						{ lessonTitle:'根据实际问题选择函数类型', duration:'5秒', updatedAt:'2026-06-01 16:25' },
						{ lessonTitle:'33.端点效应解题大招', duration:'5秒', updatedAt:'2026-06-01 16:18' },
						{ lessonTitle:'2.复数加减的模（图解法）', duration:'5秒', updatedAt:'2026-05-31 20:12' },
						{ lessonTitle:'1.复数乘除的模（三角法）', duration:'5秒', updatedAt:'2026-05-30 18:06' }
					]
				},
				averageScore: 100,
				wrongCount: 3,
				practiceCount: 3,
				accuracy: 76,
				attempts: [
					{ id:'local-report-1', title:'高考数学 我的收藏 真题讲练', type:'practice', score:100, total:1, correct:1, wrongCount:0, details:[
						{ id:'q1', stem:'函数 f(x)=x^2 在 x=2 处的导数为', correct:true, analysis:'f′(x)=2x，代入 x=2 得 4。' }
					] }
				],
				recentPractice: [{ id:'local-practice-1', title:'高考数学 真题讲练', averageScore:100, wrongCount:0, createdAt:'2026-06-08 11:30:00' }]
			};
		},
		goWrongBook() {
			if (this.readOnly) {
				uni.showToast({ title:'只读查看，不能操作错题', icon:'none' });
				return;
			}
			uni.navigateTo({ url:`/pages/wrongbook/wrongbook?courseId=${encodeURIComponent(this.courseId)}` });
		},
		goBack() { safeNavigateBack('/pages/mycourse/mycourse'); }
	}
}
</script>

<style lang="scss">
page { background:#f5f7fa; }
.page { min-height:100vh; background:#f5f7fa; padding-bottom:40rpx; }
.nav { position:relative; height:90rpx; background:#fff; display:flex; align-items:center; justify-content:center; border-bottom:1rpx solid #eef0f3; }
.back { position:absolute; left:24rpx; font-size:46rpx; color:#222; cursor:pointer; }
.nav-title { font-size:30rpx; font-weight:700; }
.course-card, .panel, .detail-panel { margin:24rpx; padding:26rpx; background:#fff; border-radius:16rpx; border:1rpx solid #edf0f4; }
.course-card { display:flex; align-items:center; gap:14rpx; flex-wrap:wrap; }
.course-label { color:#697386; font-size:24rpx; font-weight:700; }
.course-name { color:#222; font-size:32rpx; font-weight:900; line-height:1.25; }
.summary-grid { display:grid; grid-template-columns:1fr 1fr 1fr; gap:14rpx; padding:0 24rpx; }
.summary-item { background:#fff; border:1rpx solid #edf0f4; border-radius:16rpx; padding:22rpx 14rpx; min-height:150rpx; box-sizing:border-box; }
.summary-label { color:#596272; font-size:24rpx; font-weight:700; }
.summary-value { color:#1677ff; font-size:36rpx; font-weight:900; margin-top:8rpx; }
.summary-tip { color:#9aa3af; font-size:20rpx; margin-top:6rpx; line-height:1.3; }
.panel-title { font-size:32rpx; color:#222; font-weight:800; margin-bottom:18rpx; }
.learning-panel {
	margin-top:18rpx;
	border-color:#dfe7f0;
	box-shadow:0 12rpx 28rpx rgba(31,41,51,.045);
}
.learning-panel .record-grid {
	margin-top:18rpx;
}
.learning-body { margin-top:16rpx; }
.record-tools {
	display:flex;
	align-items:center;
	justify-content:space-between;
	gap:16rpx;
	margin-bottom:14rpx;
}
.date-filter {
	min-width:160rpx;
	height:56rpx;
	line-height:56rpx;
	padding:0 22rpx;
	border-radius:999rpx;
	background:#eef5ff;
	color:#1677ff;
	font-size:24rpx;
	font-weight:900;
	box-sizing:border-box;
}
.clear-filter {
	height:52rpx;
	line-height:52rpx;
	padding:0 18rpx;
	border-radius:999rpx;
	background:#f3f6fa;
	color:#667085;
	font-size:23rpx;
	font-weight:800;
}
.record-list {
	margin-top:10rpx;
	border-radius:14rpx;
	overflow:hidden;
	border:1rpx solid #edf2f7;
}
.record-list .record {
	padding:18rpx 20rpx;
	background:#fff;
}
.video-record {
	align-items:flex-start;
}
.record-main {
	flex:1;
	min-width:0;
}
.record-title {
	color:#111827;
	font-size:27rpx;
	font-weight:800;
	line-height:1.45;
	overflow:hidden;
	text-overflow:ellipsis;
	white-space:nowrap;
}
.record-time {
	margin-top:8rpx;
	color:#667085;
	font-size:23rpx;
	line-height:1.35;
}
.record-duration {
	flex-shrink:0;
	color:#111827;
	font-size:25rpx;
	font-weight:800;
	line-height:1.45;
	text-align:right;
}
.panel-head {
	display:flex;
	align-items:flex-start;
	justify-content:space-between;
	gap:18rpx;
	cursor:pointer;
}
.panel-head .panel-title {
	margin-bottom:8rpx;
}
.panel-toggle {
	flex-shrink:0;
	min-width:88rpx;
	height:52rpx;
	line-height:52rpx;
	text-align:center;
	border-radius:999rpx;
	background:#eef5ff;
	color:#1677ff;
	font-size:24rpx;
	font-weight:900;
}
.detail-panel.collapsed {
	padding-bottom:22rpx;
}
.practice-stats-panel.collapsed {
	padding-bottom:22rpx;
}
.detail-body {
	margin-top:18rpx;
}
.practice-stats-body {
	margin-top:18rpx;
}
.detail-sub { color:#8a94a3; font-size:24rpx; line-height:1.45; margin-top:-8rpx; margin-bottom:20rpx; }
.track-grid { display:grid; grid-template-columns:1fr 1fr; gap:16rpx; margin-bottom:20rpx; }
.track-card { padding:18rpx; border-radius:12rpx; background:#f8fafc; border:1rpx solid #e6edf5; }
.track-head { display:flex; align-items:center; justify-content:space-between; gap:12rpx; }
.track-name { color:#1f2933; font-size:27rpx; font-weight:900; }
.track-progress-text { color:#1677ff; font-size:25rpx; font-weight:900; }
.track-progress { margin-top:14rpx; height:12rpx; background:#e8edf3; border-radius:999rpx; overflow:hidden; }
.track-progress view { height:100%; background:#20b486; border-radius:999rpx; }
.track-meta, .track-foot { display:flex; flex-wrap:wrap; gap:10rpx 16rpx; margin-top:14rpx; color:#667085; font-size:22rpx; line-height:1.45; }
.track-foot { color:#475467; }
.report-stat-list { border-top:1rpx solid #eef0f3; }
.report-stat-row { padding:20rpx 0; border-bottom:1rpx solid #eef0f3; }
.report-stat-row:last-child { border-bottom:0; padding-bottom:0; }
.report-stat-title { color:#1f2933; font-size:28rpx; font-weight:900; margin-bottom:14rpx; }
.report-metrics { display:grid; grid-template-columns:repeat(3, 1fr); gap:12rpx; }
.report-metric { min-height:70rpx; border-radius:10rpx; background:#f8fafc; padding:12rpx; color:#667085; font-size:22rpx; box-sizing:border-box; }
.metric-value { display:block; margin-top:6rpx; color:#1f2933; font-size:25rpx; font-weight:900; }
.metric-warning-danger { background:#fff5f5; border:1rpx solid #ffd6d9; }
.metric-warning-warning { background:#fff8e6; border:1rpx solid #f4d38a; }
.metric-warning-success { background:#effaf4; border:1rpx solid #bfe6d1; }
.metric-warning-danger .summary-value, .metric-warning-danger .metric-value { color:#e5484d; }
.metric-warning-warning .summary-value, .metric-warning-warning .metric-value { color:#b7791f; }
.metric-warning-success .summary-value, .metric-warning-success .metric-value { color:#16a36b; }
.practice-row, .row, .record { display:flex; justify-content:space-between; gap:18rpx; padding:18rpx 0; border-bottom:1rpx solid #eef0f3; font-size:27rpx; color:#333; }
.practice-row:last-child, .row:last-child, .record:last-child { border-bottom:0; }
.practice-stat-row { align-items:flex-start; }
.practice-stat-main { flex:1; min-width:0; }
.practice-stat-title {
	color:#1f2933;
	font-size:27rpx;
	font-weight:800;
	line-height:1.45;
	overflow:hidden;
	text-overflow:ellipsis;
	white-space:nowrap;
}
.practice-stat-time {
	margin-top:8rpx;
	color:#8a5360;
	font-size:23rpx;
	line-height:1.35;
}
.practice-stat-score {
	flex-shrink:0;
	color:#1f2933;
	font-size:25rpx;
	font-weight:800;
	line-height:1.45;
	text-align:right;
}
.practice-detail { margin-top:18rpx; padding:20rpx; border-radius:14rpx; background:#f8fafc; }
.detail-title { color:#222; font-size:27rpx; font-weight:800; margin-bottom:14rpx; }
.question { padding:16rpx 0; border-top:1rpx dashed #dfe5ec; }
.question:first-child { border-top:0; }
.question-stem { color:#222; font-size:26rpx; line-height:1.5; font-weight:700; }
.question-result { display:inline-block; margin-top:10rpx; color:#0f9f6e; font-size:24rpx; font-weight:800; }
.question-result.wrong { color:#e5484d; }
.question-result.review { color:#1677ff; }
.question-line { color:#596272; font-size:24rpx; line-height:1.5; margin-top:8rpx; }
.record-grid { display:grid; grid-template-columns:1fr 1fr 1fr; gap:12rpx; margin-bottom:10rpx; }
.record-grid view { background:#f8fafc; border-radius:12rpx; padding:16rpx 8rpx; text-align:center; }
.record-grid text { display:block; color:#1677ff; font-size:27rpx; font-weight:900; }
.record-grid small { display:block; color:#8a94a3; font-size:20rpx; margin-top:6rpx; }
.suggestion { padding:16rpx 0; border-bottom:1rpx solid #eef0f3; color:#333; font-size:27rpx; line-height:1.5; }
.suggestion:last-child { border-bottom:0; }
.empty { color:#8a94a3; font-size:26rpx; padding:20rpx 0; }
@media screen and (max-width: 420px) {
	.track-grid { grid-template-columns:1fr; }
	.report-metrics { grid-template-columns:1fr 1fr; }
}
</style>

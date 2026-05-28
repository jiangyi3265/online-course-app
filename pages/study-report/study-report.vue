<template>
	<view class="page">
		<view class="nav"><view class="back" @click="goBack">‹</view><view class="nav-title">学习报告</view></view>

		<view class="course-card">
			<view class="course-label">课程名字：</view>
			<view class="course-name">{{courseTitle}}</view>
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
			<view class="summary-item">
				<view class="summary-label">正确率</view>
				<view class="summary-value">{{accuracyText}}</view>
				<view class="summary-tip">按已做题统计</view>
			</view>
		</view>

		<view class="detail-panel">
			<view class="panel-title">学习报告功能细节</view>
			<view class="detail-sub">课程学习统计和练习统计会在这里合并展示。</view>
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
						<view class="report-metric" v-for="metric in item.metrics" :key="metric.label">
							<text>{{metric.label}}</text>
							<text class="metric-value">{{metric.value}}</text>
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
					<view class="question-stem">{{detail.stem}}</view>
					<view class="question-result" :class="{wrong: !detail.correct}">{{detail.correct ? '正确' : '错误'}}</view>
					<analysis-viewer :item="detail" :text="detail.analysis" />
				</view>
			</view>
		</view>

		<view class="panel">
			<view class="panel-title">学习记录</view>
			<view class="record-grid" v-if="report.learningStats">
				<view><text>{{report.learningStats.todayText || '0分钟'}}</text><small>今日学习</small></view>
				<view><text>{{report.learningStats.weekText || '0分钟'}}</text><small>本周学习</small></view>
				<view><text>{{report.learningStats.totalText || '0分钟'}}</text><small>累计时长</small></view>
			</view>
			<view class="record" v-for="item in learningRecords" :key="item.lessonTitle + item.updatedAt">
				<text>{{item.lessonTitle || '课程学习'}}</text>
				<text>{{item.duration || item.updatedAt || ''}}</text>
			</view>
			<view class="empty" v-if="!learningRecords.length">暂无学习记录</view>
		</view>

		<view class="panel">
			<view class="panel-title">平均得分（满分 100）</view>
			<view class="score-line"><text>{{averageScore}}分</text><view class="score-bar"><view :style="{width: averageScore + '%'}"></view></view></view>
		</view>

		<view class="panel">
			<view class="panel-title">章节扫雷</view>
			<view class="row" v-for="item in chapterRows" :key="item.id || item.title">
				<text>{{item.title || item.name}}</text><text>{{item.score || item.averageScore || 0}}分</text>
			</view>
			<view class="empty" v-if="!chapterRows.length">暂无章节扫雷记录</view>
		</view>

		<view class="panel">
			<view class="panel-title">练习统计</view>
			<view class="row" v-for="item in recentRows" :key="item.id || item.createdAt || item.title">
				<text>{{item.title}}</text><text>平均{{item.averageScore || item.score || 0}}分，错题{{item.wrongCount || 0}}道</text>
			</view>
			<view class="empty" v-if="!recentRows.length">暂无练习统计</view>
		</view>

		<view class="panel" v-if="offlineRows.length">
			<view class="panel-title">线下试卷自评</view>
			<view class="row" v-for="item in offlineRows" :key="item.id">
				<text>{{item.title}}</text><text>{{item.score}}/{{item.totalScore}}分，错题{{item.wrongCount}}道</text>
			</view>
		</view>

		<view class="panel" v-if="plateRows.length">
			<view class="panel-title">学习报告细节</view>
			<view class="plate-row" v-for="item in plateRows" :key="item.name">
				<text>{{item.name}}</text>
				<view class="plate-score"><text>{{item.score}}分</text><small>{{item.level && item.level.label}}</small></view>
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
import AnalysisViewer from '@/components/analysis-viewer.vue'

const REVIEW_KEY = 'offlineExamReviews';

export default {
	components: { AnalysisViewer },
	data() {
		return {
			report: { overview:[], attempts:[], recentPractice:[], suggestions:[] },
			courseId: 'gk-math-full',
			userId: '',
			readOnly: false,
			showPractice: false,
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
			return rows.concat(this.offlineRows);
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
		practiceCount() {
			if (this.report.practiceCount !== undefined) return this.report.practiceCount;
			return this.practiceRows.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
		},
		wrongCount() {
			const offlineWrong = this.offlineRows.reduce((sum, item) => sum + (Number(item.wrongCount) || 0), 0);
			if (this.report.wrongCount !== undefined) return this.report.wrongCount + offlineWrong;
			return this.recentRows.reduce((sum, item) => sum + (Number(item.wrongCount) || 0), 0);
		},
		averageScore() {
			const value = Number(this.report.averageScore);
			if (!Number.isNaN(value) && value > 0 && !this.offlineRows.length) return Math.min(100, value);
			const rows = this.recentRows;
			if (!rows.length) return 0;
			return Math.round(rows.reduce((sum, item) => sum + (Number(item.averageScore || item.score) || 0), 0) / rows.length);
		},
		accuracyText() {
			if (this.report.accuracy !== undefined && !this.offlineRows.length) return `${this.report.accuracy}%`;
			const rows = (this.report.attempts || []).concat(this.offlineRows);
			const total = rows.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
			const correct = rows.reduce((sum, item) => sum + (Number(item.correct) || 0), 0);
			return total ? `${Math.round(correct / total * 100)}%` : '0%';
		},
		plateRows() {
			return (this.report.summary && this.report.summary.plateScores) || [];
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
				{ name:'技巧绝招课', ...base }
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
					records: [{ lessonTitle:'知识点巩固', duration:'25秒', updatedAt:'2026-05-26 09:28' }]
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
				recentPractice: [{ id:'local-practice-1', title:'高考数学 真题讲练', averageScore:100, wrongCount:0 }]
			};
		},
		goWrongBook() {
			if (this.readOnly) {
				uni.showToast({ title:'只读查看，不能操作错题', icon:'none' });
				return;
			}
			uni.navigateTo({ url:`/pages/wrongbook/wrongbook?courseId=${encodeURIComponent(this.courseId)}` });
		},
		goBack() { uni.navigateBack({ fail:()=>{} }); }
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
.course-label { color:#697386; font-size:24rpx; font-weight:700; }
.course-name { color:#222; font-size:36rpx; font-weight:900; margin-top:8rpx; }
.summary-grid { display:grid; grid-template-columns:1fr 1fr 1fr; gap:14rpx; padding:0 24rpx; }
.summary-item { background:#fff; border:1rpx solid #edf0f4; border-radius:16rpx; padding:22rpx 14rpx; min-height:150rpx; box-sizing:border-box; }
.summary-label { color:#596272; font-size:24rpx; font-weight:700; }
.summary-value { color:#1677ff; font-size:36rpx; font-weight:900; margin-top:8rpx; }
.summary-tip { color:#9aa3af; font-size:20rpx; margin-top:6rpx; line-height:1.3; }
.panel-title { font-size:32rpx; color:#222; font-weight:800; margin-bottom:18rpx; }
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
.practice-row, .row, .record { display:flex; justify-content:space-between; gap:18rpx; padding:18rpx 0; border-bottom:1rpx solid #eef0f3; font-size:27rpx; color:#333; }
.practice-row:last-child, .row:last-child, .record:last-child { border-bottom:0; }
.practice-detail { margin-top:18rpx; padding:20rpx; border-radius:14rpx; background:#f8fafc; }
.detail-title { color:#222; font-size:27rpx; font-weight:800; margin-bottom:14rpx; }
.question { padding:16rpx 0; border-top:1rpx dashed #dfe5ec; }
.question:first-child { border-top:0; }
.question-stem { color:#222; font-size:26rpx; line-height:1.5; font-weight:700; }
.question-result { display:inline-block; margin-top:10rpx; color:#0f9f6e; font-size:24rpx; font-weight:800; }
.question-result.wrong { color:#e5484d; }
.question-line { color:#596272; font-size:24rpx; line-height:1.5; margin-top:8rpx; }
.record-grid { display:grid; grid-template-columns:1fr 1fr 1fr; gap:12rpx; margin-bottom:10rpx; }
.record-grid view { background:#f8fafc; border-radius:12rpx; padding:16rpx 8rpx; text-align:center; }
.record-grid text { display:block; color:#1677ff; font-size:27rpx; font-weight:900; }
.record-grid small { display:block; color:#8a94a3; font-size:20rpx; margin-top:6rpx; }
.score-line { display:flex; align-items:center; gap:18rpx; color:#1677ff; font-size:40rpx; font-weight:900; }
.score-bar { flex:1; height:14rpx; background:#edf0f3; border-radius:10rpx; overflow:hidden; }
.score-bar view { height:100%; background:#20b486; border-radius:10rpx; }
.plate-row { display:flex; align-items:center; justify-content:space-between; padding:18rpx 0; border-bottom:1rpx solid #eef0f3; color:#333; font-size:27rpx; }
.plate-row:last-child { border-bottom:0; }
.plate-score { display:flex; align-items:center; gap:12rpx; color:#1677ff; font-weight:900; }
.plate-score small { color:#697386; font-size:22rpx; font-weight:700; }
.suggestion { padding:16rpx 0; border-bottom:1rpx solid #eef0f3; color:#333; font-size:27rpx; line-height:1.5; }
.suggestion:last-child { border-bottom:0; }
.empty { color:#8a94a3; font-size:26rpx; padding:20rpx 0; }
@media screen and (max-width: 420px) {
	.track-grid { grid-template-columns:1fr; }
	.report-metrics { grid-template-columns:1fr 1fr; }
}
</style>

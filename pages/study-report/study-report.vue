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
			<view class="summary-item" @click="goWrongBook">
				<view class="summary-label">错题</view>
				<view class="summary-value">{{wrongCount}}道</view>
				<view class="summary-tip">进入错题复盘</view>
			</view>
			<view class="summary-item">
				<view class="summary-label">正确率</view>
				<view class="summary-value">{{accuracyText}}</view>
				<view class="summary-tip">按已做题统计</view>
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
					<view class="question-line">解析：{{detail.analysis || '--'}}</view>
					<view class="question-line">视频解析：{{detail.videoAnalysis || '随课程视频解析开放'}}</view>
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
	</view>
</template>

<script>
import { getStudyReport } from '@/common/api.js'

export default {
	data() {
		return {
			report: { overview:[], attempts:[], recentPractice:[], suggestions:[] },
			courseId: 'gk-math-full',
			userId: '',
			showPractice: false,
			selectedPractice: null
		}
	},
	computed: {
		courseTitle() {
			return this.report.courseTitle || this.report.courseName || '高考数学';
		},
		recentRows() {
			return this.report.recentPractice && this.report.recentPractice.length ? this.report.recentPractice : (this.report.attempts || []);
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
			if (this.report.wrongCount !== undefined) return this.report.wrongCount;
			return this.recentRows.reduce((sum, item) => sum + (Number(item.wrongCount) || 0), 0);
		},
		averageScore() {
			const value = Number(this.report.averageScore);
			if (!Number.isNaN(value) && value > 0) return Math.min(100, value);
			const rows = this.recentRows;
			if (!rows.length) return 0;
			return Math.round(rows.reduce((sum, item) => sum + (Number(item.averageScore || item.score) || 0), 0) / rows.length);
		},
		accuracyText() {
			if (this.report.accuracy !== undefined) return `${this.report.accuracy}%`;
			const rows = this.report.attempts || [];
			const total = rows.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
			const correct = rows.reduce((sum, item) => sum + (Number(item.correct) || 0), 0);
			return total ? `${Math.round(correct / total * 100)}%` : '0%';
		}
	},
	onLoad(opts = {}) {
		this.courseId = opts.courseId || 'gk-math-full';
		this.userId = opts.studentId || opts.userId || '';
		this.loadData();
	},
	methods: {
		async loadData() {
			try {
				this.report = await getStudyReport(this.courseId, this.userId);
				this.selectedPractice = this.practiceRows[0] || null;
			} catch (err) {
				uni.showToast({ title: err.message || '加载失败', icon:'none' });
			}
		},
		goWrongBook() { uni.navigateTo({ url:'/pages/wrongbook/wrongbook' }); },
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
.course-card, .panel { margin:24rpx; padding:26rpx; background:#fff; border-radius:16rpx; border:1rpx solid #edf0f4; }
.course-label { color:#697386; font-size:24rpx; font-weight:700; }
.course-name { color:#222; font-size:36rpx; font-weight:900; margin-top:8rpx; }
.summary-grid { display:grid; grid-template-columns:1fr 1fr 1fr; gap:14rpx; padding:0 24rpx; }
.summary-item { background:#fff; border:1rpx solid #edf0f4; border-radius:16rpx; padding:22rpx 14rpx; min-height:150rpx; box-sizing:border-box; }
.summary-label { color:#596272; font-size:24rpx; font-weight:700; }
.summary-value { color:#1677ff; font-size:36rpx; font-weight:900; margin-top:8rpx; }
.summary-tip { color:#9aa3af; font-size:20rpx; margin-top:6rpx; line-height:1.3; }
.panel-title { font-size:32rpx; color:#222; font-weight:800; margin-bottom:18rpx; }
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
.empty { color:#8a94a3; font-size:26rpx; padding:20rpx 0; }
</style>

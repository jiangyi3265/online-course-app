<template>
	<view class="page">
		<view class="nav"><view class="back" @click="goBack">‹</view><view class="nav-title">学习报告</view></view>
		<view class="grid">
			<view class="metric" v-for="item in report.overview" :key="item.label">
				<view class="value">{{item.value}}</view>
				<view class="label">{{item.label}}</view>
			</view>
		</view>
		<view class="panel" v-if="report.learningStats">
			<view class="panel-title">学习记录汇总</view>
			<view class="stat-line"><text>累计学习</text><text>{{report.learningStats.days}}天</text></view>
			<view class="stat-line"><text>今日学习</text><text>{{report.learningStats.todayText}}</text></view>
			<view class="stat-line"><text>本周学习</text><text>{{report.learningStats.weekText}}</text></view>
			<view class="stat-line"><text>总学习</text><text>{{report.learningStats.totalText}}</text></view>
		</view>
		<view class="panel">
			<view class="panel-title">最近练习</view>
			<view class="row" v-for="item in recentRows" :key="item.id || item.createdAt">
				<text>{{item.title}}</text><text>平均{{item.averageScore || item.score}}分，错题{{item.wrongCount || 0}}道</text>
			</view>
			<view class="empty" v-if="!recentRows.length">暂无练习记录</view>
		</view>
		<view class="panel">
			<view class="panel-title">学习建议</view>
			<view class="suggest" v-for="item in report.suggestions" :key="item">{{item}}</view>
		</view>
	</view>
</template>

<script>
import { getStudyReport } from '@/common/api.js'
export default {
	data() { return { report: { overview:[], attempts:[], recentPractice:[], suggestions:[] } } },
	computed: {
		recentRows() {
			return this.report.recentPractice && this.report.recentPractice.length ? this.report.recentPractice : (this.report.attempts || []);
		}
	},
	onLoad(opts = {}) { this.loadData(opts.courseId || 'gk-math-full'); },
	methods: {
		async loadData(courseId) {
			try { this.report = await getStudyReport(courseId); }
			catch (err) { uni.showToast({ title: err.message || '加载失败', icon:'none' }); }
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
.grid { display:grid; grid-template-columns:1fr 1fr; gap:18rpx; padding:24rpx; }
.metric, .panel { background:#fff; border-radius:16rpx; border:1rpx solid #edf0f4; }
.metric { padding:24rpx; }
.value { color:#1677ff; font-size:38rpx; font-weight:900; }
.label { margin-top:8rpx; color:#697386; font-size:24rpx; }
.panel { margin:0 24rpx 24rpx; padding:26rpx; }
.panel-title { font-size:32rpx; color:#222; font-weight:800; margin-bottom:18rpx; }
.row { display:flex; justify-content:space-between; padding:18rpx 0; border-bottom:1rpx solid #eef0f3; font-size:28rpx; color:#333; }
.row:last-child { border-bottom:0; }
.stat-line { display:flex; justify-content:space-between; padding:14rpx 0; border-bottom:1rpx solid #eef0f3; font-size:27rpx; color:#333; }
.stat-line:last-child { border-bottom:0; }
.suggest { padding:16rpx 0; color:#596272; font-size:28rpx; line-height:1.5; }
.empty { color:#8a94a3; font-size:26rpx; padding:20rpx 0; }
</style>

<template>
	<view class="page">
		<view class="nav">
			<view class="back" @click="goBack">‹</view>
			<view class="nav-title">学情分析</view>
		</view>

		<view class="section-title">学习情况总结</view>
		<view class="summary" v-if="studySummary">
			<view class="summary-card" v-for="section in studySummary.sections" :key="section.title">
				<view class="summary-title">{{section.title}}</view>
				<view class="summary-items">
					<view class="summary-item" v-for="item in section.items" :key="item.label">
						<text class="summary-label">{{item.label}}</text>
						<text class="summary-value">{{item.value}}</text>
					</view>
				</view>
				<view class="summary-detail-toggle" v-if="section.details && section.details.length" @click="toggleSummary(section.title)">
					{{expandedSummary[section.title] ? '收起明细' : '展开明细'}}
				</view>
				<view class="summary-details" v-if="section.details && section.details.length && expandedSummary[section.title]">
					<view class="summary-detail" v-for="detail in section.details" :key="detail.title">
						<view class="detail-head">
							<text class="detail-title">{{detail.title}}</text>
							<text class="detail-count">{{detail.count}}</text>
							<text class="detail-score">{{detail.score}}</text>
						</view>
						<view class="detail-record" v-for="record in detail.records" :key="record.name">
							<text class="record-name">{{record.name}}</text>
							<text class="record-result">{{record.result}}</text>
							<text class="record-score">{{record.score}}</text>
						</view>
					</view>
				</view>
			</view>
			<view class="master-card">
				<view class="summary-title">板块掌握评分</view>
				<view class="master-row" v-for="item in studySummary.plateScores" :key="item.name">
					<text class="master-name">{{item.name}}</text>
					<view class="master-bar">
						<view class="master-bar-inner" :class="'level-' + item.level.color" :style="{width: item.score + '%'}"></view>
					</view>
					<text class="master-score" :class="'text-' + item.level.color">{{item.score}}分 {{item.level.label}}</text>
				</view>
			</view>
		</view>

		<view class="admin-panel" v-if="isAdmin && adminStats">
			<view class="admin-head">
				<view>
					<view class="admin-title">课程打分评价统计</view>
					<view class="admin-sub">按学生成绩阶段查看本节课反馈情况</view>
				</view>
				<view class="admin-avg">{{adminStats.average}}星</view>
			</view>
			<view class="admin-total">
				<text>章节总星数统计：{{adminStats.chapterTotal}}条</text>
				<text>章节自评星数统计</text>
			</view>
			<view class="star-stat">
				<view class="star-stat-item" v-for="option in ratingOptions" :key="option.value">
					<text class="star-stat-star">{{option.label}}</text>
					<text class="star-stat-count">{{totalStarCount(option.value)}}</text>
				</view>
			</view>
			<view class="score-groups">
				<view class="score-group" v-for="group in adminStats.groups" :key="group.range">
					<view class="score-group-head">
						<text class="score-range">{{group.range}}</text>
						<text class="score-students">{{group.students}}人</text>
					</view>
					<view class="group-stars">
						<view class="group-star-row" v-for="option in ratingOptions" :key="option.value">
							<text class="group-star-label">{{option.label}}</text>
							<view class="group-star-bar">
								<view class="group-star-bar-inner" :style="{width: groupBarWidth(group, option.value)}"></view>
							</view>
							<text class="group-star-count">{{starCount(group, option.value)}}</text>
						</view>
					</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
import { RATING_OPTIONS, getAdminRatingStats, getStudySummary, isAdminUser } from '@/common/study-summary.js'
import { getAdminDashboard, getStudySummaryApi, isLoggedIn } from '@/common/api.js'

export default {
	data() {
		return {
			studySummary: null,
			adminStats: null,
			isAdmin: false,
			userInfo: {},
			expandedSummary: {},
			ratingOptions: RATING_OPTIONS
		}
	},
	async onShow() {
		if (!isLoggedIn()) {
			uni.showToast({ title:'请先登录', icon:'none' });
			return;
		}
		this.userInfo = uni.getStorageSync('userInfo') || {};
		this.studySummary = getStudySummary();
		this.isAdmin = isAdminUser(this.userInfo);
		this.adminStats = this.isAdmin ? getAdminRatingStats() : null;
		await this.loadRemoteData();
	},
	methods: {
		async loadRemoteData() {
			try {
				this.studySummary = await getStudySummaryApi();
			} catch (err) {
				console.warn('学习统计接口不可用，使用本地统计', err);
			}
			if (this.isAdmin) {
				try {
					const dashboard = await getAdminDashboard();
					this.adminStats = dashboard.ratingStats;
				} catch (err) {
					console.warn('管理员统计接口不可用，使用本地统计', err);
				}
			}
		},
		toggleSummary(title) {
			this.expandedSummary = { ...this.expandedSummary, [title]: !this.expandedSummary[title] };
		},
		starCount(group, star) {
			const counts = group.counts || {};
			return counts[star] || counts[String(star)] || 0;
		},
		totalStarCount(star) {
			const counts = (this.adminStats && this.adminStats.totalCounts) || {};
			return counts[star] || counts[String(star)] || 0;
		},
		groupBarWidth(group, star) {
			const counts = group.counts || {};
			const max = Math.max(0, ...Object.values(counts));
			const count = this.starCount(group, star);
			return max ? `${Math.round((count / max) * 100)}%` : '0%';
		},
		goBack() { uni.navigateBack({ fail:()=>uni.switchTab({ url:'/pages/member/member', fail:()=>{} }) }); }
	}
}
</script>

<style lang="scss">
page { background:#f5f7fa; }
.page { min-height:100vh; padding-bottom:40rpx; background:#f5f7fa; }

.nav {
	position:relative;
	height:90rpx;
	background:#fff;
	display:flex;
	align-items:center;
	justify-content:center;
	border-bottom:1rpx solid #eef0f3;
}
.back {
	position:absolute;
	left:24rpx;
	font-size:46rpx;
	color:#222;
	cursor:pointer;
}
.nav-title { font-size:30rpx; color:#222; font-weight:700; }
.section-title { margin: 32rpx 30rpx 20rpx; font-size:32rpx; font-weight:800; color:#222; }
.summary { padding: 0 24rpx; }
.summary-card, .master-card, .admin-panel {
	background:#fff;
	border:1rpx solid #eef0f3;
	border-radius:16rpx;
	padding:24rpx;
	margin-bottom:18rpx;
	box-shadow:0 4rpx 12rpx rgba(0,0,0,0.04);
}
.summary-title {
	font-size:28rpx;
	color:#222;
	font-weight:800;
	margin-bottom:16rpx;
}
.summary-items {
	display:flex;
	flex-wrap:wrap;
}
.summary-item {
	width:50%;
	padding:10rpx 0;
	display:flex;
	flex-direction:column;
}
.summary-label {
	font-size:22rpx;
	color:#8a929c;
}
.summary-value {
	margin-top:6rpx;
	font-size:30rpx;
	color:#222;
	font-weight:800;
}
.summary-detail-toggle {
	margin-top:18rpx;
	color:#1677ff;
	font-size:24rpx;
	font-weight:700;
}
.summary-details {
	margin-top:16rpx;
	border-top:1rpx solid #eef0f3;
}
.summary-detail { padding:18rpx 0 4rpx; }
.detail-head {
	display:flex;
	align-items:center;
	flex-wrap:wrap;
	gap:12rpx;
}
.detail-title {
	font-size:26rpx;
	color:#222;
	font-weight:800;
}
.detail-count {
	font-size:22rpx;
	color:#697386;
}
.detail-score {
	margin-left:auto;
	font-size:24rpx;
	color:#b78200;
	font-weight:800;
}
.detail-record {
	display:flex;
	align-items:center;
	margin-top:12rpx;
	padding:14rpx;
	border-radius:10rpx;
	background:#f8fafc;
	font-size:22rpx;
	color:#596272;
}
.record-name {
	width:130rpx;
	color:#222;
	font-weight:700;
}
.record-result {
	flex:1;
	min-width:0;
}
.record-score {
	margin-left:12rpx;
	color:#1677ff;
	font-weight:800;
}
.master-row {
	display:flex;
	align-items:center;
	margin-top:18rpx;
}
.master-name {
	width:150rpx;
	font-size:24rpx;
	color:#333;
}
.master-bar {
	flex:1;
	height:14rpx;
	background:#edf0f3;
	border-radius:8rpx;
	overflow:hidden;
	margin:0 16rpx;
}
.master-bar-inner {
	height:100%;
	border-radius:8rpx;
}
.master-score {
	width:130rpx;
	font-size:22rpx;
	text-align:right;
	font-weight:700;
}
.level-gray { background:#a9b0b8; }
.level-red { background:#ff4d4f; }
.level-yellow { background:#f5b42a; }
.level-green { background:#2bb673; }
.level-purple { background:#8b5cf6; }
.text-gray { color:#7d858e; }
.text-red { color:#ff4d4f; }
.text-yellow { color:#b78200; }
.text-green { color:#2bb673; }
.text-purple { color:#7c3aed; }
.admin-panel {
	margin: 28rpx 24rpx 0;
	background:#fbfdff;
}
.admin-head {
	display:flex;
	justify-content:space-between;
	align-items:center;
}
.admin-title {
	font-size:30rpx;
	color:#222;
	font-weight:800;
}
.admin-sub {
	font-size:22rpx;
	color:#8a929c;
	margin-top:8rpx;
}
.admin-avg {
	padding:12rpx 18rpx;
	border-radius:30rpx;
	background:#fff8e8;
	color:#8a6200;
	font-size:28rpx;
	font-weight:800;
}
.admin-total {
	display:flex;
	justify-content:space-between;
	margin-top:20rpx;
	font-size:22rpx;
	color:#666;
}
.star-stat {
	display:flex;
	margin-top:16rpx;
	background:#fff;
	border-radius:12rpx;
	overflow:hidden;
	border:1rpx solid #eef0f3;
}
.star-stat-item {
	flex:1;
	display:flex;
	flex-direction:column;
	align-items:center;
	padding:16rpx 0;
	border-right:1rpx solid #eef0f3;
}
.star-stat-item:last-child { border-right:none; }
.star-stat-star {
	font-size:22rpx;
	color:#8a6200;
}
.star-stat-count {
	margin-top:6rpx;
	font-size:30rpx;
	color:#222;
	font-weight:800;
}
.score-groups { margin-top:20rpx; }
.score-group {
	background:#fff;
	border-radius:12rpx;
	padding:18rpx;
	margin-top:14rpx;
	border:1rpx solid #eef0f3;
}
.score-group-head {
	display:flex;
	justify-content:space-between;
	align-items:center;
	margin-bottom:12rpx;
}
.score-range {
	font-size:26rpx;
	color:#222;
	font-weight:800;
}
.score-students {
	font-size:22rpx;
	color:#8a929c;
}
.group-star-row {
	display:flex;
	align-items:center;
	margin-top:10rpx;
}
.group-star-label {
	width:58rpx;
	font-size:22rpx;
	color:#666;
}
.group-star-bar {
	flex:1;
	height:12rpx;
	background:#edf0f3;
	border-radius:8rpx;
	overflow:hidden;
	margin:0 12rpx;
}
.group-star-bar-inner {
	height:100%;
	background:#3aa3f5;
	border-radius:8rpx;
}
.group-star-count {
	width:36rpx;
	text-align:right;
	font-size:22rpx;
	color:#222;
	font-weight:700;
}
</style>

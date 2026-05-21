<template>
	<view class="page">
		<view class="nav"><view class="back" @click="goBack">‹</view><view class="nav-title">复习加强</view></view>
		<view class="mode-tabs">
			<view class="mode active">复习加强课</view>
			<view class="mode">技巧绝招课</view>
		</view>
		<view class="summary">复习加强</view>
		<view class="card" v-for="(item,index) in list" :key="item.id">
			<view class="top">
				<view>
					<view class="title">复习测试 {{index + 1}}</view>
					<view class="status">已经测试 {{item.testCount || item.attemptCount || 0}} 次</view>
					<view class="point">{{item.title}}</view>
				</view>
				<view class="score">{{item.mastery}}%</view>
			</view>
			<view class="bar"><view class="inner" :style="{width:item.mastery + '%'}"></view></view>
			<view class="btn" @click="start(item)">开始复习</view>
		</view>
	</view>
</template>

<script>
import { getReinforce } from '@/common/api.js'
export default {
	data() { return { courseId:'gk-math-full', list:[] } },
	onLoad(opts = {}) { this.courseId = opts.courseId || 'gk-math-full'; this.loadData(); },
	methods: {
		async loadData() {
			try { this.list = await getReinforce(this.courseId); }
			catch (err) { uni.showToast({ title: err.message || '加载失败', icon:'none' }); }
		},
		start(item) { uni.navigateTo({ url:`/pages/practice/practice?type=reinforce&pointId=${encodeURIComponent(item.id)}&title=${encodeURIComponent(item.title)}` }); },
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
.mode-tabs { display:flex; margin:24rpx; padding:8rpx; background:#fff; border:1rpx solid #edf0f4; border-radius:16rpx; }
.mode { flex:1; height:68rpx; line-height:68rpx; text-align:center; border-radius:12rpx; color:#697386; font-size:26rpx; font-weight:800; }
.mode.active { background:#1677ff; color:#fff; }
.summary { margin:26rpx 30rpx 10rpx; color:#222; font-size:34rpx; font-weight:900; }
.card { margin:24rpx; padding:26rpx; background:#fff; border-radius:16rpx; border:1rpx solid #edf0f4; }
.top { display:flex; align-items:flex-start; justify-content:space-between; }
.title { font-size:32rpx; font-weight:900; color:#222; }
.status { margin-top:8rpx; color:#1677ff; font-size:25rpx; font-weight:800; }
.point { margin-top:8rpx; color:#8a94a3; font-size:24rpx; }
.score { color:#1677ff; font-size:40rpx; font-weight:900; }
.bar { height:12rpx; border-radius:8rpx; background:#e8edf4; margin-top:22rpx; overflow:hidden; }
.inner { height:100%; background:#20b486; border-radius:8rpx; }
.btn { margin-top:24rpx; height:74rpx; line-height:74rpx; text-align:center; border-radius:12rpx; background:#1677ff; color:#fff; font-size:28rpx; font-weight:700; }
</style>

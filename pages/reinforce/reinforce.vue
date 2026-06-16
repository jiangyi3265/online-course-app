<template>
	<view class="page">
		<view class="nav"><view class="back" @click="goBack">‹</view><view class="nav-title">高中数学</view></view>
		<view class="summary">
			<view></view>
			<view class="summary-text">共{{list.length || 17}}个知识点<br />共xx小时xx分钟</view>
		</view>
		<view class="row" v-for="item in list" :key="item.id">
			<view class="badge">知</view>
			<view class="main">
				<view class="title">{{item.title}}</view>
				<view class="status">{{item.status || '未学'}}-添加日期：{{formatDateTime(item.createdAt)}}</view>
			</view>
			<view class="btn" @click="start(item)">去学习</view>
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
		start(item) { uni.navigateTo({ url:`/pages/lesson/lesson?title=${encodeURIComponent(item.title)}&courseId=${encodeURIComponent(this.courseId)}&chapterTitle=${encodeURIComponent('复习加强')}&categoryTitle=${encodeURIComponent('复习加强课')}` }); },
		formatDateTime(value) { return value ? String(value).replace('T', ' ').slice(0, 19) : '2026-01-25 19:57:51'; },
		goBack() { uni.navigateBack({ fail:()=>{} }); }
	}
}
</script>

<style lang="scss">
page { background:#f5f7fa; }
.page { min-height:100vh; background:#f5f7fa; padding-bottom:40rpx; }
.nav { position:relative; height:90rpx; background:#fff; display:flex; align-items:center; justify-content:center; border-bottom:1rpx solid #eef0f3; }
.back { position:absolute; left:24rpx; font-size:46rpx; color:#222; cursor:pointer; }
.nav-title { font-size:32rpx; font-weight:800; color:#222; }
.summary { height:96rpx; background:#fff; display:flex; align-items:center; justify-content:space-between; padding:0 30rpx; border-bottom:1rpx solid #edf0f3; }
.summary-text { color:#8a94a3; font-size:23rpx; line-height:1.45; text-align:right; }
.row { min-height:112rpx; background:#fff; display:flex; align-items:center; gap:18rpx; padding:0 30rpx; border-bottom:1rpx solid #edf0f3; }
.badge { width:34rpx; height:34rpx; border-radius:6rpx; border:1rpx solid #7ccfe0; color:#26a3bd; display:flex; align-items:center; justify-content:center; font-size:21rpx; flex-shrink:0; }
.main { flex:1; min-width:0; }
.title { color:#222; font-size:29rpx; font-weight:700; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.status { margin-top:8rpx; color:#8a94a3; font-size:22rpx; }
.btn { flex-shrink:0; min-width:112rpx; height:58rpx; line-height:58rpx; text-align:center; border-radius:30rpx; background:#3aa3f5; color:#fff; font-size:24rpx; font-weight:800; }
</style>

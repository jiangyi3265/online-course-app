<template>
	<view class="page">
		<view class="nav"><view class="back" @click="goBack">‹</view><view class="nav-title">错题本</view></view>
		<view class="summary">待复盘 {{pendingCount}} 道，已掌握 {{masteredCount}} 道</view>
		<view class="empty" v-if="list.length===0">暂无错题，先去做一次练习吧</view>
		<view class="card" v-for="item in list" :key="item.id">
			<view class="tag">{{item.knowledge || item.type}}</view>
			<view class="stem">{{item.stem}}</view>
			<view class="answer">正确答案：{{optionText(item, item.answer)}}</view>
			<view class="answer wrong">你的答案：{{item.selected === null ? '未作答' : optionText(item, item.selected)}}</view>
			<view class="analysis">解析：{{item.analysis}}</view>
			<view class="btn" :class="{done:item.mastered}" @click="mark(item)">{{item.mastered ? '已掌握' : '标记掌握'}}</view>
		</view>
	</view>
</template>

<script>
import { getWrongBook, markWrongMastered } from '@/common/api.js'
export default {
	data() { return { list: [] } },
	computed: {
		pendingCount() { return this.list.filter(item => !item.mastered).length; },
		masteredCount() { return this.list.filter(item => item.mastered).length; }
	},
	onShow() { this.loadData(); },
	methods: {
		async loadData() {
			try { this.list = await getWrongBook(); }
			catch (err) { uni.showToast({ title: err.message || '加载失败', icon:'none' }); }
		},
		optionText(item, index) { return item.options && item.options[index] !== undefined ? item.options[index] : '--'; },
		async mark(item) {
			if (item.mastered) return;
			await markWrongMastered(item.id);
			item.mastered = true;
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
.summary { margin:24rpx; padding:24rpx; border-radius:16rpx; background:#fff7ed; color:#b45309; font-size:28rpx; font-weight:700; }
.empty { padding-top:220rpx; text-align:center; color:#8a94a3; font-size:30rpx; }
.card { margin:24rpx; padding:26rpx; background:#fff; border-radius:16rpx; border:1rpx solid #edf0f4; }
.tag { display:inline-block; padding:6rpx 14rpx; border-radius:8rpx; background:#eef6ff; color:#1677ff; font-size:22rpx; }
.stem { margin-top:18rpx; font-size:30rpx; line-height:1.5; font-weight:700; color:#222; }
.answer { margin-top:12rpx; color:#0f9f6e; font-size:26rpx; }
.answer.wrong { color:#e5484d; }
.analysis { margin-top:14rpx; color:#596272; font-size:26rpx; line-height:1.5; }
.btn { margin-top:20rpx; height:70rpx; line-height:70rpx; text-align:center; border-radius:12rpx; background:#1677ff; color:#fff; font-size:28rpx; }
.btn.done { background:#eef2f7; color:#596272; }
</style>

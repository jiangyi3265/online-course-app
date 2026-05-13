<template>
	<view class="page">
		<view class="nav"><view class="back" @click="goBack">‹</view><view class="nav-title">我的学案</view></view>
		<view class="hero">
			<view class="title">{{plan.title || '阶段学案'}}</view>
			<view class="sub">按当前薄弱点生成的学习任务</view>
		</view>
		<view class="task" v-for="item in plan.tasks" :key="item.id">
			<view class="check" :class="{done:item.done}">{{item.done ? '✓' : ''}}</view>
			<view class="task-info">
				<view class="task-title">{{item.title}}</view>
				<view class="task-type">{{item.type}}</view>
			</view>
		</view>
	</view>
</template>

<script>
import { getStudyPlan } from '@/common/api.js'
export default {
	data() { return { plan: { tasks: [] } } },
	onLoad(opts = {}) { this.loadData(opts.courseId || 'gk-math-full'); },
	methods: {
		async loadData(courseId) {
			try { this.plan = await getStudyPlan(courseId); }
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
.hero { margin:24rpx; padding:30rpx; border-radius:16rpx; background:#172554; color:#fff; }
.title { font-size:36rpx; font-weight:900; }
.sub { margin-top:10rpx; font-size:24rpx; opacity:.9; }
.task { display:flex; align-items:center; margin:0 24rpx 18rpx; padding:24rpx; background:#fff; border:1rpx solid #edf0f4; border-radius:16rpx; }
.check { width:52rpx; height:52rpx; line-height:52rpx; text-align:center; border-radius:50%; background:#eef2f7; color:#fff; margin-right:18rpx; }
.check.done { background:#20b486; }
.task-title { font-size:30rpx; font-weight:800; color:#222; }
.task-type { margin-top:8rpx; color:#8a94a3; font-size:24rpx; }
</style>

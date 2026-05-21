<template>
	<view class="page">
		<view class="nav"><view class="back" @click="goBack">‹</view><view class="nav-title">学习计划与打卡</view></view>
		<view class="hero">
			<view class="title">{{plan.title || '阶段学习计划'}}</view>
			<view class="sub">{{studentName ? studentName + ' 的学习计划' : '按当前薄弱点生成的学习任务'}}</view>
			<view class="checkin" :class="{done: checkedIn}" @click="toggleCheckin">{{checkedIn ? '今日已打卡' : '今日打卡'}}</view>
		</view>
		<view class="task" v-for="item in plan.tasks" :key="item.id" @click="toggleTask(item)">
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
	data() {
		return {
			plan: { tasks: [] },
			courseId: 'gk-math-full',
			studentId: '',
			studentName: '',
			checkedIn: false
		}
	},
	onLoad(opts = {}) {
		this.courseId = opts.courseId || 'gk-math-full';
		this.studentId = opts.studentId || '';
		this.studentName = opts.studentName ? decodeURIComponent(opts.studentName) : '';
		this.checkedIn = !!uni.getStorageSync(this.checkKey());
		this.loadData();
	},
	methods: {
		async loadData() {
			try { this.plan = await getStudyPlan(this.courseId, this.studentId); }
			catch (err) { uni.showToast({ title: err.message || '加载失败', icon:'none' }); }
		},
		toggleCheckin() {
			this.checkedIn = !this.checkedIn;
			if (this.checkedIn) uni.setStorageSync(this.checkKey(), true);
			else uni.removeStorageSync(this.checkKey());
		},
		toggleTask(item) {
			item.done = !item.done;
		},
		checkKey() {
			const today = new Date().toISOString().slice(0, 10);
			return `studyCheckin:${this.studentId || 'self'}:${this.courseId}:${today}`;
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
.hero { margin:24rpx; padding:30rpx; border-radius:16rpx; background:#0f766e; color:#fff; position:relative; }
.title { font-size:36rpx; font-weight:900; }
.sub { margin-top:10rpx; font-size:24rpx; opacity:.9; }
.checkin { margin-top:24rpx; height:74rpx; line-height:74rpx; text-align:center; border-radius:12rpx; background:#fff; color:#0f766e; font-size:28rpx; font-weight:900; }
.checkin.done { background:rgba(255,255,255,.2); color:#fff; }
.task { display:flex; align-items:center; margin:0 24rpx 18rpx; padding:24rpx; background:#fff; border:1rpx solid #edf0f4; border-radius:16rpx; }
.check { width:52rpx; height:52rpx; line-height:52rpx; text-align:center; border-radius:50%; background:#eef2f7; color:#fff; margin-right:18rpx; flex-shrink:0; }
.check.done { background:#20b486; }
.task-title { font-size:30rpx; font-weight:800; color:#222; }
.task-type { margin-top:8rpx; color:#8a94a3; font-size:24rpx; }
</style>

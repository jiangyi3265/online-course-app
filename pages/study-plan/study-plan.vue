<template>
	<view class="page">
		<view class="nav">
			<view class="back" @click="goBack">‹</view>
			<view class="nav-title">学习打卡</view>
		</view>

		<study-checkin-card :course-id="courseId" :student-id="studentId" />

		<view class="task-panel" v-if="plan.tasks && plan.tasks.length">
			<view class="panel-title">今日建议任务</view>
			<view class="task" v-for="item in plan.tasks" :key="item.id" @click="toggleTask(item)">
				<view class="check" :class="{done:item.done}">{{item.done ? '✓' : ''}}</view>
				<view class="task-info">
					<view class="task-title">{{item.title}}</view>
					<view class="task-type">{{item.type}}</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
import { getStudyPlan } from '@/common/api.js'
import StudyCheckinCard from '@/components/study-checkin-card.vue'

export default {
	components: { StudyCheckinCard },
	data() {
		return {
			plan: { tasks: [] },
			courseId: 'gk-math-full',
			studentId: '',
			studentName: ''
		}
	},
	onLoad(opts = {}) {
		this.courseId = opts.courseId || 'gk-math-full';
		this.studentId = opts.studentId || '';
		this.studentName = opts.studentName ? decodeURIComponent(opts.studentName) : '';
		this.loadData();
	},
	methods: {
		async loadData() {
			try { this.plan = await getStudyPlan(this.courseId, this.studentId); }
			catch (err) { console.warn('学习打卡任务接口不可用', err); }
		},
		toggleTask(item) {
			item.done = !item.done;
		},
		goBack() { uni.navigateBack({ fail:()=>{} }); }
	}
}
</script>

<style lang="scss">
page { background:#f5f7fa; }
.page { min-height:100vh; background:#f5f7fa; padding-bottom:50rpx; }
.nav { position:relative; height:90rpx; background:#fff; display:flex; align-items:center; justify-content:center; border-bottom:1rpx solid #eef0f3; }
.back { position:absolute; left:24rpx; font-size:46rpx; color:#222; cursor:pointer; }
.nav-title { font-size:30rpx; font-weight:800; color:#222; }
.task-panel { margin:24rpx; padding:26rpx; background:#fff; border:1rpx solid #edf0f4; border-radius:10rpx; }
.panel-title { color:#222; font-size:30rpx; font-weight:900; margin-bottom:18rpx; }
.task { display:flex; align-items:center; padding:18rpx 0; border-bottom:1rpx solid #edf0f4; }
.task:last-child { border-bottom:0; }
.check { width:52rpx; height:52rpx; line-height:52rpx; text-align:center; border-radius:50%; background:#eef2f7; color:#fff; margin-right:18rpx; flex-shrink:0; }
.check.done { background:#20b486; }
.task-title { font-size:28rpx; font-weight:800; color:#222; }
.task-type { margin-top:8rpx; color:#8a94a3; font-size:23rpx; }
</style>

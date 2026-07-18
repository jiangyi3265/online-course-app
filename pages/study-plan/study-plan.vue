<template>
	<view class="page">
		<view class="nav">
			<view class="back" @click="goBack">‹</view>
			<view class="nav-title">学习打卡</view>
		</view>

		<view class="readonly-tip" v-if="readOnly">当前为只读查看，不能代填或修改学生打卡。</view>
		<study-checkin-card :course-id="courseId" :student-id="studentId" :read-only="readOnly" />
	</view>
</template>

<script>
import { decodeRouteText } from '@/common/api.js'
import { safeNavigateBack } from '@/common/navigation.js'
import StudyCheckinCard from '@/components/study-checkin-card.vue'

export default {
	components: { StudyCheckinCard },
	data() {
		return {
			courseId: 'gk-math-full',
			studentId: '',
			studentName: '',
			readOnly: false
		}
	},
	onLoad(opts = {}) {
		this.courseId = opts.courseId || 'gk-math-full';
		this.studentId = opts.studentId || '';
		this.studentName = opts.studentName ? decodeRouteText(opts.studentName) : '';
		this.readOnly = opts.readonly === '1' || opts.readOnly === '1' || !!this.studentId;
	},
	methods: {
		goBack() { safeNavigateBack('/pages/mycourse/mycourse'); }
	}
}
</script>

<style lang="scss">
page { background:#f5f7fa; }
.page { min-height:100vh; background:#f5f7fa; padding-bottom:50rpx; }
.nav { position:relative; height:90rpx; background:#fff; display:flex; align-items:center; justify-content:center; border-bottom:1rpx solid #eef0f3; }
.back { position:absolute; left:24rpx; font-size:46rpx; color:#222; cursor:pointer; }
.nav-title { font-size:30rpx; font-weight:800; color:#222; }
.readonly-tip { margin:24rpx 24rpx 0; padding:18rpx 22rpx; border-radius:10rpx; background:#f8fafc; border:1rpx solid #e1e8f0; color:#667085; font-size:24rpx; line-height:1.45; }
</style>

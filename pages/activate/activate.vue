<template>
	<view class="page">
		<view class="nav"><view class="back" @click="goBack">‹</view><view class="nav-title">课程开通</view></view>
		<view class="panel">
			<view class="title">卡密验证开通</view>
			<view class="hint">输入老师或后台发放的卡密，验证成功后课程会立即加入“我的课程”。</view>
			<input class="input" v-model="code" placeholder="输入卡密，例如 GK-MATH-2026" confirm-type="done" @confirm="activate" />
			<view class="primary" :class="{disabled: loading}" @click="activate">{{loading ? '验证中...' : '验证卡密并开通'}}</view>
			<view class="success" v-if="activatedCourse">
				<view class="success-title">已开通</view>
				<view class="success-text">{{activatedCourse}}</view>
				<view class="success-link" @click="goMyCourses">去我的课程学习</view>
			</view>
		</view>
		<view class="panel">
			<view class="title">当前课程</view>
			<view class="course">{{courseId}}</view>
			<view class="ghost" :class="{disabled: loading}" @click="apply">没有卡密，申请人工授权</view>
		</view>
		<view class="tip-panel">
			<view class="tip-title">可测试卡密</view>
			<view class="tip-code" @click="useCode('GK-MATH-2026')">GK-MATH-2026</view>
			<view class="tip-code" @click="useCode('ZK-ENG-2026')">ZK-ENG-2026</view>
		</view>
	</view>
</template>

<script>
import { activateCourse, applyAuthorization } from '@/common/api.js'
export default {
	data() { return { courseId:'gk-math-full', code:'', loading:false, activatedCourse:'' } },
	onLoad(opts = {}) { this.courseId = opts.courseId || 'gk-math-full'; },
	methods: {
		async activate() {
			const code = this.code.trim().toUpperCase();
			if (!code) {
				uni.showToast({ title:'请输入卡密', icon:'none' });
				return;
			}
			if (this.loading) return;
			this.loading = true;
			try {
				const result = await activateCourse(code);
				this.code = code;
				this.activatedCourse = result.courseTitle || result.courseId || '课程';
				uni.showToast({ title:'开通成功', icon:'success' });
			}
			catch (err) {
				uni.showToast({ title: err.message || '卡密无效', icon:'none' });
			}
			finally {
				this.loading = false;
			}
		},
		async apply() {
			if (this.loading) return;
			this.loading = true;
			try { await applyAuthorization(this.courseId); uni.showToast({ title:'申请已提交', icon:'success' }); }
			catch (err) { uni.showToast({ title: err.message || '提交失败', icon:'none' }); }
			finally { this.loading = false; }
		},
		useCode(code) { this.code = code; },
		goMyCourses() { uni.navigateTo({ url:'/pages/mycourse/mycourse' }); },
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
.panel { margin:24rpx; padding:28rpx; background:#fff; border-radius:16rpx; border:1rpx solid #edf0f4; }
.title { font-size:32rpx; font-weight:800; color:#222; margin-bottom:20rpx; }
.hint { color:#697386; font-size:26rpx; line-height:1.5; margin-bottom:20rpx; }
.input { height:84rpx; border-radius:12rpx; background:#f3f6fa; padding:0 20rpx; font-size:28rpx; }
.primary, .ghost { height:78rpx; line-height:78rpx; text-align:center; border-radius:12rpx; margin-top:18rpx; font-size:28rpx; font-weight:700; }
.primary { background:#1677ff; color:#fff; }
.ghost { background:#eef2f7; color:#222; }
.disabled { opacity:.55; }
.course { color:#697386; font-size:28rpx; }
.success { margin-top:22rpx; padding:22rpx; border-radius:14rpx; background:#f0fdf4; border:1rpx solid #bbf7d0; }
.success-title { color:#15803d; font-size:28rpx; font-weight:800; }
.success-text { color:#166534; font-size:26rpx; margin-top:8rpx; }
.success-link { margin-top:16rpx; color:#1677ff; font-size:26rpx; font-weight:700; }
.tip-panel { margin:24rpx; padding:24rpx 28rpx; border-radius:16rpx; background:#fff7ed; border:1rpx solid #fed7aa; }
.tip-title { color:#9a3412; font-size:26rpx; font-weight:800; margin-bottom:14rpx; }
.tip-code { display:inline-block; margin:0 16rpx 12rpx 0; padding:10rpx 18rpx; border-radius:10rpx; background:#fff; color:#9a3412; font-size:24rpx; font-weight:700; }
</style>

<template>
	<view class="page">
		<view class="nav">
			<view class="back" @click="goBack">‹</view>
			<view class="nav-title">修改微信账号</view>
		</view>

		<view class="content">
			<view class="intro">
				<view class="intro-icon">微</view>
				<view class="intro-copy">
					<view class="intro-title">填写常用微信账号</view>
					<view class="intro-text">仅用于老师或校区与你联系，不会在课程页面公开显示。</view>
				</view>
			</view>

			<view class="form-panel">
				<view class="field">
					<text class="field-label">微信账号</text>
					<input
						class="field-input"
						maxlength="32"
						v-model.trim="wechat"
						placeholder="请输入微信账号"
						placeholder-class="placeholder"
					/>
					<view class="clear-button" v-if="wechat" @click="wechat = ''">×</view>
				</view>
			</view>

			<view class="notice">
				<view class="notice-dot"></view>
				<text>支持6至32位字母、数字、下划线和短横线。</text>
			</view>

			<view class="primary-button" :class="{disabled: loading}" @click="submit">
				{{loading ? '保存中' : '保存微信账号'}}
			</view>
		</view>
	</view>
</template>

<script>
import { getProfile, saveSession, updateProfile } from '@/common/api.js'
import { safeNavigateBack } from '@/common/navigation.js'

export default {
	data() {
		return {
			wechat: '',
			loading: false
		}
	},
	onShow() {
		this.loadProfile()
	},
	methods: {
		async loadProfile() {
			try {
				const user = await getProfile()
				this.wechat = user.wechat || ''
			} catch (err) {
				uni.showToast({ title: err.message || '微信账号加载失败', icon: 'none' })
			}
		},
		async submit() {
			if (this.loading) return
			if (this.wechat && !/^[A-Za-z0-9_-]{6,32}$/.test(this.wechat)) {
				uni.showToast({ title: '请输入正确的微信账号', icon: 'none' })
				return
			}
			this.loading = true
			try {
				const user = await updateProfile({ wechat: this.wechat })
				saveSession({ user })
				uni.showToast({ title: this.wechat ? '微信账号已更新' : '微信账号已清除', icon: 'success' })
				setTimeout(() => this.goBack(), 600)
			} catch (err) {
				uni.showToast({ title: err.message || '微信账号保存失败', icon: 'none' })
			} finally {
				this.loading = false
			}
		},
		goBack() { safeNavigateBack('/pages/profile/profile') }
	}
}
</script>

<style lang="scss" scoped>
page { background:#f3f7fb; }
.page { min-height:100vh; background:#f3f7fb; color:#172033; }
.nav { position:sticky; top:0; z-index:10; height:92rpx; background:#fafdff; display:flex; align-items:center; justify-content:center; border-bottom:1rpx solid #e6ecf3; }
.back { position:absolute; left:28rpx; width:64rpx; height:64rpx; display:flex; align-items:center; justify-content:center; color:#172033; font-size:46rpx; cursor:pointer; }
.nav-title { font-size:31rpx; font-weight:800; }
.content { width:100%; padding:44rpx 32rpx 64rpx; box-sizing:border-box; }
.intro { display:flex; gap:22rpx; align-items:center; max-width:920rpx; margin:0 auto 30rpx; }
.intro-icon { width:76rpx; height:76rpx; flex-shrink:0; display:flex; align-items:center; justify-content:center; border-radius:22rpx; background:#e1f5ef; color:#16856c; font-size:31rpx; font-weight:900; }
.intro-copy { min-width:0; }
.intro-title { font-size:34rpx; line-height:1.3; font-weight:900; color:#152238; }
.intro-text { margin-top:8rpx; max-width:62ch; color:#6b778c; font-size:25rpx; line-height:1.55; }
.form-panel { max-width:920rpx; margin:0 auto; padding:0 30rpx; background:#fafdff; border:1rpx solid #dde6f0; border-radius:20rpx; box-shadow:0 16rpx 42rpx rgba(50,75,110,.07); }
.field { min-height:104rpx; display:flex; align-items:center; gap:22rpx; }
.field-label { width:156rpx; flex-shrink:0; color:#263348; font-size:27rpx; font-weight:800; }
.field-input { flex:1; min-width:0; height:104rpx; color:#172033; font-size:28rpx; }
.placeholder { color:#a5afbd; }
.clear-button { width:52rpx; height:52rpx; display:flex; align-items:center; justify-content:center; border-radius:50%; background:#edf1f5; color:#728095; font-size:34rpx; cursor:pointer; }
.notice { max-width:920rpx; margin:22rpx auto 0; display:flex; align-items:flex-start; gap:12rpx; color:#748197; font-size:24rpx; line-height:1.5; }
.notice-dot { width:10rpx; height:10rpx; margin-top:13rpx; flex-shrink:0; border-radius:50%; background:#3aa989; }
.primary-button { max-width:920rpx; height:88rpx; margin:44rpx auto 0; display:flex; align-items:center; justify-content:center; border-radius:18rpx; background:#278de4; color:#f9fcff; font-size:30rpx; font-weight:900; box-shadow:0 12rpx 28rpx rgba(39,141,228,.22); cursor:pointer; }
.primary-button:active { transform:translateY(1px); opacity:.92; }
.primary-button.disabled { opacity:.62; pointer-events:none; }
@media screen and (min-width:768px) {
	.nav { height:64px; }
	.back { left:28px; width:44px; height:44px; font-size:30px; }
	.nav-title { font-size:22px; }
	.content { padding:52px clamp(40px, 7vw, 88px) 72px; }
	.intro, .form-panel, .notice, .primary-button { width:100%; max-width:none; box-sizing:border-box; }
	.intro { margin-bottom:28px; }
	.intro-icon { width:64px; height:64px; border-radius:18px; font-size:24px; }
	.intro-title { font-size:24px; }
	.intro-text { margin-top:6px; font-size:17px; }
	.form-panel { padding:0 34px; }
	.field { min-height:78px; }
	.field-label { width:150px; font-size:18px; }
	.field-input { font-size:18px; }
	.field-input { height:78px; }
	.notice { margin-top:18px; font-size:16px; }
	.primary-button { height:62px; margin-top:36px; }
}
</style>

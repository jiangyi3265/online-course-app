<template>
	<view class="page">
		<view class="nav">
			<view class="back" @click="goBack">‹</view>
			<view class="nav-title">修改登录密码</view>
		</view>

		<view class="content">
			<view class="intro">
				<view class="intro-icon">密</view>
				<view class="intro-copy">
					<view class="intro-title">设置新的登录密码</view>
					<view class="intro-text">建议使用字母与数字组合，修改成功后请妥善保存。</view>
				</view>
			</view>

			<view class="form-panel">
				<view class="field">
					<text class="field-label">新密码</text>
					<input
						class="field-input"
						type="password"
						maxlength="32"
						v-model="password"
						placeholder="请输入6至32位新密码"
						placeholder-class="placeholder"
					/>
				</view>
				<view class="field">
					<text class="field-label">确认密码</text>
					<input
						class="field-input"
						type="password"
						maxlength="32"
						v-model="confirmPassword"
						placeholder="请再次输入新密码"
						placeholder-class="placeholder"
					/>
				</view>
			</view>

			<view class="strength" v-if="password">
				<view class="strength-bars">
					<view class="strength-bar" :class="{active: strength >= 1}"></view>
					<view class="strength-bar" :class="{active: strength >= 2}"></view>
					<view class="strength-bar" :class="{active: strength >= 3}"></view>
				</view>
				<text>密码强度：{{strengthLabel}}</text>
			</view>

			<view class="primary-button" :class="{disabled: loading}" @click="submit">
				{{loading ? '保存中' : '保存新密码'}}
			</view>
		</view>
	</view>
</template>

<script>
import { saveSession, updateProfile } from '@/common/api.js'
import { safeNavigateBack } from '@/common/navigation.js'

export default {
	data() {
		return {
			password: '',
			confirmPassword: '',
			loading: false
		}
	},
	computed: {
		strength() {
			let score = 0
			if (this.password.length >= 6) score += 1
			if (/[A-Za-z]/.test(this.password) && /\d/.test(this.password)) score += 1
			if (this.password.length >= 10 && /[^A-Za-z0-9]/.test(this.password)) score += 1
			return score
		},
		strengthLabel() {
			return ['较弱', '较弱', '适中', '较强'][this.strength]
		}
	},
	methods: {
		async submit() {
			if (this.loading) return
			if (this.password.length < 6 || this.password.length > 32) {
				uni.showToast({ title: '密码长度需为6至32位', icon: 'none' })
				return
			}
			if (this.password !== this.confirmPassword) {
				uni.showToast({ title: '两次输入的密码不一致', icon: 'none' })
				return
			}
			this.loading = true
			try {
				const user = await updateProfile({ password: this.password })
				saveSession({ user })
				this.password = ''
				this.confirmPassword = ''
				uni.showToast({ title: '登录密码已更新', icon: 'success' })
				setTimeout(() => this.goBack(), 600)
			} catch (err) {
				uni.showToast({ title: err.message || '密码修改失败', icon: 'none' })
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
.intro-icon { width:76rpx; height:76rpx; flex-shrink:0; display:flex; align-items:center; justify-content:center; border-radius:22rpx; background:#e9edff; color:#5569c9; font-size:31rpx; font-weight:900; }
.intro-copy { min-width:0; }
.intro-title { font-size:34rpx; line-height:1.3; font-weight:900; color:#152238; }
.intro-text { margin-top:8rpx; max-width:62ch; color:#6b778c; font-size:25rpx; line-height:1.55; }
.form-panel { max-width:920rpx; margin:0 auto; padding:0 30rpx; background:#fafdff; border:1rpx solid #dde6f0; border-radius:20rpx; box-shadow:0 16rpx 42rpx rgba(50,75,110,.07); }
.field { min-height:104rpx; display:flex; align-items:center; gap:22rpx; border-bottom:1rpx solid #e8edf3; }
.field:last-child { border-bottom:0; }
.field-label { width:156rpx; flex-shrink:0; color:#263348; font-size:27rpx; font-weight:800; }
.field-input { flex:1; min-width:0; height:104rpx; color:#172033; font-size:28rpx; }
.placeholder { color:#a5afbd; }
.strength { max-width:920rpx; margin:22rpx auto 0; display:flex; align-items:center; gap:18rpx; color:#748197; font-size:24rpx; }
.strength-bars { display:flex; width:170rpx; gap:8rpx; }
.strength-bar { flex:1; height:8rpx; border-radius:8rpx; background:#dde5ee; }
.strength-bar.active { background:#4b9ce2; }
.primary-button { max-width:920rpx; height:88rpx; margin:44rpx auto 0; display:flex; align-items:center; justify-content:center; border-radius:18rpx; background:#278de4; color:#f9fcff; font-size:30rpx; font-weight:900; box-shadow:0 12rpx 28rpx rgba(39,141,228,.22); cursor:pointer; }
.primary-button:active { transform:translateY(1px); opacity:.92; }
.primary-button.disabled { opacity:.62; pointer-events:none; }
@media screen and (min-width:768px) {
	.nav { height:64px; }
	.back { left:28px; width:44px; height:44px; font-size:30px; }
	.nav-title { font-size:22px; }
	.content { padding:52px clamp(40px, 7vw, 88px) 72px; }
	.intro, .form-panel, .strength, .primary-button { width:100%; max-width:none; box-sizing:border-box; }
	.intro { margin-bottom:28px; }
	.intro-icon { width:64px; height:64px; border-radius:18px; font-size:24px; }
	.intro-title { font-size:24px; }
	.intro-text { margin-top:6px; font-size:17px; }
	.form-panel { padding:0 34px; }
	.field { min-height:78px; }
	.field-label { width:150px; font-size:18px; }
	.field-input { font-size:18px; }
	.field-input { height:78px; }
	.strength { margin-top:18px; font-size:16px; }
	.primary-button { height:62px; margin-top:36px; }
}
</style>

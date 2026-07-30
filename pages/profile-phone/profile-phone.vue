<template>
	<view class="page">
		<view class="nav">
			<view class="back" @click="goBack">‹</view>
			<view class="nav-title">更换登录手机号</view>
		</view>

		<view class="content">
			<view class="intro">
				<view class="intro-icon">号</view>
				<view class="intro-copy">
					<view class="intro-title">验证新的登录手机号</view>
					<view class="intro-text">更换后请使用新手机号登录，课程和学习记录不会改变。</view>
				</view>
			</view>

			<view class="form-panel">
				<view class="field static-field">
					<text class="field-label">当前手机号</text>
					<text class="field-value">{{maskedPhone}}</text>
				</view>
				<view class="field">
					<text class="field-label">新手机号</text>
					<input
						class="field-input"
						type="number"
						maxlength="11"
						v-model.trim="phone"
						placeholder="请输入新的手机号"
						placeholder-class="placeholder"
					/>
				</view>
				<view class="field code-field">
					<text class="field-label">验证码</text>
					<view class="code-control">
						<input
							class="field-input code-input"
							type="number"
							maxlength="6"
							v-model.trim="smsCode"
							placeholder="请输入验证码"
							placeholder-class="placeholder"
						/>
						<view class="code-button" :class="{disabled: countdown > 0 || sending}" @click="sendCode">
							{{countdown > 0 ? `${countdown}秒后重试` : (sending ? '发送中' : '获取验证码')}}
						</view>
					</view>
				</view>
			</view>

			<view class="notice">
				<view class="notice-dot"></view>
				<text>验证码仅用于本次账号验证，请勿转发给他人。</text>
			</view>

			<view class="primary-button" :class="{disabled: loading}" @click="submit">
				{{loading ? '保存中' : '确认更换'}}
			</view>
		</view>
	</view>
</template>

<script>
import { getProfile, saveSession, sendSmsCode, updateProfile } from '@/common/api.js'
import { safeNavigateBack } from '@/common/navigation.js'

export default {
	data() {
		return {
			currentPhone: '',
			phone: '',
			smsCode: '',
			countdown: 0,
			timer: null,
			sending: false,
			loading: false
		}
	},
	computed: {
		maskedPhone() {
			const phone = String(this.currentPhone || '').trim()
			if (!/^1\d{10}$/.test(phone)) return phone || '未绑定'
			return `${phone.slice(0, 3)}****${phone.slice(-4)}`
		}
	},
	onShow() {
		this.loadProfile()
	},
	onUnload() {
		this.clearCountdown()
	},
	methods: {
		async loadProfile() {
			try {
				const user = await getProfile()
				this.currentPhone = user.phone || ''
			} catch (err) {
				uni.showToast({ title: err.message || '手机号加载失败', icon: 'none' })
			}
		},
		validatePhone() {
			if (!/^1\d{10}$/.test(this.phone)) {
				uni.showToast({ title: '请输入正确的新手机号', icon: 'none' })
				return false
			}
			if (this.phone === this.currentPhone) {
				uni.showToast({ title: '新手机号不能与当前手机号相同', icon: 'none' })
				return false
			}
			return true
		},
		async sendCode() {
			if (this.countdown > 0 || this.sending || !this.validatePhone()) return
			this.sending = true
			try {
				const res = await sendSmsCode(this.phone)
				if (res.code) this.smsCode = String(res.code)
				uni.showToast({ title: res.message || '验证码已发送', icon: 'none' })
				this.startCountdown()
			} catch (err) {
				uni.showToast({ title: err.message || '验证码发送失败', icon: 'none' })
			} finally {
				this.sending = false
			}
		},
		startCountdown() {
			this.clearCountdown()
			this.countdown = 60
			this.timer = setInterval(() => {
				this.countdown -= 1
				if (this.countdown <= 0) this.clearCountdown()
			}, 1000)
		},
		clearCountdown() {
			if (this.timer) clearInterval(this.timer)
			this.timer = null
			if (this.countdown < 0) this.countdown = 0
		},
		async submit() {
			if (this.loading || !this.validatePhone()) return
			if (!/^\d{6}$/.test(this.smsCode)) {
				uni.showToast({ title: '请输入6位验证码', icon: 'none' })
				return
			}
			this.loading = true
			try {
				const user = await updateProfile({ phone: this.phone, smsCode: this.smsCode })
				saveSession({ user })
				this.currentPhone = user.phone || this.phone
				uni.showToast({ title: '手机号已更换', icon: 'success' })
				setTimeout(() => this.goBack(), 600)
			} catch (err) {
				uni.showToast({ title: err.message || '手机号更换失败', icon: 'none' })
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
.intro-icon { width:76rpx; height:76rpx; flex-shrink:0; display:flex; align-items:center; justify-content:center; border-radius:22rpx; background:#e2f1ff; color:#1877d9; font-size:31rpx; font-weight:900; }
.intro-copy { min-width:0; }
.intro-title { font-size:34rpx; line-height:1.3; font-weight:900; color:#152238; }
.intro-text { margin-top:8rpx; max-width:62ch; color:#6b778c; font-size:25rpx; line-height:1.55; }
.form-panel { max-width:920rpx; margin:0 auto; padding:0 30rpx; background:#fafdff; border:1rpx solid #dde6f0; border-radius:20rpx; box-shadow:0 16rpx 42rpx rgba(50,75,110,.07); }
.field { min-height:104rpx; display:flex; align-items:center; gap:22rpx; border-bottom:1rpx solid #e8edf3; }
.field:last-child { border-bottom:0; }
.field-label { width:156rpx; flex-shrink:0; color:#263348; font-size:27rpx; font-weight:800; }
.field-value { flex:1; color:#546278; font-size:28rpx; }
.field-input { flex:1; min-width:0; height:104rpx; color:#172033; font-size:28rpx; }
.code-control { flex:1; min-width:0; display:grid; grid-template-columns:minmax(0, 1fr) auto; align-items:center; gap:12rpx; }
.code-input { width:100%; padding-right:10rpx; box-sizing:border-box; }
.placeholder { color:#a5afbd; }
.code-button { flex-shrink:0; min-width:178rpx; height:62rpx; padding:0 20rpx; display:flex; align-items:center; justify-content:center; border-radius:31rpx; background:#e5f2ff; color:#1675d1; font-size:25rpx; font-weight:800; cursor:pointer; }
.code-button.disabled { color:#8c99aa; background:#edf1f5; pointer-events:none; }
.notice { max-width:920rpx; margin:22rpx auto 0; display:flex; align-items:flex-start; gap:12rpx; color:#748197; font-size:24rpx; line-height:1.5; }
.notice-dot { width:10rpx; height:10rpx; margin-top:13rpx; flex-shrink:0; border-radius:50%; background:#48aef0; }
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
	.field-value, .field-input { font-size:18px; }
	.field-input { height:78px; }
	.code-field {
		display:grid;
		grid-template-columns:150px minmax(0, 1fr);
		column-gap:18px;
	}
	.code-control { gap:14px; }
	.code-button { min-width:136px; height:42px; padding:0 18px; border-radius:21px; font-size:16px; }
	.notice { margin-top:18px; font-size:16px; }
	.primary-button { height:62px; margin-top:36px; }
}
@media screen and (max-width:480px) {
	.code-field {
		display:grid;
		grid-template-columns:156rpx minmax(0, 1fr);
		padding:14rpx 0;
	}
	.code-control { gap:10rpx; }
	.code-control .field-input { height:74rpx; }
	.code-control .code-button { min-width:202rpx; height:66rpx; padding:0 14rpx; font-size:23rpx; }
}
</style>

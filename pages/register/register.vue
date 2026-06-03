<template>
	<view class="page">
		<view class="header">
			<view class="back" @click="goBack">
				<text class="back-arrow">‹</text>
				<text class="back-text">返回登录</text>
			</view>
			<image class="illu" src="/static/login-banner.png" mode="widthFix" />
		</view>

		<view class="form">
			<view class="title">创建账号</view>
			<view class="subtitle">注册后即可同步学习进度和课程授权</view>
			<view class="invite-tip" v-if="inviteId || invitePhone">推荐人：{{invitePhone || '--'}} / ID {{inviteId || '--'}}</view>

			<view class="input-row">
				<text class="input-icon">👤</text>
				<input class="input" maxlength="16" placeholder="请输入昵称" v-model.trim="name" placeholder-class="ph" />
			</view>

			<view class="input-row">
				<text class="input-icon">📱</text>
				<input class="input" type="number" maxlength="11" placeholder="请输入手机号" v-model.trim="phone" placeholder-class="ph" />
			</view>

			<view class="input-row">
				<text class="input-icon">🔑</text>
				<input class="input" type="number" maxlength="6" placeholder="验证码" v-model.trim="smsCode" placeholder-class="ph" />
				<text class="code-btn" @click="getCode">获取验证码</text>
			</view>

			<view class="input-row">
				<text class="input-icon">🔒</text>
				<input class="input" type="password" maxlength="32" placeholder="请输入密码" v-model="password" placeholder-class="ph" />
			</view>

			<view class="input-row">
				<text class="input-icon">✓</text>
				<input class="input" type="password" maxlength="32" placeholder="请再次输入密码" v-model="confirmPassword" placeholder-class="ph" />
			</view>

			<view class="agree-row">
				<view class="checkbox" :class="{checked: agree}" @click="agree = !agree"><text v-if="agree">✓</text></view>
				<text class="agree-text">我已阅读并同意</text>
				<text class="link" @click="openProtocol">用户隐私协议</text>
				<text class="agree-text">和</text>
				<text class="link" @click="openPolicy">用户隐私政策</text>
			</view>

			<button class="register-btn" :loading="loading" @click="onSubmit">注册并登录</button>

			<view class="login-row">
				<text class="login-tip">已有账号？</text>
				<text class="login-link" @click="goBack">去登录</text>
			</view>
		</view>
	</view>
</template>

<script>
	import { bindReferrer, register, saveSession, sendSmsCode } from '@/common/api.js'

	export default {
		data() {
			return {
				name: '',
				phone: '',
				smsCode: '',
				password: '',
				confirmPassword: '',
				agree: true,
				loading: false,
				invitePhone: '',
				inviteId: ''
			}
		},
		onLoad(opts = {}) {
			this.invitePhone = opts.invitePhone ? decodeURIComponent(opts.invitePhone) : ''
			this.inviteId = opts.inviteId ? decodeURIComponent(opts.inviteId) : ''
		},
		methods: {
			goBack() {
				uni.navigateBack({ fail: () => uni.redirectTo({ url: '/pages/login/login' }) })
			},
			openProtocol() {
				uni.navigateTo({ url: '/pages/agreement/agreement?type=user' })
			},
			openPolicy() {
				uni.navigateTo({ url: '/pages/agreement/agreement?type=privacy' })
			},
			validate() {
				if (!this.name) {
					uni.showToast({ title: '请输入昵称', icon: 'none' })
					return false
				}
				if (!/^1\d{10}$/.test(this.phone)) {
					uni.showToast({ title: '请输入正确的手机号', icon: 'none' })
					return false
				}
				if (!this.smsCode) {
					uni.showToast({ title: '请输入验证码', icon: 'none' })
					return false
				}
				if (this.password.length < 6) {
					uni.showToast({ title: '密码至少 6 位', icon: 'none' })
					return false
				}
				if (this.password !== this.confirmPassword) {
					uni.showToast({ title: '两次密码不一致', icon: 'none' })
					return false
				}
				if (!this.agree) {
					uni.showToast({ title: '请先同意协议', icon: 'none' })
					return false
				}
				return true
			},
			async getCode() {
				if (!/^1\d{10}$/.test(this.phone)) {
					uni.showToast({ title: '请输入正确的手机号', icon: 'none' })
					return
				}
				try {
					const res = await sendSmsCode(this.phone)
					uni.showToast({ title: res.message || '验证码已发送', icon: 'none' })
					if (res.code) this.smsCode = res.code
				} catch (err) {
					uni.showToast({ title: err.message || '发送失败', icon: 'none' })
				}
			},
			async onSubmit() {
				if (this.loading || !this.validate()) return
				this.loading = true
				try {
					const session = await register({ name: this.name, phone: this.phone, password: this.password, smsCode: this.smsCode })
					saveSession(session)
					await this.bindInviteReferrer()
					uni.showToast({ title: '注册成功', icon: 'success' })
					setTimeout(() => {
						uni.switchTab({ url: '/pages/index/index', fail: () => uni.navigateBack() })
					}, 600)
				} catch (err) {
					uni.showToast({ title: err.message || '注册失败', icon: 'none' })
				} finally {
					this.loading = false
				}
			},
			async bindInviteReferrer() {
				if (!this.invitePhone || !this.inviteId) return
				try {
					await bindReferrer({ phone: this.invitePhone, referrerId: this.inviteId })
				} catch (err) {
					console.warn('邀请推荐人绑定失败', err)
				}
			}
		}
	}
</script>

<style lang="scss">
page {
	background: #ffffff;
}

.page {
	min-height: 100vh;
	background: #ffffff;
}

.header {
	position: relative;
	height: 440rpx;
	background: linear-gradient(180deg, #cfeaff 0%, #a6d6f7 100%);
	overflow: hidden;
}

.illu {
	position: absolute;
	left: 50%;
	top: 78rpx;
	width: 88%;
	transform: translateX(-50%);
}

.back {
	position: absolute;
	top: 30rpx;
	left: 24rpx;
	display: flex;
	align-items: center;
	color: #ffffff;
	font-size: 28rpx;
	z-index: 2;
}

.back-arrow {
	margin-right: 6rpx;
	font-size: 40rpx;
	line-height: 40rpx;
}

.form {
	margin-top: -26rpx;
	padding: 0 54rpx 48rpx;
	background: #ffffff;
	border-radius: 28rpx 28rpx 0 0;
	position: relative;
	z-index: 1;
}

.title {
	padding-top: 48rpx;
	font-size: 46rpx;
	font-weight: 800;
	color: #14233c;
	text-align: center;
}

.subtitle {
	margin: 16rpx 0 34rpx;
	font-size: 26rpx;
	color: #7d8da6;
	text-align: center;
}

.invite-tip {
	margin: -16rpx 0 26rpx;
	padding: 14rpx 18rpx;
	border-radius: 10rpx;
	background: #eef6ff;
	color: #1677ff;
	font-size: 24rpx;
	font-weight: 700;
	text-align: center;
}

.input-row {
	height: 94rpx;
	margin-bottom: 24rpx;
	padding: 0 28rpx;
	display: flex;
	align-items: center;
	background: #f6f9fe;
	border: 2rpx solid #e5edf7;
	border-radius: 18rpx;
	box-sizing: border-box;
}

.input-icon {
	width: 48rpx;
	font-size: 30rpx;
	color: #5c7cfa;
	text-align: center;
}

.input {
	flex: 1;
	height: 88rpx;
	margin-left: 18rpx;
	font-size: 30rpx;
	color: #16233a;
}
.code-btn {
	flex-shrink:0;
	margin-left:18rpx;
	color:#1677ff;
	font-size:26rpx;
	font-weight:700;
}
.agree-row {
	display:flex;
	align-items:center;
	flex-wrap:wrap;
	margin:4rpx 0 22rpx;
	font-size:23rpx;
	color:#687386;
}
.checkbox {
	width:34rpx;
	height:34rpx;
	border-radius:50%;
	margin-right:10rpx;
	border:2rpx solid #9eb3c8;
	display:flex;
	align-items:center;
	justify-content:center;
	color:#fff;
	font-size:22rpx;
}
.checkbox.checked {
	background:#1677ff;
	border-color:#1677ff;
}
.link {
	color:#1677ff;
	margin:0 4rpx;
}

.ph {
	color: #a7b4c8;
}

.register-btn {
	height: 94rpx;
	margin-top: 12rpx;
	border-radius: 47rpx;
	background: linear-gradient(90deg, #5c7cfa 0%, #49b6ff 100%);
	color: #ffffff;
	font-size: 32rpx;
	font-weight: 700;
	line-height: 94rpx;
}

.register-btn::after {
	border: none;
}

.login-row {
	margin-top: 32rpx;
	display: flex;
	justify-content: center;
	align-items: center;
	font-size: 28rpx;
}

.login-tip {
	color: #8a96a8;
}

.login-link {
	margin-left: 8rpx;
	color: #5c7cfa;
	font-weight: 700;
}
</style>

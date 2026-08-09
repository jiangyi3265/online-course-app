<template>
	<view class="page">
		<!-- 顶部插画区域 -->
		<view class="header">
			<view class="back" @click="goHome">
				<text class="back-arrow">‹</text>
				<text class="back-text">返回首页</text>
			</view>

			<image class="illu" src="/static/login-hero-education.jpg?v=2026072701" mode="aspectFill" />
			<view class="wave"></view>
		</view>

		<!-- 表单 -->
		<view class="form">
			<view class="title">元知智学</view>
			<view class="invite-tip" v-if="inviteId || invitePhone">邀请人：{{invitePhone || '--'}} / ID {{inviteId || '--'}}</view>
			<view class="session-tip" v-if="sessionExpired">登录状态已失效，请重新登录</view>

			<template v-if="!resetMode">
			<view class="input-row">
				<AppFieldIcon class="field-icon" type="phone" />
				<input class="input" type="number" maxlength="11" placeholder="请输入手机号" v-model="phone" placeholder-class="ph" />
			</view>

			<view class="input-row">
				<AppFieldIcon class="field-icon" type="lock" />
				<input class="input" :type="showPassword ? 'text' : 'password'" placeholder="请输入密码" v-model="password" placeholder-class="ph" />
				<view class="visibility-button" :class="{active: showPassword}" role="button" :aria-label="showPassword ? '隐藏密码' : '显示密码'" @click.stop="showPassword = !showPassword">
					<view class="eye-icon"><view class="eye-pupil"></view></view>
				</view>
			</view>

			<view class="forget" @click="onForget">忘记密码?</view>

			<button class="login-btn" @click="onLogin">登录</button>

			<view class="register-row">
				<text class="register-tip">没有账号？</text>
				<text class="register-link" @click="onRegister">立即注册</text>
			</view>

			<view class="agree-row">
				<view class="checkbox" :class="{checked: agree}" @click="agree = !agree">
					<text v-if="agree" class="tick">✓</text>
				</view>
				<text class="agree-text">我已阅读并同意</text>
				<text class="link" @click="openProtocol">用户隐私协议</text>
				<text class="agree-text">和</text>
				<text class="link" @click="openPolicy">用户隐私政策</text>
			</view>
			</template>

			<template v-else>
				<view class="reset-tip">忘记密码后，输入注册手机号、验证码和新密码即可重置。</view>
				<view class="input-row">
					<AppFieldIcon class="field-icon" type="phone" />
					<input class="input" type="number" maxlength="11" placeholder="请输入手机号" v-model="reset.phone" placeholder-class="ph" />
				</view>
				<view class="input-row">
					<AppFieldIcon class="field-icon" type="code" />
					<input class="input" type="number" maxlength="6" placeholder="验证码" v-model="reset.smsCode" placeholder-class="ph" />
					<text class="code-btn" @click="getResetCode">获取验证码</text>
				</view>
				<view class="input-row">
					<AppFieldIcon class="field-icon" type="lock" />
					<input class="input" :type="showResetPassword ? 'text' : 'password'" placeholder="请输入新密码" v-model="reset.password" placeholder-class="ph" />
					<view class="visibility-button" :class="{active: showResetPassword}" role="button" :aria-label="showResetPassword ? '隐藏密码' : '显示密码'" @click.stop="showResetPassword = !showResetPassword">
						<view class="eye-icon"><view class="eye-pupil"></view></view>
					</view>
				</view>
				<view class="input-row">
					<AppFieldIcon class="field-icon" type="check" />
					<input class="input" :type="showResetConfirmPassword ? 'text' : 'password'" placeholder="确认新密码" v-model="reset.confirmPassword" placeholder-class="ph" />
					<view class="visibility-button" :class="{active: showResetConfirmPassword}" role="button" :aria-label="showResetConfirmPassword ? '隐藏密码' : '显示密码'" @click.stop="showResetConfirmPassword = !showResetConfirmPassword">
						<view class="eye-icon"><view class="eye-pupil"></view></view>
					</view>
				</view>
				<button class="login-btn" @click="submitReset">保存</button>
				<view class="register-row">
					<text class="register-tip">想起密码？</text>
					<text class="register-link" @click="resetMode=false">返回登录</text>
				</view>
			</template>
		</view>
	</view>
</template>

<script>
	import AppFieldIcon from '@/components/app-field-icon.vue'
	import { bindReferrer, decodeRouteText, login, resetPassword, saveSession, sendSmsCode } from '@/common/api.js'
	import { resumeSessionTimeout, startAuthenticatedSession } from '@/common/session-timeout.js'
	export default {
		components: { AppFieldIcon },
		data() {
			return {
				phone: '',
				password: '',
				showPassword: false,
				showResetPassword: false,
				showResetConfirmPassword: false,
				agree: true,
				resetMode: false,
				reset: {
					phone: '',
					smsCode: '',
					password: '',
					confirmPassword: ''
				},
				invitePhone: '',
				inviteId: '',
				sessionExpired: false
			}
		},
		onLoad(opts = {}) {
			this.invitePhone = opts.invitePhone ? decodeRouteText(opts.invitePhone) : '';
			this.inviteId = opts.inviteId ? decodeRouteText(opts.inviteId) : '';
			this.sessionExpired = opts.reason === 'inactive';
		},
		methods: {
			goHome() {
				this.enterHome();
			},
			enterHome() {
				const url = '/pages/index/index';
				const fallback = () => {
					if (typeof window !== 'undefined') window.location.hash = `#${url}`;
				};
				uni.reLaunch({
					url,
					fail: () => uni.redirectTo({ url, fail: fallback })
				});
			},
			finishLogin() {
				uni.hideToast();
				this.sessionExpired = false;
				startAuthenticatedSession();
				resumeSessionTimeout();
				uni.showToast({ title: '登录成功', icon: 'success', duration: 800 });
				setTimeout(() => this.enterHome(), 350);
			},
			onForget() {
				this.reset.phone = this.phone;
				this.resetMode = true;
			},
			onRegister() {
				const query = this.inviteQuery();
				uni.navigateTo({ url: `/pages/register/register${query}` });
			},
			inviteQuery() {
				const params = [];
				if (this.invitePhone) params.push(`invitePhone=${encodeURIComponent(this.invitePhone)}`);
				if (this.inviteId) params.push(`inviteId=${encodeURIComponent(this.inviteId)}`);
				return params.length ? `?${params.join('&')}` : '';
			},
			async bindInviteReferrer() {
				if (!this.invitePhone || !this.inviteId) return;
				try {
					await bindReferrer({ phone: this.invitePhone, referrerId: this.inviteId });
				} catch (err) {
					console.warn('邀请推荐人绑定失败', err);
				}
			},
			openProtocol() {
				uni.navigateTo({ url: '/pages/agreement/agreement?type=user' });
			},
			openPolicy() {
				uni.navigateTo({ url: '/pages/agreement/agreement?type=privacy' });
			},
			async getResetCode() {
				if (!/^1\d{10}$/.test(this.reset.phone)) {
					uni.showToast({ title: '请输入正确的手机号', icon: 'none' });
					return;
				}
				try {
					const res = await sendSmsCode(this.reset.phone);
					uni.showToast({ title: res.message || '验证码已发送', icon: 'none' });
					if (res.code) this.reset.smsCode = res.code;
				} catch (err) {
					uni.showToast({ title: err.message || '发送失败', icon:'none' });
				}
			},
			async submitReset() {
				if (!/^1\d{10}$/.test(this.reset.phone)) {
					uni.showToast({ title: '请输入正确的手机号', icon: 'none' });
					return;
				}
				if (!this.reset.smsCode) {
					uni.showToast({ title: '请输入验证码', icon: 'none' });
					return;
				}
				if (this.reset.password.length < 6 || this.reset.password !== this.reset.confirmPassword) {
					uni.showToast({ title: '请确认两次新密码一致且不少于6位', icon: 'none' });
					return;
				}
				try {
					await resetPassword({ phone: this.reset.phone, smsCode: this.reset.smsCode, password: this.reset.password });
					this.phone = this.reset.phone;
					this.password = this.reset.password;
					this.resetMode = false;
					uni.showToast({ title: '密码已重置', icon:'success' });
				} catch (err) {
					uni.showToast({ title: err.message || '重置失败', icon:'none' });
				}
			},
			async onLogin() {
				if (!this.agree) {
					uni.showToast({ title: '请先同意协议', icon: 'none' });
					return;
				}
				if (!/^1\d{10}$/.test(this.phone)) {
					uni.showToast({ title: '请输入正确的手机号', icon: 'none' });
					return;
				}
				if (!this.password) {
					uni.showToast({ title: '请输入密码', icon: 'none' });
					return;
				}

				try {
					const session = await login(this.phone, this.password);
					saveSession(session);
					await this.bindInviteReferrer();
					this.finishLogin();
					return;
				} catch (err) {
					console.warn('登录接口不可用', err);
					uni.showToast({
						title: (err && err.message) || '登录服务暂时无法使用，请稍后重试',
						icon: 'none',
						duration: 2600
					});
				}
			}
		}
	}
</script>

<style lang="scss" scoped>
page {
	background: #ffffff;
}

.page {
	min-height: 100vh;
	background: #ffffff;
	display: flex;
	flex-direction: column;
}

.session-tip {
	margin: 0 auto 22rpx;
	padding: 14rpx 24rpx;
	border-radius: 12rpx;
	background: #fff4e8;
	color: #b45309;
	font-size: 24rpx;
	line-height: 1.4;
	text-align: center;
}

/* ============ Header ============ */
.header {
	position: relative;
	width: 100%;
	height: 520rpx;
	background: linear-gradient(180deg, #cfeaff 0%, #b7dffb 60%, #a6d6f7 100%);
	overflow: hidden;
}
.illu { position:absolute; left:50%; top:80rpx; transform:translateX(-50%); width:90%; }

.back {
	position: absolute;
	top: 30rpx;
	left: 24rpx;
	display: flex;
	align-items: center;
	color: #ffffff;
	font-size: 28rpx;
	z-index: 10;
	cursor: pointer;
}
.back-arrow {
	font-size: 40rpx;
	line-height: 40rpx;
	margin-right: 6rpx;
	font-weight: 300;
}
.back-text { font-size: 28rpx; }

/* 装饰圆点 */
.header::before {
	content: '';
	position: absolute;
	top: 30rpx;
	right: 60rpx;
	width: 30rpx; height: 30rpx;
	background: rgba(255,255,255,0.55);
	border-radius: 50%;
}
.header::after {
	content: '';
	position: absolute;
	top: 100rpx;
	right: 30rpx;
	width: 18rpx; height: 18rpx;
	background: rgba(255,255,255,0.45);
	border-radius: 50%;
}

/* 插画整体 */
.illustration {
	position: absolute;
	left: 0; right: 0;
	top: 70rpx;
	height: 360rpx;
}

/* 笔记本 */
.laptop {
	position: absolute;
	left: 50%;
	top: 90rpx;
	transform: translateX(-55%);
	width: 280rpx;
}
.laptop-screen {
	width: 280rpx;
	height: 180rpx;
	background: linear-gradient(180deg, #ffffff 0%, #e8f4ff 100%);
	border: 4rpx solid #4a90e2;
	border-radius: 14rpx 14rpx 4rpx 4rpx;
	display: flex;
	align-items: center;
	justify-content: center;
}
.laptop-label {
	font-size: 56rpx;
	font-weight: 800;
	color: #ff7a59;
	letter-spacing: 4rpx;
	font-family: "Comic Sans MS", "Arial Rounded MT Bold", sans-serif;
	text-shadow: 2rpx 2rpx 0 #ffd0c2;
}
.laptop-base {
	width: 340rpx;
	height: 14rpx;
	background: #6a7fbf;
	border-radius: 0 0 20rpx 20rpx;
	margin-left: -30rpx;
}

/* 平板 */
.tablet {
	position: absolute;
	right: 80rpx;
	top: 110rpx;
	width: 170rpx;
	transform: rotate(-6deg);
}
.tablet-screen {
	width: 170rpx;
	height: 220rpx;
	background: #ffffff;
	border: 4rpx solid #5b6ec9;
	border-radius: 14rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
}
.tablet-label {
	font-size: 32rpx;
	font-weight: 800;
	color: #ff8b3d;
	font-family: "Comic Sans MS", sans-serif;
}
.tablet-sub {
	font-size: 18rpx;
	color: #888;
	margin-top: 4rpx;
}

/* 书 */
.book {
	position: absolute;
	right: 200rpx;
	bottom: 40rpx;
	width: 130rpx;
	height: 50rpx;
	background: linear-gradient(180deg, #ffb066 0%, #ff8a3d 100%);
	border-radius: 6rpx;
	box-shadow: -4rpx 0 0 #ff7626;
}
.book::before {
	content: '';
	position: absolute;
	top: -8rpx;
	left: 8rpx;
	right: 8rpx;
	height: 10rpx;
	background: #fff5e8;
	border-radius: 4rpx;
}

/* PLAN */
.plan {
	position: absolute;
	left: 220rpx;
	top: 30rpx;
	background: #ffb84a;
	color: #fff;
	font-weight: 800;
	font-size: 22rpx;
	padding: 6rpx 14rpx;
	border-radius: 6rpx;
	transform: rotate(-8deg);
	letter-spacing: 2rpx;
}
.plan::after {
	content: '';
	position: absolute;
	left: 14rpx;
	bottom: -8rpx;
	border: 6rpx solid transparent;
	border-top-color: #ffb84a;
}

/* 小聊天气泡 */
.chat-bubble {
	position: absolute;
	left: 90rpx;
	top: 30rpx;
	width: 70rpx;
	height: 50rpx;
	background: #b1c4d9;
	border-radius: 10rpx;
	transform: rotate(-10deg);
}
.chat-bubble::after {
	content: '';
	position: absolute;
	left: 10rpx;
	bottom: -10rpx;
	border: 6rpx solid transparent;
	border-top-color: #b1c4d9;
}

/* 人物 (色块示意) */
.person {
	position: absolute;
	border-radius: 20rpx 20rpx 8rpx 8rpx;
}
.p1 {
	left: 60rpx;
	bottom: 50rpx;
	width: 36rpx;
	height: 90rpx;
	background: #5b6ec9;
}
.p2 {
	left: 130rpx;
	bottom: 60rpx;
	width: 36rpx;
	height: 80rpx;
	background: #ff8b3d;
}
.p3 {
	left: 350rpx;
	top: 60rpx;
	width: 36rpx;
	height: 80rpx;
	background: #5b6ec9;
}
.p4 {
	right: 100rpx;
	bottom: 60rpx;
	width: 70rpx;
	height: 30rpx;
	background: #ff8b3d;
	border-radius: 14rpx;
}

/* 底部波浪 */
.wave {
	position: absolute;
	left: -10rpx; right: -10rpx;
	bottom: -2rpx;
	height: 80rpx;
	background:
		radial-gradient(40rpx 40rpx at 20% 0%, transparent 39rpx, #ffffff 40rpx),
		radial-gradient(50rpx 50rpx at 60% 0%, transparent 49rpx, #ffffff 50rpx),
		#ffffff;
	border-top-left-radius: 50% 60rpx;
	border-top-right-radius: 50% 80rpx;
}

/* ============ Form ============ */
.form {
	padding: 60rpx 60rpx 0;
	flex: 1;
}

.title {
	text-align: center;
	color: #2d8cf0;
	font-size: 40rpx;
	font-weight: 700;
	margin: 40rpx 0 60rpx;
}
.invite-tip {
	margin:-36rpx 0 34rpx;
	padding:16rpx 20rpx;
	border-radius:12rpx;
	background:#eef6ff;
	color:#2563eb;
	font-size:25rpx;
	text-align:center;
}

.input-row {
	display: flex;
	align-items: center;
	height: 88rpx;
	border: 2rpx solid #2d8cf0;
	border-radius: 50rpx;
	background: #eaf4ff;
	padding: 0 30rpx;
	margin-bottom: 30rpx;
}
.field-icon {
	margin-right: 16rpx;
	color: #2d8cf0;
}
.input {
	flex: 1;
	min-width: 0;
	height: 88rpx;
	font-size: 28rpx;
	color: #333;
	background: transparent;
}
/* 隐藏 Edge/IE 与部分 Chromium 内核自带的密码查看按钮，避免和产品按钮叠加。 */
.input::-ms-reveal,
.input::-ms-clear,
.input::-webkit-credentials-auto-fill-button,
.input::-webkit-contacts-auto-fill-button,
.input :deep(.uni-input-input::-ms-reveal),
.input :deep(.uni-input-input::-ms-clear),
.input :deep(.uni-input-input::-webkit-credentials-auto-fill-button),
.input :deep(.uni-input-input::-webkit-contacts-auto-fill-button) {
	display:none !important;
	visibility:hidden !important;
	pointer-events:none !important;
	width:0 !important;
	height:0 !important;
}
.visibility-button {
	width:64rpx;
	height:64rpx;
	margin-left:8rpx;
	display:flex;
	align-items:center;
	justify-content:center;
	flex:0 0 64rpx;
	color:#7f96ad;
	cursor:pointer;
}
.visibility-button.active { color:#2d8cf0; }
.eye-icon {
	position:relative;
	width:34rpx;
	height:21rpx;
	border:3rpx solid currentColor;
	border-radius:50%;
	box-sizing:border-box;
}
.eye-pupil {
	position:absolute;
	left:50%;
	top:50%;
	width:9rpx;
	height:9rpx;
	border-radius:50%;
	background:currentColor;
	transform:translate(-50%,-50%);
}
.visibility-button:not(.active) .eye-icon::after {
	content:'';
	position:absolute;
	left:-5rpx;
	top:8rpx;
	width:40rpx;
	height:3rpx;
	border-radius:3rpx;
	background:currentColor;
	transform:rotate(-42deg);
}
.reset-tip {
	margin: 12rpx 0 26rpx;
	color:#d45b5b;
	font-size:26rpx;
	line-height:1.5;
	text-align:center;
}
.code-btn {
	flex-shrink:0;
	margin-left:18rpx;
	color:#1296db;
	font-size:26rpx;
	font-weight:700;
}
.ph {
	color: #9bb6cf;
}

.forget {
	text-align: right;
	color: #9aa5b1;
	font-size: 24rpx;
	margin-top: 4rpx;
	margin-bottom: 50rpx;
	cursor: pointer;
}

.login-btn {
	position: relative;
	z-index: 1;
	height: 90rpx;
	line-height: 90rpx;
	background: #2d8cf0;
	color: #fff;
	border-radius: 50rpx;
	font-size: 32rpx;
	font-weight: 500;
	border: none;
	box-shadow: 0 8rpx 16rpx rgba(45,140,240,0.25);
}
.login-btn::after { border: none; }

.register-row {
	text-align: center;
	margin-top: 30rpx;
	font-size: 26rpx;
	color: #5a5a5a;
}
.register-link {
	color: #2d8cf0;
	margin-left: 4rpx;
	cursor: pointer;
}

.agree-row {
	display: flex;
	align-items: center;
	justify-content: center;
	margin-top: 24rpx;
	font-size: 22rpx;
	color: #5a5a5a;
	flex-wrap: wrap;
}
.checkbox {
	width: 28rpx;
	height: 28rpx;
	border-radius: 50%;
	border: 2rpx solid #2d8cf0;
	background: #2d8cf0;
	display: flex;
	align-items: center;
	justify-content: center;
	margin-right: 10rpx;
	cursor: pointer;
}
.checkbox.checked { background: #2d8cf0; }
.tick {
	color: #fff;
	font-size: 22rpx;
	line-height: 22rpx;
}
.link {
	color: #2d8cf0;
	text-decoration: underline;
	cursor: pointer;
}
.agree-text { color: #5a5a5a; }

@media screen and (min-width: 600px) {
	.page {
		min-height:100vh;
	}
	.header {
		height:240px;
		background:#dbe7ef;
	}
	.illu {
		inset:0;
		width:100%;
		height:100%;
		transform:none;
		object-fit:cover;
	}
	.back {
		top:22px;
		left:28px;
		font-size:16px;
	}
	.back-arrow {
		margin-right:5px;
		font-size:32px;
		line-height:32px;
	}
	.back-text {
		font-size:16px;
	}
	.wave {
		left:-8px;
		right:-8px;
		bottom:-1px;
		height:52px;
		border-top-left-radius:50% 38px;
		border-top-right-radius:50% 48px;
	}
	.form {
		width:100%;
		max-width:720px;
		margin:0 auto;
		padding:22px 40px 44px;
		box-sizing:border-box;
	}
	.title {
		margin:12px 0 28px;
		font-size:28px;
	}
	.invite-tip,
	.session-tip {
		margin:0 auto 18px;
		padding:10px 16px;
		border-radius:9px;
		font-size:14px;
	}
	.input-row {
		height:56px;
		margin-bottom:18px;
		padding:0 20px;
		border-width:1px;
		border-radius:30px;
	}
	.field-icon {
		margin-right:12px;
	}
	.visibility-button {
		width:44px;
		height:44px;
		margin-left:4px;
		flex-basis:44px;
	}
	.eye-icon {
		width:18px;
		height:11px;
		border-width:1.5px;
	}
	.eye-pupil {
		width:5px;
		height:5px;
	}
	.visibility-button:not(.active) .eye-icon::after {
		left:-3px;
		top:4px;
		width:22px;
		height:1.5px;
	}
	.input {
		height:56px;
		font-size:16px;
	}
	.reset-tip,
	.code-btn,
	.register-row {
		font-size:15px;
	}
	.forget {
		margin:2px 0 28px;
		font-size:14px;
	}
	.login-btn {
		height:56px;
		line-height:56px;
		border-radius:30px;
		font-size:18px;
	}
	.register-row {
		margin-top:20px;
	}
	.agree-row {
		margin-top:18px;
		font-size:13px;
	}
	.checkbox {
		width:20px;
		height:20px;
		margin-right:7px;
		border-width:1px;
	}
	.tick {
		font-size:15px;
		line-height:15px;
	}
}

@media screen and (min-width: 900px) and (max-width: 1366px) {
	.form {
		padding-top:26px;
	}
}
</style>

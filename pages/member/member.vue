<template>
	<view class="page">
		<!-- 未登录态：直接弹提示 -->
		<view class="mask" v-if="!logined && showModal">
			<view class="modal">
				<view class="m-title">提示</view>
				<view class="m-body">您还未登录，是否登录？</view>
				<view class="m-actions">
					<view class="m-btn cancel" @click="cancel">取消</view>
					<view class="m-divider"></view>
					<view class="m-btn ok" @click="goLogin">登录</view>
				</view>
			</view>
		</view>

		<!-- 已登录内容 -->
		<block v-if="logined">
			<view class="member-content">
				<view class="user-card">
					<view class="avatar" @click="goProfile">
						<image v-if="avatarUrl" class="avatar-img" :src="avatarUrl" mode="aspectFill" @error="onAvatarError" />
						<text v-else class="avatar-letter">{{avatarInitial}}</text>
					</view>
					<view class="u-info">
						<view class="u-name">{{userInfo.name || '用户'}}</view>
						<view class="u-id">ID：{{userInfo.id || '--'}}</view>
					</view>
					<view class="logout-btn" @click="onLogout">退出</view>
				</view>

				<view class="invite" @click="showInvite = true">
					<view class="invite-l">
						<view class="invite-t">邀请好友</view>
						<view class="invite-s">绑定推荐关系后，好友会自动进入你的学生列表</view>
					</view>
					<view class="invite-btn">立即邀请</view>
				</view>

				<view class="func-panel">
					<view class="section-title">常用功能</view>
					<view class="funcs">
						<view class="func" :class="{featured: f.featured}" v-for="(f,i) in funcs" :key="i" @click="openFunc(f)">
							<view class="f-ico has-image" :class="'icon-' + f.icon">
								<image class="f-icon-image" :src="f.iconUrl" mode="aspectFit" />
							</view>
							<view class="f-main">
								<text class="f-text">{{f.text}}</text>
							</view>
						</view>
					</view>
				</view>
			</view>
		</block>

		<view class="invite-mask" v-if="showInvite" @click="showInvite=false">
			<view class="invite-modal" @click.stop>
				<view class="invite-modal-title">邀请好友登录</view>
				<view class="invite-code">
					<image class="invite-qr" :src="inviteQrUrl" mode="aspectFit" />
				</view>
				<view class="invite-line">邀请人手机号：{{invitePhone}}</view>
				<view class="invite-line">邀请人ID：{{inviteId}}</view>
				<view class="invite-go" @click="goInviteLogin">跳转登录页</view>
				<view class="invite-close" @click="showInvite=false">关闭</view>
			</view>
		</view>

		<tab-bar active="member" />
	</view>
</template>

<script>
import TabBar from '@/components/tab-bar.vue'
import { clearSession, getProfile, isLoggedIn, isUsableMediaUrl, resolveMediaUrl } from '@/common/api.js'
export default {
	components: { TabBar },
	data() {
		return {
			logined: false,
			showModal: false,
			showInvite: false,
			avatarLoadError: false,
			avatarCandidateIndex: 0,
			userInfo: {},
			funcs: [
				{ icon:'referrer', iconUrl:'/static/system-icons/member/referrer.png', text:'我的推荐人', desc:'绑定推荐关系', route:'/pages/referrer/referrer', featured:true },
				{ icon:'students', iconUrl:'/static/system-icons/member/students.png', text:'我的学生', desc:'只读查看学情', route:'/pages/students/students', featured:true },
				{ icon:'stats', iconUrl:'/static/system-icons/member/stats.png', text:'学情统计', desc:'学习数据汇总', route:'/pages/study-analysis/study-analysis' },
				{ icon:'favorites', iconUrl:'/static/system-icons/member/favorites.png', text:'我的收藏', desc:'课程与题目收藏', route:'/pages/favorites/favorites' },
				{ icon:'feedback', iconUrl:'/static/system-icons/member/feedback.png', text:'意见反馈', desc:'提交问题建议', route:'/pages/feedback/feedback' },
				{ icon:'privacy', iconUrl:'/static/system-icons/member/privacy.png', text:'隐私政策', desc:'查看隐私说明' },
				{ icon:'agreement', iconUrl:'/static/system-icons/member/agreement.png', text:'用户协议', desc:'查看服务条款' }
			]
		}
	},
	computed: {
		invitePhone() {
			return this.userInfo.phone || '15585827319';
		},
		inviteId() {
			return this.userInfo.id || '--';
		},
		inviteLoginUrl() {
			const query = `invitePhone=${encodeURIComponent(this.invitePhone)}&inviteId=${encodeURIComponent(this.inviteId)}`;
			if (typeof window !== 'undefined' && window.location) {
				return `${window.location.origin}${window.location.pathname}#/pages/login/login?${query}`;
			}
			return `/pages/login/login?${query}`;
		},
		inviteQrUrl() {
			return `https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=8&data=${encodeURIComponent(this.inviteLoginUrl)}`;
		},
		avatarCandidates() {
			const raw = String(this.userInfo.avatar || this.userInfo.avatarUrl || '').trim();
			if (!raw) return [];
			const candidates = [];
			const add = value => {
				const url = String(value || '').trim();
				if (!url || !isUsableMediaUrl(url) || candidates.includes(url)) return;
				candidates.push(url);
			};
			add(resolveMediaUrl(raw));
			let stablePath = raw;
			const proxyMatch = raw.match(/\/course\/app\/media\?[^#]*\bpath=([^&#]+)/i);
			if (proxyMatch && proxyMatch[1]) {
				try {
					stablePath = decodeURIComponent(proxyMatch[1]);
				} catch (err) {
					stablePath = proxyMatch[1];
				}
			}
			const absolutePath = stablePath.match(/^https?:\/\/[^/]+(\/(?:prod-api\/)?(?:profile|avatar|upload|uploads)\/[^?#]+)/i);
			if (absolutePath && absolutePath[1]) stablePath = absolutePath[1];
			if (/^\/(?:prod-api\/)?(?:profile|avatar|upload|uploads)\//i.test(stablePath)) {
				add(stablePath.replace(/^\/prod-api/i, ''));
			}
			return candidates.map(url => this.avatarVersionedUrl(url));
		},
		avatarUrl() {
			if (this.avatarLoadError) return '';
			return this.avatarCandidates[this.avatarCandidateIndex] || '';
		},
		avatarInitial() {
			const name = String(this.userInfo.name || this.userInfo.nickName || '用户').trim();
			return name ? name.slice(0, 1) : '用';
		}
	},
	async onShow() {
		this.logined = isLoggedIn();
		this.userInfo = uni.getStorageSync('userInfo') || {};
		this.resetAvatarState();
		if (this.logined) {
			try {
				const profile = await getProfile();
				this.userInfo = { ...this.userInfo, ...(profile || {}) };
				this.resetAvatarState();
				uni.setStorageSync('userInfo', this.userInfo);
			} catch (err) {
				console.warn('个人资料刷新失败', err);
			}
		}
		if (this.funcs[5]) this.funcs[5].route = '/pages/agreement/agreement?type=privacy';
		if (this.funcs[6]) this.funcs[6].route = '/pages/agreement/agreement?type=user';
		this.syncAgencyFunc();
		if (!this.logined) this.showModal = true;
	},
	methods: {
		avatarVersionedUrl(url) {
			const version = String(this.userInfo.updatedAt || this.userInfo.avatarUpdatedAt || '').trim();
			const isBackendAvatar = /\/course\/app\/media\?|^\/(?:profile|avatar|upload|uploads)\//i.test(url);
			if (!version || !isBackendAvatar || /^(data:|blob:|file:)/i.test(url)) return url;
			return `${url}${url.includes('?') ? '&' : '?'}avatarV=${encodeURIComponent(version)}`;
		},
		resetAvatarState() {
			this.avatarLoadError = false;
			this.avatarCandidateIndex = 0;
		},
		onAvatarError() {
			if (this.avatarCandidateIndex + 1 < this.avatarCandidates.length) {
				this.avatarCandidateIndex += 1;
				return;
			}
			this.avatarLoadError = true;
		},
		syncAgencyFunc() {
			const route = '/pages/my-agency/my-agency';
			const index = this.funcs.findIndex(item => item.route === route);
			const enabled = this.userInfo && this.userInfo.role === 'agency_admin';
			if (enabled && index < 0) {
				this.funcs.push({ icon:'campus', iconUrl:'/static/system-icons/member/campus.png', text:'我的校区', desc:'校区激活码统计', route });
			}
			if (!enabled && index >= 0) {
				this.funcs.splice(index, 1);
			}
		},
		cancel() { this.showModal=false; uni.switchTab({ url:'/pages/index/index', fail:()=>uni.redirectTo({ url:'/pages/index/index' }) }); },
		goLogin() { this.showModal=false; uni.navigateTo({ url:'/pages/login/login' }); },
		onLogout() {
			clearSession();
			this.logined = false;
			this.userInfo = {};
			this.showModal = true;
		},
		openFunc(f) {
			if (f.route) {
				uni.navigateTo({ url:f.route });
				return;
			}
			uni.showToast({ title:f.text, icon:'none' });
		},
		goInviteLogin() {
			this.showInvite = false;
			uni.navigateTo({ url:`/pages/login/login?invitePhone=${encodeURIComponent(this.invitePhone)}&inviteId=${encodeURIComponent(this.inviteId)}` });
		},
		goProfile() { uni.navigateTo({ url:'/pages/profile/profile' }); }
	}
}
</script>

<style lang="scss">
page { background:#f6f8fb; }
.page { min-height:100vh; padding-bottom:140rpx; background:#f6f8fb; box-sizing:border-box; }

.mask { position:fixed; inset:0; background:rgba(15,23,42,.48); display:flex; align-items:center; justify-content:center; z-index:200; }
.modal { width:560rpx; background:#fff; border-radius:14rpx; overflow:hidden; }
.m-title { text-align:center; padding:36rpx 0 16rpx; font-size:34rpx; color:#1f2933; font-weight:900; }
.m-body { text-align:center; padding:0 30rpx 36rpx; color:#667085; font-size:28rpx; }
.m-actions { display:flex; border-top:1rpx solid #eceff3; }
.m-btn { flex:1; height:96rpx; line-height:96rpx; text-align:center; font-size:32rpx; cursor:pointer; }
.m-btn.cancel { color:#344054; }
.m-btn.ok { color:#1677ff; font-weight:800; }
.m-divider { width:1rpx; background:#eceff3; }

.member-content { padding:28rpx 24rpx 0; box-sizing:border-box; }
.user-card { display:flex; align-items:center; gap:22rpx; padding:28rpx; background:#fff; border:1rpx solid #e8edf3; border-radius:18rpx; box-shadow:0 8rpx 22rpx rgba(16,24,40,.04); }
.avatar { width:112rpx; height:112rpx; border-radius:50%; background:#e7f1fb; display:flex; align-items:center; justify-content:center; font-size:44rpx; color:#1677ff; overflow:hidden; cursor:pointer; flex-shrink:0; font-weight:900; }
.avatar-img { width:100%; height:100%; display:block; }
.avatar-letter { line-height:1; }
.u-info { flex:1; min-width:0; }
.u-name { font-size:34rpx; font-weight:900; color:#1f2933; line-height:1.25; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.u-id { font-size:24rpx; color:#667085; margin-top:8rpx; }
.logout-btn { flex-shrink:0; min-width:108rpx; height:56rpx; line-height:56rpx; text-align:center; background:#ff5a5f; color:#fff; border-radius:999rpx; font-size:24rpx; font-weight:800; cursor:pointer; }

.invite { margin-top:22rpx; min-height:164rpx; background:linear-gradient(135deg,#5bb5ee 0%, #9dd8f5 100%); border-radius:16rpx; display:flex; align-items:center; justify-content:space-between; gap:20rpx; padding:28rpx 30rpx; color:#fff; position:relative; overflow:hidden; box-sizing:border-box; }
.invite::before { content:''; position:absolute; right:-52rpx; top:-42rpx; width:220rpx; height:220rpx; border-radius:50%; background:rgba(255,255,255,0.16); }
.invite-l { position:relative; z-index:1; flex:1; min-width:0; }
.invite-t { font-size:34rpx; font-weight:900; line-height:1.25; }
.invite-s { font-size:24rpx; margin-top:10rpx; opacity:.96; line-height:1.45; }
.invite-btn { position:relative; z-index:1; flex-shrink:0; background:#fff; color:#276d9f; padding:14rpx 24rpx; border-radius:999rpx; font-size:25rpx; font-weight:900; cursor:pointer; }
.invite-mask { position:fixed; inset:0; background:rgba(15,23,42,.46); display:flex; align-items:center; justify-content:center; z-index:260; padding:40rpx; box-sizing:border-box; }
.invite-modal { width:600rpx; max-width:100%; background:#fff; border-radius:16rpx; padding:30rpx; box-sizing:border-box; text-align:center; }
.invite-modal-title { color:#1f2933; font-size:34rpx; font-weight:900; }
.invite-code { width:260rpx; height:260rpx; margin:24rpx auto 18rpx; border-radius:12rpx; background:#f7fafc; border:1rpx solid #e5eaf1; display:flex; align-items:center; justify-content:center; }
.invite-qr { width:230rpx; height:230rpx; }
.invite-line { color:#475467; font-size:27rpx; line-height:1.7; }
.invite-go { margin-top:24rpx; height:76rpx; line-height:76rpx; border-radius:10rpx; background:#1677ff; color:#fff; font-size:28rpx; font-weight:900; }
.invite-close { margin-top:12rpx; height:68rpx; line-height:68rpx; color:#667085; font-size:26rpx; }

.f-symbol {
	position:relative;
	z-index:2;
	color:#1769ff;
	font-size:30rpx;
	font-weight:900;
	line-height:1;
}

.func-panel { margin-top:24rpx; padding:28rpx 24rpx 18rpx; background:#fff; border:1rpx solid #e8edf3; border-radius:18rpx; box-shadow:0 8rpx 22rpx rgba(16,24,40,.04); }
.section-title { font-size:31rpx; font-weight:900; color:#1f2933; line-height:1.25; }
.section-sub { margin-top:8rpx; color:#667085; font-size:23rpx; line-height:1.45; }
.funcs { display:grid; grid-template-columns:1fr 1fr; gap:14rpx; margin-top:24rpx; }
.func { min-height:112rpx; display:flex; align-items:center; gap:16rpx; padding:18rpx; border-radius:12rpx; background:#f8fafc; border:1rpx solid #edf1f6; box-sizing:border-box; cursor:pointer; }
.func.featured { background:#eef7ff; border-color:#cfe7ff; }
.f-ico { width:58rpx; height:58rpx; border-radius:14rpx; display:flex; align-items:center; justify-content:center; background:#fff; font-size:34rpx; flex-shrink:0; box-shadow:0 4rpx 12rpx rgba(16,24,40,.04); }
.f-main { min-width:0; display:flex; flex-direction:column; }
.f-text { color:#1f2933; font-size:25rpx; font-weight:900; line-height:1.25; }
.f-desc { margin-top:7rpx; color:#667085; font-size:21rpx; line-height:1.35; }

/* PC H5 polish */
page { background:#eef3f7; }
.page {
	background:linear-gradient(180deg, #f9fbfd 0%, #eef3f7 420rpx, #eef3f7 100%);
}
.member-content {
	padding:30rpx 24rpx 0;
}
.user-card,
.func-panel {
	border-color:#dfe7f0;
	box-shadow:0 12rpx 28rpx rgba(31,41,51,.045);
}
.user-card {
	border-radius:22rpx;
	padding:30rpx;
}
.avatar {
	width:118rpx;
	height:118rpx;
	box-shadow:inset 0 0 0 1rpx #d7e8ff;
}
.u-name {
	color:#111827;
	letter-spacing:0;
}
.logout-btn {
	height:58rpx;
	line-height:58rpx;
	background:#ff4f55;
	box-shadow:0 8rpx 20rpx rgba(255,79,85,.16);
}
.invite {
	margin-top:24rpx;
	min-height:156rpx;
	border-radius:20rpx;
	background:linear-gradient(135deg, #61b6eb 0%, #a7d9f3 100%);
	box-shadow:0 12rpx 28rpx rgba(41,137,201,.16);
}
.invite-s {
	max-width:36ch;
}
.invite-btn {
	box-shadow:0 8rpx 18rpx rgba(39,109,159,.12);
}
.func-panel {
	margin-top:28rpx;
	padding:30rpx 24rpx 24rpx;
	border-radius:22rpx;
}
.section-title {
	color:#111827;
}
.section-sub {
	color:#66758a;
}
.funcs {
	grid-template-columns:repeat(4, minmax(0, 1fr));
	gap:14rpx;
}
.func {
	min-height:132rpx;
	padding:16rpx 10rpx;
	flex-direction:column;
	justify-content:center;
	text-align:center;
	border-radius:16rpx;
	background:#fff;
	border-color:#e6edf5;
	box-shadow:0 8rpx 18rpx rgba(31,41,51,.035);
}
.func.featured {
	background:#f3f8ff;
	border-color:#cfe0ff;
}
.f-ico {
	width:62rpx;
	height:62rpx;
	border-radius:16rpx;
	margin:0 auto;
}
.f-main {
	align-items:center;
}
.f-text {
	margin-top:6rpx;
	font-size:23rpx;
	color:#111827;
}
.f-desc {
	display:none;
}
@media screen and (max-width: 430px) {
	.funcs {
		grid-template-columns:repeat(3, minmax(0, 1fr));
	}
	.func {
		min-height:124rpx;
	}
	.invite {
		flex-direction:column;
		align-items:flex-start;
	}
	.invite-btn {
		align-self:flex-end;
	}
}

/* Premium CSS icons for desktop */
.func {
	position:relative;
	overflow:hidden;
}
.func::after {
	content:'';
	position:absolute;
	inset:auto 12rpx 10rpx auto;
	width:42rpx;
	height:42rpx;
	border-radius:50%;
	background:rgba(23,105,255,.06);
}
.f-ico {
	position:relative;
	color:transparent;
	background:linear-gradient(180deg, #f8fbff 0%, #edf4ff 100%);
	border:1rpx solid #d8e7fb;
	box-shadow:0 8rpx 18rpx rgba(23,105,255,.08);
}
.f-ico::before,
.f-ico::after {
	content:'';
	position:absolute;
	box-sizing:border-box;
}
.func:nth-child(1) .f-ico::before {
	width:34rpx;
	height:22rpx;
	left:14rpx;
	top:24rpx;
	border-radius:14rpx 14rpx 8rpx 8rpx;
	background:#2563eb;
	box-shadow:22rpx 0 0 #78a7ff;
}
.func:nth-child(1) .f-ico::after {
	width:44rpx;
	height:16rpx;
	left:10rpx;
	top:44rpx;
	border-radius:16rpx 16rpx 8rpx 8rpx;
	background:#bcd7ff;
}
.func:nth-child(2) .f-ico::before,
.func:nth-child(5) .f-ico::before,
.func:nth-child(6) .f-ico::before {
	width:30rpx;
	height:38rpx;
	left:16rpx;
	top:12rpx;
	border:3rpx solid #2563eb;
	border-radius:6rpx;
	background:#fff;
	box-shadow:10rpx 10rpx 0 -4rpx #cfe0ff;
}
.func:nth-child(2) .f-ico::after {
	width:18rpx;
	height:18rpx;
	right:12rpx;
	top:12rpx;
	border-top:4rpx solid #ef4444;
	border-right:4rpx solid #ef4444;
	transform:rotate(45deg);
}
.func:nth-child(3) .f-ico::before {
	width:10rpx;
	height:32rpx;
	left:25rpx;
	top:14rpx;
	border-radius:999rpx;
	background:#ef4444;
	transform:rotate(26deg);
	box-shadow:0 0 0 5rpx #fee2e2;
}
.func:nth-child(3) .f-ico::after {
	width:10rpx;
	height:10rpx;
	left:30rpx;
	bottom:12rpx;
	border-radius:50%;
	background:#2563eb;
}
.func:nth-child(4) .f-ico::before {
	width:38rpx;
	height:26rpx;
	left:12rpx;
	top:18rpx;
	background:#334155;
	clip-path:polygon(50% 0, 100% 28%, 50% 56%, 0 28%);
}
.func:nth-child(4) .f-ico::after {
	width:24rpx;
	height:12rpx;
	left:19rpx;
	top:38rpx;
	border-radius:0 0 14rpx 14rpx;
	background:#f59e0b;
}
.func:nth-child(5) .f-ico::after,
.func:nth-child(6) .f-ico::after {
	width:22rpx;
	height:3rpx;
	left:20rpx;
	top:25rpx;
	background:#94a3b8;
	box-shadow:0 9rpx 0 #94a3b8, 0 18rpx 0 #94a3b8;
}
.func:nth-child(6) .f-ico::before {
	border-color:#7c3aed;
}
.func:nth-child(6) .f-ico::after {
	background:#7c3aed;
	box-shadow:0 9rpx 0 #94a3b8, 0 18rpx 0 #94a3b8;
}
.func:nth-child(7) .f-ico::before {
	width:36rpx;
	height:34rpx;
	left:13rpx;
	top:14rpx;
	border-left:4rpx solid #2563eb;
	border-bottom:4rpx solid #2563eb;
}
.func:nth-child(7) .f-ico::after {
	width:7rpx;
	height:28rpx;
	left:23rpx;
	bottom:14rpx;
	background:#22c55e;
	box-shadow:12rpx -10rpx 0 #f59e0b, 24rpx -18rpx 0 #ef4444;
}

/* Refined desktop line icons */
.func::after {
	display:none;
}
.func {
	background:#f3f8ff;
	border-color:#cfe0ff;
}
.f-ico {
	width:68rpx;
	height:68rpx;
	border-radius:20rpx;
	background:linear-gradient(180deg, #f8fbff 0%, #edf4ff 100%);
	border:1rpx solid #d8e7fb;
	box-shadow:inset 0 1rpx 0 rgba(255,255,255,.9), 0 10rpx 22rpx rgba(15,45,82,.08);
}
.f-ico::before,
.f-ico::after {
	border:0;
	background:transparent;
	box-shadow:none;
	clip-path:none;
	transform:none;
}
.func:nth-child(1) .f-ico::before,
.func:nth-child(2) .f-ico::before {
	width:18rpx;
	height:18rpx;
	left:14rpx;
	top:15rpx;
	border:4rpx solid #1769ff;
	border-radius:50%;
	background:transparent;
	box-shadow:22rpx 0 0 -4rpx #9abfff, 22rpx 0 0 0 #1769ff;
}
.func:nth-child(1) .f-ico::after,
.func:nth-child(2) .f-ico::after {
	width:44rpx;
	height:20rpx;
	left:12rpx;
	top:39rpx;
	border:4rpx solid #1769ff;
	border-top:0;
	border-radius:0 0 22rpx 22rpx;
	background:transparent;
}
.func:nth-child(2) .f-ico::before {
	left:23rpx;
	box-shadow:none;
}
.func:nth-child(2) .f-ico::after {
	left:17rpx;
	width:34rpx;
}
.func:nth-child(3) .f-ico::before {
	left:17rpx;
	bottom:14rpx;
	width:34rpx;
	height:32rpx;
	border-left:4rpx solid #1769ff;
	border-bottom:4rpx solid #1769ff;
	background:transparent;
}
.func:nth-child(3) .f-ico::after {
	left:24rpx;
	bottom:18rpx;
	width:6rpx;
	height:16rpx;
	border-radius:6rpx 6rpx 0 0;
	background:#22b07d;
	box-shadow:12rpx -8rpx 0 #f4a340, 24rpx -16rpx 0 #1769ff;
}
.func:nth-child(4) .f-ico::before {
	width:32rpx;
	height:40rpx;
	left:18rpx;
	top:13rpx;
	border:4rpx solid #1769ff;
	border-radius:8rpx;
	background:transparent;
	clip-path:none;
}
.func:nth-child(4) .f-ico::after {
	width:14rpx;
	height:18rpx;
	right:16rpx;
	top:13rpx;
	background:#ffcf5a;
	clip-path:polygon(0 0, 100% 0, 100% 100%, 50% 72%, 0 100%);
	box-shadow:none;
}
.func:nth-child(5) .f-ico::before {
	width:38rpx;
	height:28rpx;
	left:15rpx;
	top:17rpx;
	border:4rpx solid #1769ff;
	border-radius:12rpx;
	background:transparent;
}
.func:nth-child(5) .f-ico::after {
	width:13rpx;
	height:13rpx;
	left:25rpx;
	top:42rpx;
	border-left:4rpx solid #1769ff;
	border-bottom:4rpx solid #1769ff;
	transform:skew(-18deg);
	background:transparent;
}
.func:nth-child(6) .f-ico::before,
.func:nth-child(7) .f-ico::before {
	width:30rpx;
	height:40rpx;
	left:19rpx;
	top:13rpx;
	border:4rpx solid #1769ff;
	border-radius:8rpx;
	background:transparent;
	box-shadow:none;
}
.func:nth-child(6) .f-ico::after,
.func:nth-child(7) .f-ico::after {
	width:18rpx;
	height:4rpx;
	left:25rpx;
	top:26rpx;
	border:0;
	background:#94a3b8;
	box-shadow:0 10rpx 0 #94a3b8, 0 20rpx 0 #94a3b8;
}
.func:nth-child(6) .f-ico::before {
	border-color:#64748b;
}
.func:nth-child(7) .f-ico::before {
	border-color:#7c3aed;
}
.func:nth-child(8) .f-ico::before {
	width:40rpx;
	height:28rpx;
	left:14rpx;
	top:26rpx;
	border:4rpx solid #1769ff;
	border-radius:6rpx;
	background:transparent;
	box-shadow:none;
}
.func:nth-child(8) .f-ico::after {
	width:22rpx;
	height:18rpx;
	left:23rpx;
	top:13rpx;
	border:4rpx solid #1769ff;
	border-bottom:0;
	border-radius:10rpx 10rpx 0 0;
	background:transparent;
	box-shadow:0 22rpx 0 -8rpx #22b07d;
}
.func .f-ico.icon-referrer::before {
	width:18rpx;
	height:18rpx;
	left:14rpx;
	top:15rpx;
	border:4rpx solid #1769ff;
	border-radius:50%;
	background:transparent;
	box-shadow:22rpx 0 0 -4rpx #9abfff, 22rpx 0 0 0 #1769ff;
}
.func .f-ico.icon-referrer::after {
	width:44rpx;
	height:20rpx;
	left:12rpx;
	top:39rpx;
	border:4rpx solid #1769ff;
	border-top:0;
	border-radius:0 0 22rpx 22rpx;
	background:transparent;
}
.func .f-ico.icon-students::before {
	width:18rpx;
	height:18rpx;
	left:23rpx;
	top:15rpx;
	border:4rpx solid #1769ff;
	border-radius:50%;
	background:transparent;
}
.func .f-ico.icon-students::after {
	width:34rpx;
	height:20rpx;
	left:17rpx;
	top:39rpx;
	border:4rpx solid #1769ff;
	border-top:0;
	border-radius:0 0 22rpx 22rpx;
	background:transparent;
}
.func .f-ico.icon-stats::before {
	left:17rpx;
	bottom:14rpx;
	width:34rpx;
	height:32rpx;
	border-left:4rpx solid #1769ff;
	border-bottom:4rpx solid #1769ff;
	background:transparent;
}
.func .f-ico.icon-stats::after {
	left:24rpx;
	bottom:18rpx;
	width:6rpx;
	height:16rpx;
	border-radius:6rpx 6rpx 0 0;
	background:#22b07d;
	box-shadow:12rpx -8rpx 0 #f4a340, 24rpx -16rpx 0 #1769ff;
}
.func .f-ico.icon-favorites::before {
	width:32rpx;
	height:40rpx;
	left:18rpx;
	top:13rpx;
	border:4rpx solid #1769ff;
	border-radius:8rpx;
	background:transparent;
}
.func .f-ico.icon-favorites::after {
	width:14rpx;
	height:18rpx;
	right:16rpx;
	top:13rpx;
	background:#ffcf5a;
	clip-path:polygon(0 0, 100% 0, 100% 100%, 50% 72%, 0 100%);
}
.func .f-ico.icon-feedback::before {
	width:38rpx;
	height:28rpx;
	left:15rpx;
	top:17rpx;
	border:4rpx solid #1769ff;
	border-radius:12rpx;
	background:transparent;
}
.func .f-ico.icon-feedback::after {
	width:13rpx;
	height:13rpx;
	left:25rpx;
	top:42rpx;
	border-left:4rpx solid #1769ff;
	border-bottom:4rpx solid #1769ff;
	transform:skew(-18deg);
	background:transparent;
}
.func .f-ico.icon-privacy::before,
.func .f-ico.icon-agreement::before {
	width:30rpx;
	height:40rpx;
	left:19rpx;
	top:13rpx;
	border:4rpx solid #64748b;
	border-radius:8rpx;
	background:transparent;
}
.func .f-ico.icon-agreement::before {
	border-color:#7c3aed;
}
.func .f-ico.icon-privacy::after,
.func .f-ico.icon-agreement::after {
	width:18rpx;
	height:4rpx;
	left:25rpx;
	top:26rpx;
	background:#94a3b8;
	box-shadow:0 10rpx 0 #94a3b8, 0 20rpx 0 #94a3b8;
}
.func .f-ico.icon-campus::before {
	width:40rpx;
	height:28rpx;
	left:14rpx;
	top:26rpx;
	border:4rpx solid #1769ff;
	border-radius:6rpx;
	background:transparent;
}
.func .f-ico.icon-campus::after {
	width:22rpx;
	height:18rpx;
	left:23rpx;
	top:13rpx;
	border:4rpx solid #1769ff;
	border-bottom:0;
	border-radius:10rpx 10rpx 0 0;
	background:transparent;
	box-shadow:0 22rpx 0 -8rpx #22b07d;
}

/* Invite card typography polish */
.invite {
	align-items:center;
	min-height:142rpx;
	padding:26rpx 28rpx;
	gap:22rpx;
}
.invite-l {
	max-width:calc(100% - 170rpx);
}
.invite-t {
	font-size:32rpx;
	line-height:1.15;
	letter-spacing:0;
}
.invite-s {
	max-width:30ch;
	margin-top:8rpx;
	font-size:23rpx;
	font-weight:700;
	line-height:1.42;
	letter-spacing:0;
	text-wrap:balance;
}
.invite-btn {
	min-width:132rpx;
	height:58rpx;
	line-height:58rpx;
	padding:0 22rpx;
	text-align:center;
	font-size:24rpx;
}
@media screen and (max-width: 430px) {
	.invite {
		flex-direction:row;
		align-items:center;
		min-height:132rpx;
		padding:22rpx 24rpx;
	}
	.invite-l {
		max-width:calc(100% - 144rpx);
	}
	.invite-t {
		font-size:30rpx;
	}
	.invite-s {
		max-width:24ch;
		font-size:22rpx;
		line-height:1.36;
	}
	.invite-btn {
		align-self:center;
		min-width:118rpx;
		height:54rpx;
		line-height:54rpx;
		padding:0 18rpx;
		font-size:23rpx;
	}
}

.f-ico.has-image {
	background:#fff !important;
	border-color:#e5edf7 !important;
	color:inherit !important;
	box-shadow:0 6rpx 16rpx rgba(15,23,42,.08) !important;
}
.f-ico.has-image::before,
.f-ico.has-image::after {
	content:none !important;
	display:none !important;
}
.f-icon-image {
	position:relative;
	z-index:2;
	width:54rpx;
	height:54rpx;
	display:block;
}
</style>

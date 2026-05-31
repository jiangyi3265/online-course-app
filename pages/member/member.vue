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
						<image v-if="userInfo.avatar" class="avatar-img" :src="userInfo.avatar" mode="aspectFill" />
						<text v-else>👤</text>
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
					<view class="section-sub">推荐绑定、学生学情和个人资料集中在这里处理。</view>
					<view class="funcs">
						<view class="func" :class="{featured: f.featured}" v-for="(f,i) in funcs" :key="i" @click="openFunc(f)">
							<view class="f-ico">{{f.ico}}</view>
							<view class="f-main">
								<text class="f-text">{{f.text}}</text>
								<text class="f-desc">{{f.desc}}</text>
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
import { clearSession, isLoggedIn } from '@/common/api.js'
export default {
	components: { TabBar },
	data() {
		return {
			logined: false,
			showModal: false,
			showInvite: false,
			userInfo: {},
			funcs: [
				{ ico:'👥', text:'我的推荐人', desc:'绑定推荐关系', route:'/pages/referrer/referrer', featured:true },
				{ ico:'🎓', text:'我的学生', desc:'只读查看学情', route:'/pages/students/students', featured:true },
				{ ico:'📊', text:'学情统计', desc:'学习数据汇总', route:'/pages/study-analysis/study-analysis' },
				{ ico:'🔖', text:'我的收藏', desc:'课程与题目收藏', route:'/pages/favorites/favorites' },
				{ ico:'❓', text:'意见反馈', desc:'提交问题建议', route:'/pages/feedback/feedback' },
				{ ico:'📄', text:'隐私政策', desc:'查看隐私说明' },
				{ ico:'📑', text:'用户协议', desc:'查看服务条款' }
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
		}
	},
	async onShow() {
		this.logined = isLoggedIn();
		this.userInfo = uni.getStorageSync('userInfo') || {};
		if (!this.logined) this.showModal = true;
	},
	methods: {
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
.avatar { width:112rpx; height:112rpx; border-radius:50%; background:#e7f1fb; display:flex; align-items:center; justify-content:center; font-size:56rpx; color:#5f8fbd; overflow:hidden; cursor:pointer; flex-shrink:0; }
.avatar-img { width:100%; height:100%; display:block; }
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
</style>

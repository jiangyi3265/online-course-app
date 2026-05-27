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
			<view class="user">
				<view class="avatar" @click="goProfile">
					<image v-if="userInfo.avatar" class="avatar-img" :src="userInfo.avatar" mode="aspectFill" />
					<text v-else>👤</text>
				</view>
				<view class="u-info">
					<view class="u-name">{{userInfo.name || '用户'}}</view>
					<view class="u-id">ID:{{userInfo.id || '--'}}</view>
				</view>
				<view class="logout-btn" @click="onLogout">退出登录</view>
			</view>
			<view class="invite" @click="showInvite = true">
				<view class="invite-l">
					<view class="invite-t">邀请好友</view>
					<view class="invite-s">百万课程等你解锁</view>
				</view>
				<view class="invite-btn">立即邀请</view>
			</view>

			<view class="section-title">常用功能</view>
			<view class="funcs">
				<view class="func" v-for="(f,i) in funcs" :key="i" @click="openFunc(f)">
					<view class="f-ico">{{f.ico}}</view>
					<text class="f-text">{{f.text}}</text>
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
				{ ico:'👥', text:'我的推荐人' },
				{ ico:'🔖', text:'我的收藏' },
				{ ico:'❓', text:'意见反馈' },
				{ ico:'🎓', text:'我的学生' },
				{ ico:'📄', text:'隐私政策' },
				{ ico:'📑', text:'用户协议' },
				{ ico:'📊', text:'学情统计' }
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
			if (f.text === '学情统计') uni.navigateTo({ url:'/pages/study-analysis/study-analysis' });
			else if (f.text === '我的收藏') uni.navigateTo({ url:'/pages/favorites/favorites' });
			else if (f.text === '我的学生') uni.navigateTo({ url:'/pages/students/students' });
			else if (f.text === '我的推荐人') uni.navigateTo({ url:'/pages/referrer/referrer' });
			else if (f.text === '意见反馈') uni.navigateTo({ url:'/pages/feedback/feedback' });
			else uni.showToast({ title:f.text, icon:'none' });
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
page { background:#fff; }
.page { min-height:100vh; padding-bottom:140rpx; background:#fff; }

.mask { position:fixed; inset:0; background:rgba(0,0,0,0.5); display:flex; align-items:center; justify-content:center; z-index:200; }
.modal { width:560rpx; background:#fff; border-radius:14rpx; overflow:hidden; }
.m-title { text-align:center; padding:36rpx 0 16rpx; font-size:34rpx; color:#000; }
.m-body { text-align:center; padding:0 30rpx 36rpx; color:#888; font-size:28rpx; }
.m-actions { display:flex; border-top:1rpx solid #ececec; }
.m-btn { flex:1; height:96rpx; line-height:96rpx; text-align:center; font-size:32rpx; cursor:pointer; }
.m-btn.cancel { color:#000; }
.m-btn.ok { color:#007aff; }
.m-divider { width:1rpx; background:#ececec; }

.user { display:flex; align-items:center; padding: 60rpx 40rpx 30rpx; }
.avatar { width:120rpx; height:120rpx; border-radius:50%; background:#e3edf7; display:flex; align-items:center; justify-content:center; font-size:60rpx; color:#7aa6d6; overflow:hidden; cursor:pointer; }
.avatar-img { width:100%; height:100%; display:block; }
.u-info { margin-left:24rpx; }
.u-name { font-size:36rpx; font-weight:800; color:#222; }
.u-id { font-size:24rpx; color:#888; margin-top:8rpx; }
.invite { margin: 10rpx 30rpx 0; height:160rpx; background: linear-gradient(135deg,#7ec5f4 0%, #b8e0fa 100%); border-radius:20rpx; display:flex; align-items:center; justify-content:space-between; padding: 0 36rpx; color:#fff; position:relative; overflow:hidden; }
.invite::before { content:''; position:absolute; right:-40rpx; top:-30rpx; width:200rpx; height:200rpx; border-radius:50%; background:rgba(255,255,255,0.12); }
.invite-t { font-size:36rpx; font-weight:800; }
.invite-s { font-size:24rpx; margin-top:10rpx; opacity:.95; }
.invite-btn { background:#fff; color:#3a6f9c; padding:14rpx 26rpx; border-radius:40rpx; font-size:26rpx; font-weight:600; cursor:pointer; }
.invite-mask { position:fixed; inset:0; background:rgba(15,23,42,.46); display:flex; align-items:center; justify-content:center; z-index:260; padding:40rpx; box-sizing:border-box; }
.invite-modal { width:600rpx; max-width:100%; background:#fff; border-radius:16rpx; padding:30rpx; box-sizing:border-box; text-align:center; }
.invite-modal-title { color:#1f2933; font-size:34rpx; font-weight:900; }
.invite-code { width:260rpx; height:260rpx; margin:24rpx auto 18rpx; border-radius:12rpx; background:#f7fafc; border:1rpx solid #e5eaf1; display:flex; align-items:center; justify-content:center; }
.invite-qr { width:230rpx; height:230rpx; }
.invite-line { color:#475467; font-size:27rpx; line-height:1.7; }
.invite-go { margin-top:24rpx; height:76rpx; line-height:76rpx; border-radius:10rpx; background:#1677ff; color:#fff; font-size:28rpx; font-weight:900; }
.invite-close { margin-top:12rpx; height:68rpx; line-height:68rpx; color:#667085; font-size:26rpx; }
.section-title { margin: 50rpx 30rpx 20rpx; font-size:32rpx; font-weight:800; color:#222; }
.funcs { display:flex; flex-wrap:wrap; padding: 10rpx 20rpx; }
.func { width:25%; display:flex; flex-direction:column; align-items:center; padding: 24rpx 0; cursor:pointer; }
.f-ico { width:80rpx; height:80rpx; display:flex; align-items:center; justify-content:center; font-size:42rpx; color:#007aff; }
.f-text { font-size:24rpx; color:#333; margin-top:6rpx; }
.logout-btn { margin-left:auto; padding:10rpx 28rpx; background:#ff4d4f; color:#fff; border-radius:30rpx; font-size:24rpx; cursor:pointer; }
</style>

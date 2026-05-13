<template>
	<view class="page">
		<view class="nav">
			<view class="back" @click="goBack">‹</view>
			<view class="nav-title">我的课程文档</view>
		</view>

		<view class="search">
			<view class="search-box">
				<text class="s-ico">🔍</text>
				<input class="s-input" v-model="kw" placeholder="请输入文档名称搜索" placeholder-class="s-ph" />
			</view>
			<view class="s-divider"></view>
			<view class="s-btn" @click="search">搜索</view>
		</view>

		<view class="empty" v-if="list.length===0">
			<image class="empty-img" src="/static/empty-doc.png" mode="widthFix" />
			<view class="empty-text">暂无文档</view>
		</view>

		<view class="doc-list" v-else>
			<view class="doc-card" v-for="doc in list" :key="doc.id">
				<view class="doc-icon">{{doc.fileType || 'DOC'}}</view>
				<view class="doc-info">
					<view class="doc-title">{{doc.title}}</view>
					<view class="doc-meta">{{doc.size || '未知大小'}}</view>
				</view>
				<view class="doc-open" @click="openDoc(doc)">打开</view>
			</view>
		</view>

		<view class="mask" v-if="showLogin">
			<view class="modal">
				<view class="m-title">提示</view>
				<view class="m-body">您还未登录，是否登录？</view>
				<view class="m-actions">
					<view class="m-btn cancel" @click="showLogin=false">取消</view>
					<view class="m-divider"></view>
					<view class="m-btn ok" @click="goLogin">登录</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
import { getMyDocs, isLoggedIn } from '@/common/api.js'
export default {
	data() { return { kw:'', list:[], showLogin:false } },
	onShow() {
		if (!isLoggedIn()) {
			this.showLogin = true;
			return;
		}
		this.loadDocs();
	},
	methods: {
		async loadDocs() {
			try {
				this.list = await getMyDocs(this.kw);
			} catch (err) {
				console.warn('文档接口不可用', err);
				this.list = [];
			}
		},
		goBack() { uni.navigateBack({ fail:()=>{} }); },
		search() { this.loadDocs(); },
		openDoc(doc) { uni.showToast({ title: doc.title, icon:'none' }); },
		goLogin() { this.showLogin=false; uni.navigateTo({ url:'/pages/login/login' }); }
	}
}
</script>

<style lang="scss">
page { background:#fff; }
.page { min-height:100vh; background:#fff; }

.nav {
	position:relative;
	height:90rpx;
	display:flex; align-items:center; justify-content:center;
	border-bottom:1rpx solid #eef0f3;
}
.back { position:absolute; left:24rpx; font-size:46rpx; font-weight:300; color:#222; cursor:pointer; }
.nav-title { font-size:30rpx; color:#222; font-weight:600; }

.search {
	display:flex; align-items:center;
	margin: 24rpx;
	background:#f3f5f7;
	border-radius:50rpx;
	padding: 0 24rpx;
	height:80rpx;
}
.search-box { flex:1; display:flex; align-items:center; }
.s-ico { font-size:30rpx; color:#9aa1a9; margin-right:14rpx; }
.s-input { flex:1; height:80rpx; font-size:28rpx; color:#222; background:transparent; }
.s-ph { color:#aab1b9; }
.s-divider { width:2rpx; height:36rpx; background:#dfe2e6; margin: 0 20rpx; }
.s-btn { color:#3aa3f5; font-size:28rpx; cursor:pointer; }

.empty {
	display:flex; flex-direction:column; align-items:center;
	padding-top: 200rpx;
}
.empty-img { width:520rpx; }
.empty-ill { position:relative; width:380rpx; height:280rpx; }
.paper {
	position:absolute; left:50%; top:30rpx; transform:translateX(-50%);
	width:130rpx; height:170rpx;
	background:#dfe9ff;
	border:3rpx solid #3a6fd8;
	border-radius:8rpx;
}
.line { position:absolute; left:18rpx; right:18rpx; height:6rpx; background:#3a6fd8; border-radius:3rpx; }
.l1 { top:30rpx; }
.l2 { top:54rpx; right:50rpx; }
.l3 { top:78rpx; }
.x {
	position:absolute; left:50%; bottom:24rpx; transform:translateX(-50%);
	color:#3a6fd8; font-size:48rpx; font-weight:300;
}
.stand {
	position:absolute; left:50%; bottom:40rpx; transform:translateX(-50%);
	width:280rpx; height:30rpx;
	background:linear-gradient(180deg,#7a96d8 0%,#5a78c0 100%);
	border-radius:50%;
}
.empty-ill::after {
	content:''; position:absolute; left:50%; bottom:20rpx; transform:translateX(-50%);
	width:340rpx; height:50rpx;
	background:#eef3fb;
	border-radius:50%;
	z-index:-1;
}
.dot { position:absolute; border-radius:50%; }
.dot1 { right:30rpx; top:50rpx; width:14rpx; height:14rpx; background:#9bb6ec; }
.dot2 { left:60rpx; top:140rpx; width:24rpx; height:14rpx; background:#f6c44a; border-radius:50%; }

.empty-text {
	margin-top: 30rpx;
	font-size:30rpx; color:#222; font-weight:700;
}

.doc-list { padding: 0 24rpx 40rpx; }
.doc-card {
	display:flex; align-items:center;
	background:#fff;
	border:1rpx solid #eef0f3;
	border-radius:16rpx;
	padding:22rpx;
	margin-bottom:18rpx;
	box-shadow:0 4rpx 12rpx rgba(0,0,0,.04);
}
.doc-icon {
	width:90rpx; height:90rpx;
	border-radius:14rpx;
	background:#eaf4ff;
	color:#1684e8;
	display:flex; align-items:center; justify-content:center;
	font-size:22rpx; font-weight:800;
}
.doc-info { flex:1; min-width:0; margin-left:20rpx; }
.doc-title { font-size:28rpx; color:#222; font-weight:700; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.doc-meta { margin-top:8rpx; font-size:24rpx; color:#8a94a3; }
.doc-open { color:#3aa3f5; font-size:26rpx; padding:10rpx 18rpx; cursor:pointer; }

.mask { position:fixed; inset:0; background:rgba(0,0,0,0.5); display:flex; align-items:center; justify-content:center; z-index:200; }
.modal { width:560rpx; background:#fff; border-radius:14rpx; overflow:hidden; }
.m-title { text-align:center; padding:36rpx 0 16rpx; font-size:34rpx; color:#000; }
.m-body { text-align:center; padding:0 30rpx 36rpx; color:#888; font-size:28rpx; }
.m-actions { display:flex; border-top:1rpx solid #ececec; }
.m-btn { flex:1; height:96rpx; line-height:96rpx; text-align:center; font-size:32rpx; cursor:pointer; }
.m-btn.cancel { color:#000; }
.m-btn.ok { color:#007aff; }
.m-divider { width:1rpx; background:#ececec; }
</style>

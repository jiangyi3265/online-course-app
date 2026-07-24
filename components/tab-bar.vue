<template>
	<view class="tabbar">
		<view class="tab" :class="{active: active==='home'}" @click="go('home')">
			<image class="ico" :src="active==='home' ? '/static/tabbar/home-active.png' : '/static/tabbar/home.png'" mode="aspectFit" />
			<text class="lab">首页</text>
		</view>
		<view class="tab" :class="{active: active==='course'}" @click="go('course')">
			<image class="ico" :src="active==='course' ? '/static/tabbar/book-active.png' : '/static/tabbar/book.png'" mode="aspectFit" />
			<text class="lab">我的课程</text>
		</view>
		<view class="tab" :class="{active: active==='vocabulary'}" @click="go('vocabulary')">
			<view class="word-ico">Aa</view>
			<text class="lab">外语词汇</text>
		</view>
		<view class="tab" :class="{active: active==='member'}" @click="go('member')">
			<image class="ico user" :src="'/static/tabbar/user.png'" mode="aspectFit" />
			<text class="lab">会员中心</text>
		</view>
	</view>
</template>

<script>
export default {
	props: { active: { type: String, default: 'home' } },
	methods: {
		go(k) {
			const map = {
				home: '/pages/index/index',
				course: '/pages/mycourse/mycourse',
				vocabulary: '/pages/vocabulary/vocabulary',
				member: '/pages/member/member'
			};
			const url = map[k];
			if (!url) return;
			const current = this.currentPath();
			if (k === this.active && current === url) return;
			this.jumpTo(url);
		},
		currentPath() {
			try {
				const pages = getCurrentPages && getCurrentPages();
				const page = pages && pages[pages.length - 1];
				if (page && page.route) return `/${page.route}`;
			} catch (e) {}
			if (typeof window !== 'undefined') {
				const hashPath = (window.location.hash || '').replace(/^#/, '').split('?')[0];
				if (hashPath) return hashPath;
			}
			return '';
		},
		jumpTo(url) {
			const fallback = () => {
				if (typeof window !== 'undefined') window.location.hash = `#${url}`;
			};
			uni.reLaunch({
				url,
				fail: () => uni.redirectTo({ url, fail: fallback })
			});
		}
	}
}
</script>

<style lang="scss">
.tabbar {
	position: fixed; left:0; right:0; bottom:0;
	height:110rpx;
	background:#ffffff;
	display:flex;
	border-top:1rpx solid #ececec;
	z-index: 99;
}
.tab {
	flex:1;
	display:flex; flex-direction:column; align-items:center; justify-content:center;
	color:#7a7e83;
	font-size:20rpx;
	cursor:pointer;
}
.tab .ico { width:48rpx; height:48rpx; margin-bottom:4rpx; }
.word-ico {
	width:48rpx;
	height:48rpx;
	margin-bottom:4rpx;
	border:3rpx solid currentColor;
	border-radius:10rpx;
	display:flex;
	align-items:center;
	justify-content:center;
	box-sizing:border-box;
	font-size:19rpx;
	font-weight:900;
	line-height:1;
}
.tab .lab { font-size:20rpx; }
.tab.active { color:#1890e1; }
.tab.active .ico.user { filter: brightness(0) saturate(100%) invert(36%) sepia(95%) saturate(2200%) hue-rotate(199deg) brightness(98%) contrast(101%); }
</style>

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
			if (k === this.active) return;
			const map = {
				home: '/pages/index/index',
				course: '/pages/mycourse/mycourse',
				member: '/pages/member/member'
			};
			uni.redirectTo({ url: map[k] });
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
.tab .lab { font-size:20rpx; }
.tab.active { color:#1890e1; }
.tab.active .ico.user { filter: brightness(0) saturate(100%) invert(36%) sepia(95%) saturate(2200%) hue-rotate(199deg) brightness(98%) contrast(101%); }
</style>

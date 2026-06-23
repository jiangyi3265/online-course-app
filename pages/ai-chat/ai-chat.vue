<template>
	<view class="page">
		<view class="nav"><view class="back" @click="goBack">‹</view><view class="nav-title">AI问答</view></view>
		<scroll-view scroll-y class="messages">
			<view class="msg ai">你好，我可以帮你拆解当前课程里的题目和知识点。</view>
			<view v-for="item in list" :key="item.id">
				<view class="msg user">{{item.message}}</view>
				<view class="msg ai">{{item.reply}}</view>
			</view>
		</scroll-view>
		<view class="input-bar">
			<input class="input" v-model="message" placeholder="输入你的问题" />
			<view class="send" @click="send">发送</view>
		</view>
	</view>
</template>

<script>
import { askAi } from '@/common/api.js'
import { safeNavigateBack } from '@/common/navigation.js'
export default {
	data() { return { context:'当前课程', message:'', list:[] } },
	onLoad(opts = {}) { this.context = decodeURIComponent(opts.context || '当前课程'); },
	methods: {
		async send() {
			if (!this.message.trim()) return;
			const text = this.message.trim();
			this.message = '';
			try { this.list.push(await askAi(text, this.context)); }
			catch (err) { uni.showToast({ title: err.message || '发送失败', icon:'none' }); }
		},
		goBack() { safeNavigateBack('/pages/mycourse/mycourse'); }
	}
}
</script>

<style lang="scss">
page { background:#f5f7fa; }
.page { min-height:100vh; background:#f5f7fa; padding-bottom:130rpx; }
.nav { position:relative; height:90rpx; background:#fff; display:flex; align-items:center; justify-content:center; border-bottom:1rpx solid #eef0f3; }
.back { position:absolute; left:24rpx; font-size:46rpx; color:#222; cursor:pointer; }
.nav-title { font-size:30rpx; font-weight:700; }
.messages { height:calc(100vh - 220rpx); padding:24rpx; box-sizing:border-box; }
.msg { max-width:78%; padding:18rpx 22rpx; border-radius:16rpx; margin-bottom:18rpx; font-size:28rpx; line-height:1.5; }
.msg.ai { background:#fff; color:#222; border:1rpx solid #edf0f4; }
.msg.user { margin-left:auto; background:#1677ff; color:#fff; }
.input-bar { position:fixed; left:0; right:0; bottom:0; display:flex; gap:16rpx; padding:20rpx 24rpx 34rpx; background:#fff; box-shadow:0 -4rpx 16rpx rgba(0,0,0,.05); }
.input { flex:1; height:78rpx; border-radius:39rpx; padding:0 24rpx; background:#f1f4f8; font-size:28rpx; }
.send { width:128rpx; height:78rpx; line-height:78rpx; text-align:center; border-radius:39rpx; background:#1677ff; color:#fff; font-size:28rpx; font-weight:700; }
</style>

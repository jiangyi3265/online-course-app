<template>
	<view class="data-state" :class="`is-${type}`" role="status">
		<template v-if="type === 'loading'">
			<view class="skeleton-mark"></view>
			<view class="skeleton-line skeleton-title"></view>
			<view class="skeleton-line skeleton-sub"></view>
		</template>
		<template v-else>
			<view class="state-mark">{{ mark }}</view>
			<view class="state-title">{{ title }}</view>
			<view class="state-description" v-if="description">{{ description }}</view>
			<view class="state-action" v-if="type === 'error' && retryable" @click="$emit('retry')">重新加载</view>
		</template>
	</view>
</template>

<script>
export default {
	name: 'AppDataState',
	emits: ['retry'],
	props: {
		type: { type: String, default: 'empty' },
		title: { type: String, default: '' },
		description: { type: String, default: '' },
		retryable: { type: Boolean, default: true }
	},
	computed: {
		mark() {
			return this.type === 'error' ? '!' : '课';
		}
	}
}
</script>

<style scoped>
.data-state {
	min-height:360rpx;
	padding:72rpx 36rpx 96rpx;
	box-sizing:border-box;
	display:flex;
	flex-direction:column;
	align-items:center;
	justify-content:center;
	text-align:center;
}
.state-mark {
	width:76rpx;
	height:76rpx;
	border-radius:22rpx;
	display:flex;
	align-items:center;
	justify-content:center;
	background:#eaf4ff;
	color:#1677ff;
	font-size:32rpx;
	font-weight:900;
}
.is-error .state-mark { background:#fff1f0; color:#cf3d36; }
.state-title { margin-top:24rpx; color:#1f2937; font-size:30rpx; font-weight:800; line-height:1.45; }
.state-description { max-width:560rpx; margin-top:12rpx; color:#7b8794; font-size:24rpx; line-height:1.6; }
.state-action {
	margin-top:30rpx;
	min-width:190rpx;
	padding:18rpx 32rpx;
	border-radius:12rpx;
	background:#1677ff;
	color:#fafdff;
	font-size:26rpx;
	font-weight:700;
	cursor:pointer;
}
.state-action:active { transform:scale(.98); background:#0f68df; }
.skeleton-mark,
.skeleton-line {
	background:linear-gradient(110deg,#e9eef5 8%,#f7f9fc 18%,#e9eef5 33%);
	background-size:200% 100%;
	animation:data-state-loading 1.2s linear infinite;
}
.skeleton-mark { width:76rpx; height:76rpx; border-radius:22rpx; }
.skeleton-line { height:24rpx; border-radius:8rpx; margin-top:24rpx; }
.skeleton-title { width:280rpx; }
.skeleton-sub { width:420rpx; max-width:80%; margin-top:16rpx; }
@keyframes data-state-loading { to { background-position-x:-200%; } }
@media screen and (min-width:600px) {
	.data-state { min-height:320px; padding:60px 28px 82px; }
	.state-mark,.skeleton-mark { width:54px; height:54px; border-radius:14px; font-size:22px; }
	.state-title { margin-top:18px; font-size:18px; }
	.state-description { margin-top:8px; font-size:14px; }
	.state-action { margin-top:22px; min-width:132px; padding:12px 22px; border-radius:8px; font-size:15px; }
}
</style>

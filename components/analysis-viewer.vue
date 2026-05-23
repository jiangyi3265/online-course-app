<template>
	<view class="analysis-viewer">
		<view class="analysis-tabs">
			<view class="analysis-tab" :class="{active: mode === 'text'}" @click="mode = 'text'">文字解析</view>
			<view class="analysis-tab" :class="{active: mode === 'video'}" @click="openVideo">视频讲解</view>
		</view>
		<view class="analysis-body" v-if="mode === 'text'">
			<text>{{text || '暂无解析'}}</text>
		</view>
		<view class="analysis-body" v-else>
			<video v-if="resolvedVideoUrl" class="analysis-video" :src="resolvedVideoUrl" controls></video>
			<view v-else class="analysis-empty">暂无视频解析</view>
		</view>
	</view>
</template>

<script>
export default {
	name: 'AnalysisViewer',
	props: {
		item: {
			type: Object,
			default: () => ({})
		},
		text: {
			type: String,
			default: ''
		},
		videoUrl: {
			type: String,
			default: ''
		}
	},
	data() {
		return {
			mode: 'text'
		}
	},
	computed: {
		resolvedVideoUrl() {
			const item = this.item || {};
			return this.videoUrl || item.videoAnalysisUrl || item.analysisVideoUrl || item.explainVideoUrl || item.videoUrl || '';
		}
	},
	methods: {
		openVideo() {
			this.mode = 'video';
			if (!this.resolvedVideoUrl) {
				uni.showToast({ title: '暂无视频解析', icon: 'none' });
			}
		}
	}
}
</script>

<style lang="scss">
.analysis-viewer { margin-top:12rpx; }
.analysis-tabs {
	display:inline-flex;
	padding:4rpx;
	border-radius:10rpx;
	background:#eef2f7;
}
.analysis-tab {
	min-width:128rpx;
	height:48rpx;
	line-height:48rpx;
	text-align:center;
	border-radius:8rpx;
	color:#596272;
	font-size:23rpx;
	font-weight:800;
}
.analysis-tab.active { background:#fff; color:#1677ff; box-shadow:0 2rpx 8rpx rgba(15,23,42,.08); }
.analysis-body {
	margin-top:12rpx;
	color:#596272;
	font-size:25rpx;
	line-height:1.55;
}
.analysis-video {
	width:100%;
	height:320rpx;
	border-radius:12rpx;
	background:#111827;
	overflow:hidden;
}
.analysis-empty {
	height:120rpx;
	border-radius:12rpx;
	background:#f1f5f9;
	display:flex;
	align-items:center;
	justify-content:center;
	color:#8a94a3;
	font-size:25rpx;
}
</style>

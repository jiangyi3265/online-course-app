<template>
	<view class="analysis-viewer">
		<view class="analysis-tabs">
			<view class="analysis-tab" :class="{active: mode === 'content'}" @click="openContent">解析</view>
			<view class="analysis-tab" :class="{active: mode === 'video'}" @click="openVideo">视频讲解</view>
		</view>
		<view class="analysis-body" v-if="mode === 'content'">
			<math-rich-text v-if="text" class="analysis-text" :text="text" />
			<view v-if="resolvedImageUrls.length" class="analysis-image-list">
				<image
					v-for="(url, index) in resolvedImageUrls"
					:key="`${url}-${index}`"
					class="analysis-image"
					:src="url"
					mode="widthFix"
					@click="previewImage(url)"
				></image>
			</view>
			<view v-if="resolvedFileUrls.length" class="analysis-doc-list">
				<view v-for="(url, index) in resolvedFileUrls" :key="`${url}-${index}`" class="analysis-doc" @click="openFile(url)">
					<text class="analysis-doc-type">{{fileExt(url)}}</text>
					<text class="analysis-doc-name">解析文档 {{index + 1}}</text>
				</view>
			</view>
			<view v-if="!hasContent" class="analysis-empty">暂无解析</view>
		</view>
		<view class="analysis-body" v-else>
			<video
				v-if="resolvedVideoUrl"
				class="analysis-video"
				:src="resolvedVideoUrl"
				controls
				controlslist="nodownload noplaybackrate noremoteplayback"
				disable-picture-in-picture
				disable-remote-playback
				@contextmenu.prevent
			></video>
			<view v-else class="analysis-empty">暂无视频解析</view>
		</view>
	</view>
</template>

<script>
import { resolveMediaUrl, isUsableMediaUrl } from '@/common/api.js'
import MathRichText from '@/components/math-rich-text.vue'

export default {
	name: 'AnalysisViewer',
	components: { MathRichText },
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
		},
		imageUrl: {
			type: String,
			default: ''
		}
	},
	data() {
		return {
			mode: 'content'
		}
	},
	computed: {
		resolvedVideoUrl() {
			const item = this.item || {};
			return this.mediaUrl(this.videoUrl || item.videoAnalysisUrl || item.analysisVideoUrl || item.explainVideoUrl || item.videoUrl || '');
		},
		resolvedImageUrls() {
			const item = this.item || {};
			return this.mediaList(this.imageUrl || item.analysisImageUrl || item.imageAnalysisUrl || item.explainImageUrl || item.imageUrl)
				.map(url => this.mediaUrl(url))
				.filter(Boolean);
		},
		resolvedFileUrls() {
			const item = this.item || {};
			return this.mediaList(item.analysisFileUrl || item.explainFileUrl || item.analysisDocUrl)
				.map(url => this.mediaUrl(url))
				.filter(Boolean);
		},
		hasContent() {
			return !!(this.text || this.resolvedImageUrls.length || this.resolvedFileUrls.length);
		}
	},
	methods: {
		mediaList(value) {
			if (Array.isArray(value)) return value.map(item => String(item || '').trim()).filter(Boolean);
			return String(value || '').split(/[,\n]/).map(item => item.trim()).filter(Boolean);
		},
		mediaUrl(url = '') {
			const resolved = resolveMediaUrl(url);
			return isUsableMediaUrl(resolved) ? resolved : '';
		},
		openContent() {
			this.mode = 'content';
			if (!this.hasContent) {
				uni.showToast({ title: '暂无解析', icon: 'none' });
			}
		},
		openVideo() {
			this.mode = 'video';
			if (!this.resolvedVideoUrl) {
				uni.showToast({ title: '暂无视频解析', icon: 'none' });
			}
		},
		previewImage(url) {
			const current = this.mediaUrl(url);
			if (!current) return;
			uni.previewImage({ urls: this.resolvedImageUrls, current });
		},
		openFile(url) {
			const fileUrl = this.mediaUrl(url);
			if (!fileUrl) return;
			if (typeof window !== 'undefined') {
				window.open(fileUrl, '_blank');
				return;
			}
			uni.showToast({ title: '请在浏览器中打开解析文档', icon: 'none' });
		},
		fileExt(url = '') {
			const clean = String(url || '').split('?')[0];
			return clean.includes('.') ? clean.slice(clean.lastIndexOf('.') + 1).toUpperCase() : 'FILE';
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
.analysis-text {
	display:block;
	margin-bottom:12rpx;
	white-space:pre-wrap;
	word-break:break-word;
}
.analysis-video {
	width:100%;
	height:320rpx;
	border-radius:12rpx;
	background:#111827;
	overflow:hidden;
}
.analysis-image {
	width:100%;
	border-radius:12rpx;
	background:#f1f5f9;
	display:block;
}
.analysis-image-list,
.analysis-doc-list {
	display:grid;
	gap:12rpx;
}
.analysis-doc {
	min-height:72rpx;
	display:flex;
	align-items:center;
	gap:14rpx;
	padding:0 18rpx;
	border:1rpx solid #dbe4ef;
	border-radius:12rpx;
	background:#f8fafc;
	color:#334155;
	box-sizing:border-box;
}
.analysis-doc-type {
	min-width:72rpx;
	height:40rpx;
	line-height:40rpx;
	text-align:center;
	border-radius:8rpx;
	background:#e8f2ff;
	color:#1677ff;
	font-size:22rpx;
	font-weight:900;
}
.analysis-doc-name {
	flex:1;
	min-width:0;
	overflow:hidden;
	text-overflow:ellipsis;
	white-space:nowrap;
	font-size:25rpx;
	font-weight:700;
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

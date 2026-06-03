<template>
	<view class="page">
		<!-- 顶部导航 -->
		<view class="nav">
			<view class="back" @click="goBack">‹</view>
			<view class="nav-title">{{title}}</view>
		</view>

		<!-- 视频区 -->
		<view class="video-wrap">
			<video
				id="lessonVideo"
				class="video-player"
				:src="videoUrl"
				:poster="poster"
				:initial-time="initialTime"
				controls
				:muted="muted"
				:show-fullscreen-btn="!isDesktopH5"
				:show-play-btn="true"
				:enable-progress-gesture="true"
				@loadedmetadata="onLoadedMeta"
				@play="onPlay"
				@pause="onPause"
				@click="toggleVideoPlayback"
				@timeupdate="onTimeUpdate"
				@ended="onEnded"
				@fullscreenchange="onNativeFullscreenChange"
				@error="onVideoError"
			></video>
			<view class="desktop-video-tools" v-if="isDesktopH5">
				<view class="fullscreen-toggle" :class="{active:isWebFullscreen}" @click.stop="toggleWebFullscreen">
					{{isWebFullscreen ? '退出全屏' : '网页全屏'}}
				</view>
			</view>
			<view class="video-error" v-if="videoError">
				<view class="video-error-title">视频暂时无法加载</view>
				<view class="video-error-sub">请检查网络，或稍后重新进入本讲。</view>
			</view>
			<view class="moving-watermark" v-if="showWatermark">{{watermarkText}}</view>
			<view class="video-quick-tools">
				<view class="speed-menu" v-if="showSpeedMenu">
					<view
						class="speed-menu-item"
						v-for="rate in playbackRates"
						:key="rate"
						:class="{active: playbackRate === rate}"
						@click.stop="setPlaybackRate(rate)"
					>{{rateLabel(rate)}}</view>
				</view>
				<view class="quick-tools-row">
					<view class="quick-tool speed-trigger" :class="{active: showSpeedMenu}" @click.stop="toggleSpeedMenu">{{rateLabel(playbackRate)}}</view>
					<view class="volume-control">
						<view class="volume-panel" v-if="showVolumePanel">
							<slider
								class="volume-slider"
								:min="0"
								:max="100"
								:step="1"
								:value="volume"
								activeColor="#3aa3f5"
								backgroundColor="rgba(255,255,255,.32)"
								block-color="#ffffff"
								:block-size="18"
								@changing="onVolumeChanging"
								@change="onVolumeChange"
							/>
							<view class="volume-mute" @click.stop="toggleMute">{{muted || volume === 0 ? '恢复' : '静音'}}</view>
						</view>
						<view class="quick-tool volume-trigger" :class="{muted: muted || volume === 0}" @click.stop="toggleVolumePanel">{{volumeIcon}}</view>
					</view>
				</view>
			</view>
			<view class="video-info">
				<view>
					<view class="video-title">{{title}}</view>
					<view class="video-sub">已学 {{percent}}% · {{curTime}} / {{totalTime}}</view>
				</view>
				<view class="save-state">{{progressSaved ? '进度已同步' : '学习中'}}</view>
			</view>
		</view>

		<!-- 本节内容 -->
		<view class="section">
			<text class="s-title">本节内容</text>
			<text class="s-page">{{page}}/{{pageTotal}}</text>
		</view>

		<view class="rating-panel">
			<view class="rating-head">
				<text class="rating-title">课程评分</text>
				<text class="rating-state">{{myRating ? `${myRating}星` : '1到5颗星'}}</text>
			</view>
			<view class="star-row">
				<view
					class="star-item"
					v-for="star in ratingOptions"
					:key="star"
					:class="{active: myRating >= star, disabled: ratingLoading || !!myRating}"
					@click="submitLessonRating(star)"
				>
					<text class="star-icon">★</text>
					<text class="star-label">{{star}}星</text>
				</view>
			</view>
			<view class="rating-desc">{{ratingHint}}</view>
		</view>

		<!-- 底部 -->
		<view class="footer">
			<view class="return-btn" @click="goBack">返回上一页</view>
		</view>
	</view>
</template>

<script>
import { getLessonRatingApi, getLessonVideo, isLoggedIn, saveLessonProgress, saveLessonRatingApi } from '@/common/api.js'
export default {
	data() {
		return {
			title: '选材与加工高分技巧',
			courseId: '',
			courseTitle: '',
			chapterTitle: '',
			videoUrl: '',
			poster: '',
			initialTime: 0,
			curTime: '00:00',
			totalTime: '00:00',
			currentSeconds: 0,
			durationSeconds: 0,
			percent: 0,
			videoError: false,
			videoPlaying: false,
			progressSaved: false,
			lastSavedAt: 0,
			videoContext: null,
			playbackRate: 1,
			playbackRates: [2, 1.5, 1, 0.75, 0.5],
			showSpeedMenu: false,
			showVolumePanel: false,
			volume: 80,
			lastVolume: 80,
			muted: false,
			isDesktopH5: false,
			isWebFullscreen: false,
			fullscreenListener: null,
			prevTitle: '',
			nextTitle: '',
			lessonCard: null,
			page: 1,
			pageTotal: 1,
			myRating: 0,
			ratingLoading: false,
			ratingOptions: [1, 2, 3, 4, 5],
			userInfo: {}
		}
	},
	async onLoad(opts) {
		if (opts && opts.title) this.title = decodeURIComponent(opts.title);
		if (opts && opts.courseId) this.courseId = decodeURIComponent(opts.courseId);
		if (opts && opts.courseTitle) this.courseTitle = decodeURIComponent(opts.courseTitle);
		if (opts && opts.chapterTitle) this.chapterTitle = decodeURIComponent(opts.chapterTitle);
		this.userInfo = uni.getStorageSync('userInfo') || {};
		await this.loadLesson();
		if (isLoggedIn()) await this.loadRatingState();
	},
	onReady() {
		this.detectDesktopH5();
		this.bindFullscreenListener();
		this.videoContext = uni.createVideoContext('lessonVideo', this);
		this.applyPlaybackRate();
		this.applyVolume();
	},
	onUnload() {
		this.unbindFullscreenListener();
		this.exitWebFullscreen(false);
		this.persistProgress(false);
	},
	onHide() {
		this.exitWebFullscreen(false);
	},
	computed: {
		watermarkText() {
			const user = this.userInfo || {};
			const id = user.id || user.userId || user.user_id || user.uid || user.accountId;
			return id ? `ID:${id}` : '';
		},
		showWatermark() {
			return this.videoPlaying && !!this.watermarkText && !this.videoError;
		},
		volumeIcon() {
			return this.muted || this.volume === 0 ? '🔇' : '🔊';
		},
		ratingHint() {
			if (this.myRating) return '已记录本节课程评分，不可更改。';
			if (this.percent < 90) return '学习进度达到90%后即可提交评分。';
			return '看完课程后点击星级，每节课只能评价一次。';
		}
	},
	methods: {
		async loadLesson() {
			try {
				const data = await getLessonVideo(this.title, this.courseId);
				this.videoUrl = data.videoUrl || '';
				this.poster = data.poster || '';
				this.pageTotal = data.pageTotal || 1;
				this.prevTitle = data.prevTitle || '';
				this.nextTitle = data.nextTitle || '';
				this.lessonCard = data.card || null;
				this.durationSeconds = Number(data.duration) || 0;
				this.totalTime = this.formatTime(this.durationSeconds);
				if (data.progress) {
					this.initialTime = Number(data.progress.currentTime) || 0;
					this.currentSeconds = this.initialTime;
					this.percent = Number(data.progress.percent) || 0;
					this.curTime = this.formatTime(this.currentSeconds);
				}
			} catch (err) {
				this.videoError = true;
				console.warn('视频接口不可用', err);
			}
		},
		async loadRatingState() {
			try {
				const data = await getLessonRatingApi(this.title);
				this.myRating = Number(data.rating && data.rating.rating) || 0;
			} catch (err) {
				console.warn('评分接口不可用', err);
			}
		},
		goBack() {
			if (this.isWebFullscreen) {
				this.exitWebFullscreen();
				return;
			}
			uni.navigateBack({ fail:()=>this.returnToCatalog(true) });
		},
		detectDesktopH5() {
			if (typeof window === 'undefined') return;
			this.isDesktopH5 = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
		},
		bindFullscreenListener() {
			if (typeof document === 'undefined' || this.fullscreenListener) return;
			this.fullscreenListener = () => {
				const active = document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement;
				this.isWebFullscreen = !!active;
			};
			['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange'].forEach(name => {
				document.addEventListener(name, this.fullscreenListener);
			});
		},
		unbindFullscreenListener() {
			if (typeof document === 'undefined' || !this.fullscreenListener) return;
			['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange'].forEach(name => {
				document.removeEventListener(name, this.fullscreenListener);
			});
			this.fullscreenListener = null;
		},
		videoShell() {
			if (typeof document === 'undefined') return null;
			return document.querySelector('.video-wrap');
		},
		nativeVideoElement() {
			if (typeof document === 'undefined') return null;
			return document.querySelector('#lessonVideo video') || document.querySelector('uni-video#lessonVideo video');
		},
		toggleWebFullscreen() {
			if (this.isWebFullscreen) {
				this.exitWebFullscreen();
			} else {
				this.enterWebFullscreen();
			}
		},
		enterWebFullscreen() {
			const el = this.videoShell();
			if (!el) return;
			const request = el.requestFullscreen || el.webkitRequestFullscreen || el.mozRequestFullScreen || el.msRequestFullscreen;
			if (request) {
				request.call(el);
				this.isWebFullscreen = true;
			}
		},
		exitWebFullscreen(showToast = true) {
			if (typeof document === 'undefined') return;
			const active = document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement;
			if (!active) {
				this.isWebFullscreen = false;
				return;
			}
			const exit = document.exitFullscreen || document.webkitExitFullscreen || document.mozCancelFullScreen || document.msExitFullscreen;
			if (exit) exit.call(document);
			this.isWebFullscreen = false;
			if (showToast) uni.showToast({ title:'已退出全屏', icon:'none' });
		},
		onNativeFullscreenChange(e) {
			const detail = e.detail || {};
			this.isWebFullscreen = !!detail.fullScreen;
		},
		onLoadedMeta(e) {
			const duration = Number(e.detail && e.detail.duration) || this.durationSeconds;
			if (duration) {
				this.durationSeconds = duration;
				this.totalTime = this.formatTime(duration);
			}
			this.applyPlaybackRate();
			this.applyVolume();
		},
		onPlay() {
			this.videoPlaying = true;
		},
		onPause() {
			this.videoPlaying = false;
		},
		toggleVideoPlayback() {
			if (this.videoError || !this.videoUrl) return;
			const ctx = this.videoContext || uni.createVideoContext('lessonVideo', this);
			this.videoContext = ctx;
			if (this.videoPlaying) {
				if (ctx && typeof ctx.pause === 'function') ctx.pause();
				this.videoPlaying = false;
			} else {
				if (ctx && typeof ctx.play === 'function') ctx.play();
				this.videoPlaying = true;
			}
		},
		onTimeUpdate(e) {
			const detail = e.detail || {};
			this.currentSeconds = Number(detail.currentTime) || 0;
			if (detail.duration) this.durationSeconds = Number(detail.duration);
			this.curTime = this.formatTime(this.currentSeconds);
			this.totalTime = this.formatTime(this.durationSeconds);
			this.percent = this.durationSeconds ? Math.min(100, Math.round((this.currentSeconds / this.durationSeconds) * 100)) : 0;
			this.progressSaved = false;
			if (Date.now() - this.lastSavedAt > 8000) this.persistProgress(false);
		},
		onEnded() {
			this.percent = 100;
			this.videoPlaying = false;
			this.persistProgress(true);
		},
		onVideoError() {
			this.videoError = true;
			this.videoPlaying = false;
		},
		setPlaybackRate(rate) {
			this.playbackRate = Number(rate) || 1;
			this.applyPlaybackRate();
			this.showSpeedMenu = false;
		},
		toggleSpeedMenu() {
			this.showSpeedMenu = !this.showSpeedMenu;
			if (this.showSpeedMenu) this.showVolumePanel = false;
		},
		applyPlaybackRate() {
			this.$nextTick(() => {
				const ctx = this.videoContext || uni.createVideoContext('lessonVideo', this);
				this.videoContext = ctx;
				if (ctx && typeof ctx.playbackRate === 'function') {
					ctx.playbackRate(this.playbackRate);
				}
				const video = this.nativeVideoElement();
				if (video) video.playbackRate = this.playbackRate;
			});
		},
		rateLabel(rate) {
			return `${rate}x`;
		},
		toggleVolumePanel() {
			this.showVolumePanel = !this.showVolumePanel;
			if (this.showVolumePanel) this.showSpeedMenu = false;
		},
		onVolumeChanging(e) {
			this.setVolume(e.detail && e.detail.value);
		},
		onVolumeChange(e) {
			this.setVolume(e.detail && e.detail.value);
		},
		setVolume(value) {
			const next = Math.max(0, Math.min(100, Number(value) || 0));
			this.volume = next;
			if (next > 0) {
				this.lastVolume = next;
				this.muted = false;
			} else {
				this.muted = true;
			}
			this.applyVolume();
		},
		toggleMute() {
			if (this.muted || this.volume === 0) {
				this.volume = this.lastVolume || 80;
				this.muted = false;
			} else {
				this.lastVolume = this.volume || 80;
				this.muted = true;
			}
			this.applyVolume();
		},
		applyVolume() {
			this.$nextTick(() => {
				const video = this.nativeVideoElement();
				if (!video) return;
				video.muted = this.muted || this.volume === 0;
				video.volume = Math.max(0, Math.min(1, this.volume / 100));
			});
		},
		async persistProgress(ended) {
			if (!isLoggedIn() || !this.videoUrl) return;
			this.lastSavedAt = Date.now();
			try {
				await saveLessonProgress(this.title, {
					lessonTitle: this.title,
					courseId: this.courseId,
					courseTitle: this.courseTitle,
					currentTime: this.currentSeconds,
					duration: this.durationSeconds,
					percent: this.percent,
					ended
				});
				this.progressSaved = true;
			} catch (err) {
				console.warn('学习进度保存失败', err);
			}
		},
		formatTime(seconds = 0) {
			const safe = Math.max(0, Math.floor(Number(seconds) || 0));
			const min = String(Math.floor(safe / 60)).padStart(2, '0');
			const sec = String(safe % 60).padStart(2, '0');
			return `${min}:${sec}`;
		},
		goNext() {
			if (!this.nextTitle || this.nextTitle === '下一讲') {
				uni.showToast({ title:'已到当前示例下一讲', icon:'none' });
				return;
			}
			uni.redirectTo({ url:`/pages/lesson/lesson?title=${encodeURIComponent(this.nextTitle)}` });
		},
		goPrev() {
			if (!this.prevTitle) {
				uni.showToast({ title:'已经是第一讲', icon:'none' });
				return;
			}
			uni.redirectTo({ url:`/pages/lesson/lesson?title=${encodeURIComponent(this.prevTitle)}` });
		},
		returnToCatalog(fromBackFail = false) {
			if (this.isWebFullscreen) {
				this.exitWebFullscreen();
				return;
			}
			if (!fromBackFail) {
				const stack = typeof getCurrentPages === 'function' ? getCurrentPages() : [];
				if (stack && stack.length > 1) {
					uni.navigateBack({ fail:()=>this.returnToCatalog(true) });
					return;
				}
			}
			const page = this.courseId && this.courseId.endsWith('-trial') ? 'course-detail' : 'course-full';
			const title = this.courseTitle || this.title;
			uni.redirectTo({ url:`/pages/${page}/${page}?title=${encodeURIComponent(title)}&courseId=${encodeURIComponent(this.courseId)}` });
		},
		toast(title) { uni.showToast({ title, icon:'none' }); },
		async submitLessonRating(star) {
			if (!isLoggedIn()) {
				uni.showToast({ title:'请先登录', icon:'none' });
				return;
			}
			if (this.myRating) {
				uni.showToast({ title:'本节已评分，不可更改', icon:'none' });
				return;
			}
			if (this.ratingLoading) return;
			this.ratingLoading = true;
			try {
				await saveLessonRatingApi(this.title, star, this.title, {
					courseId: this.courseId,
					courseTitle: this.courseTitle,
					chapterTitle: this.chapterTitle
				});
				this.myRating = star;
				uni.showToast({ title:'评分已保存', icon:'success' });
			} catch (err) {
				uni.showToast({ title: err.message || '评分失败', icon:'none' });
			} finally {
				this.ratingLoading = false;
			}
		}
	}
}
</script>

<style lang="scss">
page { background:#fff; }
.page { min-height:100vh; background:#fff; padding-bottom:150rpx; }

.nav {
	position:relative;
	height:90rpx;
	display:flex; align-items:center; justify-content:center;
	border-bottom:1rpx solid #eef0f3;
}
.back { position:absolute; left:24rpx; font-size:46rpx; font-weight:300; color:#222; cursor:pointer; }
.nav-title { font-size:30rpx; color:#222; font-weight:600; }

/* 视频 */
.video-wrap {
	position:relative;
	background:#111827;
	overflow:hidden;
}
.video-player {
	width:100%;
	height:420rpx;
	background:#000;
	display:block;
	cursor:pointer;
}
.desktop-video-tools {
	position:absolute;
	right:22rpx;
	top:22rpx;
	z-index:8;
	display:none;
}
.fullscreen-toggle {
	height:54rpx;
	line-height:54rpx;
	padding:0 22rpx;
	border-radius:30rpx;
	background:rgba(17,24,39,.72);
	color:#f8fafc;
	font-size:22rpx;
	font-weight:800;
	border:1rpx solid rgba(255,255,255,.28);
	box-shadow:0 8rpx 20rpx rgba(15,23,42,.22);
	cursor:pointer;
}
.fullscreen-toggle.active {
	background:#2563eb;
	border-color:#2563eb;
}
.moving-watermark {
	position:absolute;
	left:0;
	top:142rpx;
	z-index:5;
	padding:8rpx 18rpx;
	border-radius:8rpx;
	background:rgba(0,0,0,.22);
	color:rgba(255,255,255,.72);
	font-size:24rpx;
	letter-spacing:0;
	white-space:nowrap;
	pointer-events:none;
	animation: watermarkSweep 15s linear infinite;
	transform:translateX(100vw);
}
@keyframes watermarkSweep {
	0% { transform:translateX(100vw); opacity:0; }
	6% { opacity:.72; }
	58% { transform:translateX(-100%); opacity:.72; }
	59% { transform:translateX(-100%); opacity:0; }
	100% { transform:translateX(-100%); opacity:0; }
}
.video-error {
	padding:24rpx 30rpx;
	background:#fff7ed;
	color:#9a3412;
}
.video-error-title {
	font-size:28rpx;
	font-weight:800;
}
.video-error-sub {
	margin-top:8rpx;
	font-size:24rpx;
}
.video-info {
	display:flex;
	align-items:center;
	justify-content:space-between;
	padding:22rpx 28rpx 24rpx;
	color:#fff;
}
.video-title {
	font-size:30rpx;
	font-weight:800;
}
.video-sub {
	margin-top:8rpx;
	color:#cbd5e1;
	font-size:24rpx;
}
.save-state {
	flex-shrink:0;
	margin-left:18rpx;
	padding:8rpx 16rpx;
	border-radius:26rpx;
	background:rgba(255,255,255,.12);
	color:#dbeafe;
	font-size:22rpx;
}
.video-quick-tools {
	position:absolute;
	right:24rpx;
	top:auto;
	bottom:104rpx;
	z-index:10;
	display:flex;
	flex-direction:column;
	align-items:flex-end;
	gap:8rpx;
	pointer-events:none;
}
.speed-menu {
	width:126rpx;
	padding:8rpx 0;
	border-radius:10rpx;
	background:rgba(15,23,42,.68);
	backdrop-filter:blur(8px);
	border:1rpx solid rgba(255,255,255,.18);
	box-shadow:0 12rpx 28rpx rgba(0,0,0,.22);
	pointer-events:auto;
}
.speed-menu-item {
	height:48rpx;
	line-height:48rpx;
	text-align:center;
	color:#e5edf7;
	font-size:25rpx;
	font-weight:700;
	cursor:pointer;
}
.speed-menu-item.active {
	color:#ff595f;
	background:rgba(255,255,255,.12);
}
.quick-tools-row {
	display:flex;
	align-items:flex-end;
	gap:12rpx;
	pointer-events:auto;
}
.quick-tool {
	min-width:62rpx;
	height:58rpx;
	line-height:58rpx;
	text-align:center;
	border-radius:12rpx;
	background:rgba(15,23,42,.72);
	color:#f8fafc;
	font-size:24rpx;
	font-weight:800;
	border:1rpx solid rgba(255,255,255,.2);
	box-shadow:0 8rpx 20rpx rgba(0,0,0,.2);
	cursor:pointer;
}
.quick-tool.active,
.quick-tool.muted {
	background:#2563eb;
	border-color:#2563eb;
}
.volume-control {
	position:relative;
}
.volume-panel {
	position:absolute;
	right:0;
	bottom:72rpx;
	width:250rpx;
	padding:14rpx 14rpx 12rpx;
	border-radius:12rpx;
	background:rgba(15,23,42,.78);
	border:1rpx solid rgba(255,255,255,.18);
	box-shadow:0 12rpx 28rpx rgba(0,0,0,.22);
}
.volume-slider {
	width:100%;
}
.volume-mute {
	margin-top:4rpx;
	height:42rpx;
	line-height:42rpx;
	text-align:center;
	border-radius:8rpx;
	background:rgba(255,255,255,.12);
	color:#e5edf7;
	font-size:22rpx;
	font-weight:700;
	cursor:pointer;
}

/* 本节内容 */
.section {
	display:flex; justify-content:space-between; align-items:center;
	padding: 28rpx 30rpx 10rpx;
}
.s-title { font-size:30rpx; color:#222; font-weight:800; }
.s-page { font-size:28rpx; color:#999; }

/* 讲点卡 */
.content {
	position:relative;
	min-height: 360rpx;
}
.lesson-card-panel {
	margin: 20rpx 24rpx 34rpx;
	padding: 26rpx;
	background:#fff;
	border:1rpx solid #eef0f3;
	border-radius:16rpx;
}
.lesson-card-title {
	font-size:30rpx;
	color:#222;
	font-weight:800;
	margin-bottom:18rpx;
}
.lesson-card-item {
	display:flex;
	align-items:flex-start;
	padding:16rpx 0;
	border-top:1rpx solid #f0f2f5;
}
.lesson-card-index {
	width:42rpx;
	height:42rpx;
	line-height:42rpx;
	text-align:center;
	border-radius:50%;
	background:#eaf4ff;
	color:#3aa3f5;
	font-size:24rpx;
	font-weight:800;
	margin-right:16rpx;
	flex-shrink:0;
}
.lesson-card-text {
	color:#394150;
	font-size:27rpx;
	line-height:1.5;
}

.next-fab {
	position:absolute; right:30rpx; top:150rpx;
	width:90rpx; height:90rpx; border-radius:50%;
	background:#3aa3f5;
	color:#fff;
	display:flex; flex-direction:column; align-items:center; justify-content:center;
	box-shadow: 0 6rpx 16rpx rgba(58,163,245,0.4);
	cursor:pointer;
}
.fab-arrow { font-size:30rpx; line-height:30rpx; }
.fab-text { font-size:20rpx; margin-top:2rpx; }

.rating-panel {
	margin: 10rpx 24rpx 22rpx;
	background:#fff;
	border:1rpx solid #eef0f3;
	border-radius:16rpx;
	padding:26rpx 24rpx;
	box-shadow:0 4rpx 12rpx rgba(0,0,0,0.04);
}
.rating-head {
	display:flex;
	align-items:center;
	justify-content:space-between;
}
.rating-title {
	font-size:30rpx;
	color:#222;
	font-weight:800;
}
.rating-state {
	font-size:22rpx;
	color:#3aa3f5;
	background:#eaf4ff;
	padding:6rpx 16rpx;
	border-radius:24rpx;
}
.star-row {
	display:flex;
	align-items:center;
	justify-content:space-between;
	margin-top:22rpx;
}
.star-item {
	width:20%;
	display:flex;
	flex-direction:column;
	align-items:center;
	color:#c7ccd4;
	cursor:pointer;
}
.star-item.active { color:#f5b42a; }
.star-item.disabled { opacity:.65; cursor:default; }
.star-icon {
	font-size:44rpx;
	line-height:48rpx;
}
.star-label {
	margin-top:4rpx;
	font-size:22rpx;
	color:#666;
}
.star-item.active .star-label { color:#8a6200; font-weight:700; }
.rating-desc {
	margin-top:20rpx;
	background:#fff8e8;
	color:#8a6200;
	font-size:26rpx;
	font-weight:700;
	padding:16rpx 18rpx;
	border-radius:12rpx;
}
.favorite-desc {
	margin-top:20rpx;
	background:#f8fafc;
	color:#596272;
	font-size:24rpx;
	line-height:1.5;
	padding:16rpx 18rpx;
	border-radius:12rpx;
}
.rating-options {
	display:flex;
	flex-wrap:wrap;
	margin-top:14rpx;
}
.rating-option {
	font-size:22rpx;
	color:#666;
	background:#f5f7fa;
	border-radius:24rpx;
	padding:8rpx 14rpx;
	margin:8rpx 10rpx 0 0;
}
.rating-btn {
	margin-top:22rpx;
	height:72rpx;
	line-height:72rpx;
	text-align:center;
	background:#3aa3f5;
	color:#fff;
	font-size:28rpx;
	font-weight:700;
	border-radius:36rpx;
	cursor:pointer;
}
.rating-btn.saved {
	background:#eef2f7;
	color:#475569;
}
.rating-btn.disabled {
	background:#d8dde5;
	color:#8a929c;
}

/* 底部 */
.footer {
	position:fixed; left:0; right:0; bottom:0;
	height:120rpx;
	background:#fff;
	border-top:1rpx solid #eef0f3;
	display:flex; align-items:center;
	padding: 0 24rpx;
}
.return-btn {
	width:100%;
	height:80rpx;
	line-height:80rpx;
	text-align:center;
	background:#eef6ff;
	color:#1677d2;
	border:1rpx solid #b9dcff;
	font-size:28rpx;
	font-weight:800;
	border-radius:14rpx;
	cursor:pointer;
}
.card-btn {
	display:flex; flex-direction:column; align-items:center;
	width:120rpx;
	color:#222;
	cursor:pointer;
}
.card-ico { font-size:36rpx; }
.card-text { font-size:22rpx; margin-top:2rpx; font-weight:700; }
.prev-btn, .next-btn {
	flex:1;
	height:80rpx; line-height:80rpx; text-align:center;
	background:#dde1e6;
	color:#9aa1a9;
	font-size:28rpx;
	border-radius:12rpx;
	margin-left:20rpx;
	cursor:pointer;
}
.prev-btn.active {
	background:#eef7ff;
	color:#3aa3f5;
}
.next-btn.active {
	background:#3aa3f5;
	color:#fff;
}

@media (hover:hover) and (pointer:fine) {
	.page {
		max-width:680px;
		margin:0 auto;
		box-shadow:0 0 0 1px #e5e7eb;
	}
	.desktop-video-tools {
		display:block;
	}
	.video-wrap:fullscreen {
		width:100vw;
		height:100vh;
		background:#0f172a;
		display:flex;
		flex-direction:column;
	}
	.video-wrap:fullscreen .video-player {
		flex:1;
		width:100vw;
		height:auto;
		min-height:0;
	}
	.video-wrap:fullscreen .video-info,
	.video-wrap:fullscreen .video-quick-tools {
		flex-shrink:0;
	}
	.video-wrap:fullscreen .video-quick-tools {
		top:auto;
		right:34rpx;
		bottom:146rpx;
	}
	.video-wrap:fullscreen .fullscreen-toggle {
		background:#2563eb;
		border-color:#2563eb;
	}
	.footer {
		left:50%;
		width:680px;
		right:auto;
		transform:translateX(-50%);
	}
}
</style>

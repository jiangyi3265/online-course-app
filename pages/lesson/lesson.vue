<template>
	<view class="page">
		<!-- 顶部导航 -->
		<view class="nav">
			<view class="back" @click="goBack">‹</view>
			<view class="nav-title">{{title}}</view>
		</view>

		<!-- 视频区 -->
		<view class="lesson-player">
			<view class="video-wrap" @mousemove="markPlayerActivity" @touchstart="onPlayerTouchStart">
				<video
					id="lessonVideo"
					class="video-player"
					:src="videoUrl"
					:poster="poster"
					:initial-time="initialTime"
					:controls="false"
					controlslist="nodownload noplaybackrate noremoteplayback"
					disablepictureinpicture
					webkit-playsinline
					playsinline
					x5-playsinline
					:muted="muted"
					:show-fullscreen-btn="false"
					:show-play-btn="false"
					:show-center-play-btn="false"
					:enable-progress-gesture="false"
					@loadedmetadata="onLoadedMeta"
					@play="onPlay"
					@pause="onPause"
					@click="onVideoTap"
					@contextmenu.prevent="noop"
					@timeupdate="onTimeUpdate"
					@ended="onEnded"
					@fullscreenchange="onNativeFullscreenChange"
					@error="onVideoError"
				></video>
				<image
					v-if="showPosterCover"
					class="poster-cover"
					:src="poster"
					mode="aspectFill"
					@click.stop="toggleVideoPlayback"
				/>
				<view v-if="showTapPlayLayer" class="tap-play-layer" @click.stop="toggleVideoPlayback">
					<view class="tap-play-button">▶</view>
				</view>
				<view class="video-error" v-if="videoError">
					<view class="video-error-title">视频暂时无法加载</view>
					<view class="video-error-sub">请检查网络，或稍后重新进入本讲。</view>
					<view class="video-error-action" @click.stop="retryVideo">重新加载</view>
				</view>
				<view class="lesson-lock" v-if="lessonLocked">
					<view class="lesson-lock-ico">🔒</view>
					<view class="lesson-lock-title">本节暂未解锁</view>
					<view class="lesson-lock-sub">{{lockReason}}</view>
				</view>
				<view class="moving-watermark" v-if="showWatermark">{{watermarkText}}</view>
				<!-- 控件与视频融合：覆盖在视频底部；播放时 3 秒无操作自动隐藏 -->
				<view class="player-controls" :class="{hidden: !controlsVisible}" v-if="!videoError && !lessonLocked">
					<view
						class="player-progress-track"
						@click.stop="seekByClick"
						@mousedown.stop.prevent="startSeekDrag"
						@touchstart.stop.prevent="startSeekDrag"
						@touchmove.stop.prevent="onSeekDrag"
						@touchend.stop.prevent="endSeekDrag"
						@touchcancel.stop.prevent="endSeekDrag"
					>
						<view class="player-progress-fill" :style="{width: percent + '%'}">
							<view class="player-progress-thumb"></view>
						</view>
					</view>
					<view class="player-control-row">
						<view class="control-button play-button" @click.stop="toggleVideoPlayback">{{videoPlaying ? 'Ⅱ' : '▶'}}</view>
						<view class="control-time">
							<text>{{curTime}}</text>
							<text class="time-sep">/</text>
							<text>{{totalTime}}</text>
						</view>
						<view class="control-spacer"></view>
						<view class="desktop-speed-wrap">
							<view class="desktop-speed-menu" v-if="showSpeedMenu">
								<view
									class="desktop-speed-item"
									v-for="rate in playbackRates"
									:key="rate"
									:class="{active: playbackRate === rate}"
									@click.stop="setPlaybackRate(rate)"
								>{{rateLabel(rate)}}</view>
							</view>
							<view class="control-button rate-button" :class="{active: showSpeedMenu}" @click.stop="toggleSpeedMenu">{{rateLabel(playbackRate)}}</view>
						</view>
						<view class="control-button volume-button" :class="{muted: muted || volume === 0}" @click.stop="toggleMute">
							<view class="speaker-icon">
								<view class="speaker-core"></view>
								<view class="speaker-wave wave-one"></view>
								<view class="speaker-wave wave-two"></view>
							</view>
						</view>
						<view class="control-button fullscreen-button" :class="{active:isWebFullscreen}" @click.stop="toggleWebFullscreen">⛶</view>
					</view>
				</view>
			</view>
		</view>

		<!-- 本节内容 -->
		<view class="section" v-if="showLessonOutline">
			<view class="section-left">
				<text class="s-title">本节内容</text>
				<!-- 已学进度仅后台记录，不在页面展示 -->
			</view>
			<text class="s-page">{{page}}/{{pageTotal}}</text>
		</view>

		<view class="lesson-content-list" v-if="showLessonOutline && chapterLessons.length">
			<view
				class="lesson-content-row"
				v-for="(item, index) in chapterLessons"
				:key="`${item.title}-${index}`"
				:class="{active: item.active}"
				@click="openChapterLesson(item)"
			>
				<view class="lesson-content-index">{{index + 1}}</view>
				<view class="lesson-content-main">
					<view class="lesson-content-title">{{item.title}}</view>
					<view class="lesson-content-meta">{{item.chapterTitle || chapterTitle || lessonCategoryTitle}}</view>
				</view>
				<view class="lesson-content-action">{{item.active ? '正在学习' : '去学习'}}</view>
			</view>
		</view>
		<view class="lesson-card-panel" v-else-if="showLessonOutline && lessonCard && lessonCard.items && lessonCard.items.length">
			<view class="lesson-card-title">{{lessonCard.title || '讲点卡'}}</view>
			<view class="lesson-card-item" v-for="(item, index) in lessonCard.items" :key="index">
				<view class="lesson-card-index">{{index + 1}}</view>
				<view class="lesson-card-text">{{item}}</view>
			</view>
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
import { getCourse, getLessonRatingApi, getLessonVideo, isLoggedIn, resolveMediaUrl, saveLessonProgress, saveLessonRatingApi } from '@/common/api.js'
export default {
	data() {
		return {
			title: '选材与加工高分技巧',
			lessonId: '',
			courseId: '',
			courseTitle: '',
			chapterTitle: '',
			categoryTitle: '',
			videoUrl: '',
			poster: '',
			initialTime: 0,
			curTime: '00:00',
			totalTime: '00:00',
			currentSeconds: 0,
			durationSeconds: 0,
			percent: 0,
			videoError: false,
			videoErrorTimer: null,
			videoLoadAttempts: 0,
			lessonLocked: false,
			lockReason: '',
			videoPlaying: false,
			progressSaved: false,
			lastSavedAt: 0,
			videoContext: null,
			playbackRate: 1,
			playbackRates: [1.5, 1, 0.75, 0.5],
			showSpeedMenu: false,
			speedMenuTimer: null,
			controlsVisible: true,
			controlsHideTimer: null,
			controlsWereHiddenOnTouch: false,
			seekDragging: false,
			volume: 80,
			lastVolume: 80,
			muted: false,
			isDesktopH5: false,
			isWebFullscreen: false,
			fullscreenListener: null,
			prevTitle: '',
			nextTitle: '',
			lessonCard: null,
			chapterLessons: [],
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
		this.lessonId = opts && opts.lessonId ? decodeURIComponent(opts.lessonId) : this.title;
		if (opts && opts.courseId) this.courseId = decodeURIComponent(opts.courseId);
		if (opts && opts.courseTitle) this.courseTitle = decodeURIComponent(opts.courseTitle);
		if (opts && opts.chapterTitle) this.chapterTitle = decodeURIComponent(opts.chapterTitle);
		this.categoryTitle = this.resolveCategoryTitle(opts);
		this.syncPageTitle();
		this.userInfo = uni.getStorageSync('userInfo') || {};
		await this.loadLesson();
		await this.loadChapterLessons();
		if (isLoggedIn()) await this.loadRatingState();
	},
	onReady() {
		this.detectDesktopH5();
		this.bindFullscreenListener();
		this.videoContext = uni.createVideoContext('lessonVideo', this);
		this.applyPlaybackRate();
		this.applyVolume();
		this.lockNativeVideoPlayback();
	},
	onUnload() {
		this.clearSpeedMenuTimer();
		this.clearControlsHideTimer();
		this.clearVideoErrorTimer();
		this.unbindSeekDragListeners();
		this.unbindFullscreenListener();
		this.setNativeVideoControls(false);
		this.exitWebFullscreen(false);
		this.persistProgress(false);
	},
	onHide() {
		this.closeSpeedMenu();
		this.clearControlsHideTimer();
		this.clearVideoErrorTimer();
		this.unbindSeekDragListeners();
		this.setNativeVideoControls(false);
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
		showPosterCover() {
			return !!this.poster && !this.videoPlaying && !this.videoError && !this.lessonLocked && this.currentSeconds <= 0;
		},
		showTapPlayLayer() {
			return !!this.videoUrl && !this.videoPlaying && !this.videoError && !this.lessonLocked;
		},
		showLessonOutline() {
			return false;
		},
		ratingHint() {
			if (this.myRating) return '已记录本节课程评分，不可更改。';
			if (this.percent < 90) return '学习进度达到90%后即可提交评分。';
			return '看完课程后点击星级，每节课只能评价一次。';
		},
		lessonCategoryTitle() {
			return this.categoryTitle || this.inferCategoryTitle(this.title, this.chapterTitle) || '讲点';
		}
	},
	methods: {
		resolveCategoryTitle(opts = {}) {
			if (opts && opts.categoryTitle) return decodeURIComponent(opts.categoryTitle);
			return this.inferCategoryTitle(this.title, this.chapterTitle);
		},
		inferCategoryTitle(...values) {
			const text = values.filter(Boolean).join(' ');
			if (/复习加强课|复习加强|复习测试/.test(text)) return '复习加强课';
			if (/技巧绝招课|技巧绝招|绝招课/.test(text)) return '技巧绝招';
			if (/知识巩固|知识点巩固/.test(text)) return '知识巩固';
			return '讲点';
		},
		syncPageTitle() {
			const title = this.lessonCategoryTitle;
			if (typeof uni !== 'undefined' && uni.setNavigationBarTitle) {
				uni.setNavigationBarTitle({ title });
			}
			// H5/微信浏览器读取 document.title，uni 的自定义导航不会自动同步这里。
			if (typeof document !== 'undefined') document.title = title;
		},
		async loadLesson() {
			try {
				const data = await getLessonVideo(this.lessonId || this.title, this.courseId);
				if (data.locked) {
					// 月卡顺序解锁：本节未解锁，仅展示提示，不加载视频
					this.lessonLocked = true;
					this.lockReason = data.lockReason || '请按课程顺序学习后再观看本节';
					this.videoUrl = '';
					return;
				}
				this.lessonLocked = false;
				this.videoError = false;
				this.videoLoadAttempts = 0;
				this.videoUrl = resolveMediaUrl(data.videoUrl || '');
				this.poster = resolveMediaUrl(data.poster || '');
				if (!this.courseTitle && data.courseTitle) this.courseTitle = data.courseTitle;
				if (!this.chapterTitle && data.chapterTitle) this.chapterTitle = data.chapterTitle;
				this.pageTotal = data.pageTotal || 1;
				this.prevTitle = data.prevTitle || '';
				this.nextTitle = data.nextTitle || '';
				this.lessonCard = data.card || null;
				this.durationSeconds = this.safeSeconds(data.duration);
				this.totalTime = this.formatTime(this.durationSeconds);
				if (data.progress) {
					this.initialTime = this.safeSeconds(data.progress.currentTime);
					this.currentSeconds = this.initialTime;
					this.percent = Number(data.progress.percent) || 0;
					this.curTime = this.formatTime(this.currentSeconds);
				}
			} catch (err) {
				this.videoError = true;
				console.warn('视频接口不可用', err);
			}
		},
		async loadChapterLessons() {
			if (!this.courseId) return;
			try {
				const course = await getCourse(this.courseId);
				const context = this.findLessonContext(course, this.lessonId || this.title);
				if (!context || !context.lessons.length) return;
				this.chapterLessons = context.lessons;
				this.pageTotal = context.lessons.length;
				this.page = Math.max(1, context.activeIndex + 1);
				if (!this.chapterTitle && context.chapterTitle) this.chapterTitle = context.chapterTitle;
			} catch (err) {
				console.warn('课程章节加载失败', err);
			}
		},
		findLessonContext(course = {}, lessonId = '') {
			const versions = this.courseVersionsForDisplay(course);
			const normalizedId = this.normalizeLessonKey(lessonId || this.title);
			const preferredVersion = this.preferredVersionIndex();
			const orderedVersions = versions
				.map((version, index) => ({ version, index }))
				.sort((a, b) => (a.index === preferredVersion ? -1 : b.index === preferredVersion ? 1 : a.index - b.index));
			let fallback = null;
			for (const entry of orderedVersions) {
				const chapters = Array.isArray(entry.version.chapters) ? entry.version.chapters : [];
				for (const chapter of chapters) {
					if (!this.isVisible(chapter)) continue;
					const items = (chapter.items || chapter.children || []).filter(item => this.isVisible(item));
					if (!items.length) continue;
					const mapped = items.map((item, index) => {
						const title = String(item.title || item.name || `章节内容${index + 1}`).trim();
						const active = this.sameLesson(title, normalizedId) || this.lessonContainsMatch(item, normalizedId);
						return {
							...item,
							title,
							active,
							chapterTitle: chapter.title || entry.version.name || '',
							versionIndex: entry.index
						};
					});
					const activeIndex = mapped.findIndex(item => item.active);
					const sameChapter = this.chapterTitle && chapter.title && this.normalizeLessonKey(chapter.title) === this.normalizeLessonKey(this.chapterTitle);
					if (activeIndex >= 0) {
						return { chapterTitle: chapter.title || '', lessons: mapped, activeIndex };
					}
					if (!fallback && sameChapter) {
						fallback = { chapterTitle: chapter.title || '', lessons: mapped, activeIndex: 0 };
					}
				}
			}
			return fallback;
		},
		courseVersionsForDisplay(course = {}) {
			const versions = Array.isArray(course.versions) ? course.versions : [];
			if (versions.length) return versions;
			return [{ name: course.title || '课程', chapters: Array.isArray(course.chapters) ? course.chapters : [] }];
		},
		preferredVersionIndex() {
			const title = `${this.categoryTitle || ''} ${this.title || ''}`;
			if (/知识巩固|知识点/.test(title)) return 2;
			if (/技巧|绝招/.test(title)) return 1;
			return 0;
		},
		normalizeLessonKey(value = '') {
			return String(value || '')
				.replace(/【\s*\d+\s*[.．、]\s*/g, '【')
				.replace(/[【】]/g, '')
				.replace(/复习加强|复习测试|技巧绝招|技巧干货|视频课程|真题讲练|知识点巩固|巩固练习/g, '')
				.replace(/\s+/g, '')
				.trim();
		},
		sameLesson(title = '', normalizedId = '') {
			const normalizedTitle = this.normalizeLessonKey(title);
			return !!normalizedTitle && !!normalizedId && (normalizedTitle === normalizedId || normalizedId.includes(normalizedTitle) || normalizedTitle.includes(normalizedId));
		},
		lessonContainsMatch(lesson = {}, normalizedId = '') {
			if (!normalizedId) return false;
			const values = [lesson.name, lesson.title]
				.concat((lesson.children || []).map(child => child.name || child.title));
			return values.some(value => this.sameLesson(value, normalizedId));
		},
		isVisible(item = {}) {
			return item && item.visible !== false;
		},
		openChapterLesson(item = {}) {
			if (!item.title || item.active) return;
			uni.redirectTo({
				url:`/pages/lesson/lesson?title=${encodeURIComponent(item.title)}&lessonId=${encodeURIComponent(item.title)}&courseId=${encodeURIComponent(this.courseId)}&courseTitle=${encodeURIComponent(this.courseTitle)}&chapterTitle=${encodeURIComponent(item.chapterTitle || this.chapterTitle || '')}&categoryTitle=${encodeURIComponent(this.categoryTitle || '')}`
			});
		},
		async loadRatingState() {
			try {
				const data = await getLessonRatingApi(this.lessonId || this.title);
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
			this.closeSpeedMenu();
			this.persistProgress(false);
			const before = this.currentRouteSignature();
			const stack = typeof getCurrentPages === 'function' ? getCurrentPages() : [];
			if (stack && stack.length > 1) {
				this.armBackFallback(before);
				uni.navigateBack({ fail:()=>this.browserBackOrCatalog(before) });
				return;
			}
			this.browserBackOrCatalog(before);
		},
		currentRouteSignature() {
			if (typeof window !== 'undefined' && window.location) {
				return `${window.location.pathname}${window.location.search}${window.location.hash}`;
			}
			const stack = typeof getCurrentPages === 'function' ? getCurrentPages() : [];
			const page = stack && stack.length ? stack[stack.length - 1] : null;
			return page ? `${page.route || ''}${JSON.stringify(page.options || {})}` : '';
		},
		armBackFallback(before) {
			setTimeout(() => {
				if (this.currentRouteSignature() === before) this.browserBackOrCatalog(before, true);
			}, 800);
		},
		browserBackOrCatalog(before, forceCatalog = false) {
			if (!forceCatalog && typeof window !== 'undefined' && window.history && window.history.length > 1) {
				window.history.back();
				this.armBackFallback(before);
				return;
			}
			this.returnToCatalog(true);
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
				this.setNativeVideoControls(false);
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
			return document.querySelector('.video-wrap') || this.nativeVideoElement();
		},
		nativeVideoElement() {
			if (typeof document === 'undefined') return null;
			return document.querySelector('#lessonVideo video') || document.querySelector('uni-video#lessonVideo video');
		},
		setNativeVideoControls(enabled) {
			const video = this.nativeVideoElement();
			if (!video) return;
			video.controls = false;
			this.lockNativeVideoPlayback();
		},
		lockNativeVideoPlayback() {
			this.$nextTick(() => {
				const video = this.nativeVideoElement();
				if (!video) return;
				video.controls = false;
				video.setAttribute('controlsList', 'nodownload noplaybackrate noremoteplayback');
				video.setAttribute('controlslist', 'nodownload noplaybackrate noremoteplayback');
				video.setAttribute('disablePictureInPicture', '');
				video.setAttribute('playsinline', '');
				video.setAttribute('webkit-playsinline', '');
				video.setAttribute('x5-playsinline', '');
				video.disablePictureInPicture = true;
				video.oncontextmenu = event => {
					event.preventDefault();
					return false;
				};
			});
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
				this.setNativeVideoControls(false);
				const result = request.call(el);
				this.isWebFullscreen = true;
				if (result && typeof result.catch === 'function') {
					result.catch(() => {
						this.isWebFullscreen = false;
						this.setNativeVideoControls(false);
					});
				}
			}
		},
		exitWebFullscreen(showToast = true) {
			if (typeof document === 'undefined') return;
			const active = document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement;
			if (!active) {
				this.isWebFullscreen = false;
				this.setNativeVideoControls(false);
				return;
			}
			const exit = document.exitFullscreen || document.webkitExitFullscreen || document.mozCancelFullScreen || document.msExitFullscreen;
			if (exit) exit.call(document);
			this.isWebFullscreen = false;
			this.setNativeVideoControls(false);
			if (showToast) uni.showToast({ title:'已退出全屏', icon:'none' });
		},
		onNativeFullscreenChange(e) {
			const detail = e.detail || {};
			this.isWebFullscreen = !!detail.fullScreen;
			this.setNativeVideoControls(false);
		},
		onLoadedMeta(e) {
			const duration = this.safeSeconds(e.detail && e.detail.duration) || this.durationSeconds;
			if (duration > 0) {
				this.durationSeconds = duration;
				this.totalTime = this.formatTime(duration);
			}
			this.videoError = false;
			this.videoLoadAttempts = 0;
			this.clearVideoErrorTimer();
			this.setNativeVideoControls(false);
			this.applyPlaybackRate();
			this.applyVolume();
		},
		onPlay() {
			this.videoPlaying = true;
			this.scheduleControlsHide();
		},
		onPause() {
			this.videoPlaying = false;
			this.showControls();
			this.clearControlsHideTimer();
		},
		onVideoTap() {
			if (this.controlsWereHiddenOnTouch || !this.controlsVisible) {
				this.controlsWereHiddenOnTouch = false;
				this.markPlayerActivity();
				return;
			}
			this.markPlayerActivity();
			this.toggleVideoPlayback();
		},
		toggleVideoPlayback() {
			if (this.videoError || !this.videoUrl) return;
			this.markPlayerActivity();
			const ctx = this.videoContext || uni.createVideoContext('lessonVideo', this);
			this.videoContext = ctx;
			const video = this.nativeVideoElement();
			if (this.videoPlaying) {
				if (ctx && typeof ctx.pause === 'function') ctx.pause();
				if (video && typeof video.pause === 'function') video.pause();
				this.videoPlaying = false;
			} else {
				if (ctx && typeof ctx.play === 'function') ctx.play();
				if (video && typeof video.play === 'function') {
					const playResult = video.play();
					if (playResult && typeof playResult.catch === 'function') {
						playResult.catch(() => {
							this.videoPlaying = false;
							this.showControls();
						});
					}
				}
				this.videoPlaying = true;
				this.scheduleControlsHide();
			}
		},
		seekByClick(e) {
			if (!this.durationSeconds) return;
			this.markPlayerActivity();
			this.applySeekFromEvent(e);
		},
		startSeekDrag(e) {
			if (!this.durationSeconds) return;
			this.seekDragging = true;
			this.showControls();
			this.clearControlsHideTimer();
			this.closeSpeedMenu();
			this.applySeekFromEvent(e);
			if (typeof document !== 'undefined' && e && e.type === 'mousedown') {
				document.addEventListener('mousemove', this.onSeekDrag);
				document.addEventListener('mouseup', this.endSeekDrag);
			}
		},
		onSeekDrag(e) {
			if (!this.seekDragging) return;
			this.applySeekFromEvent(e);
		},
		endSeekDrag(e) {
			if (!this.seekDragging) return;
			this.applySeekFromEvent(e);
			this.seekDragging = false;
			this.unbindSeekDragListeners();
			this.persistProgress(false);
			this.scheduleControlsHide();
		},
		unbindSeekDragListeners() {
			if (typeof document === 'undefined') return;
			document.removeEventListener('mousemove', this.onSeekDrag);
			document.removeEventListener('mouseup', this.endSeekDrag);
		},
		applySeekFromEvent(e) {
			const clientX = this.getEventClientX(e);
			if (typeof document === 'undefined' || typeof clientX !== 'number') return;
			const track = document.querySelector('.player-progress-track');
			if (!track || !this.durationSeconds) return;
			const rect = track.getBoundingClientRect();
			if (!rect.width) return;
			const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
			const seconds = ratio * this.durationSeconds;
			this.seekToSeconds(seconds, ratio);
		},
		getEventClientX(e) {
			if (!e) return undefined;
			let clientX;
			const nativeEvent = e && e.detail && e.detail.originalEvent ? e.detail.originalEvent : e;
			if (nativeEvent && typeof nativeEvent.clientX === 'number') clientX = nativeEvent.clientX;
			if (typeof clientX !== 'number' && nativeEvent && nativeEvent.changedTouches && nativeEvent.changedTouches.length) {
				clientX = nativeEvent.changedTouches[0].clientX;
			}
			if (typeof clientX !== 'number' && nativeEvent && nativeEvent.touches && nativeEvent.touches.length) {
				clientX = nativeEvent.touches[0].clientX;
			}
			if (typeof clientX !== 'number' && e && e.detail && typeof e.detail.x === 'number') {
				clientX = e.detail.x;
			}
			return clientX;
		},
		seekToSeconds(seconds, ratio = null) {
			const safeSeconds = Math.max(0, Math.min(Number(seconds) || 0, this.durationSeconds || 0));
			const safeRatio = ratio === null
				? (this.durationSeconds ? safeSeconds / this.durationSeconds : 0)
				: Math.max(0, Math.min(1, Number(ratio) || 0));
			const ctx = this.videoContext || uni.createVideoContext('lessonVideo', this);
			this.videoContext = ctx;
			if (ctx && typeof ctx.seek === 'function') ctx.seek(safeSeconds);
			const video = this.nativeVideoElement();
			if (video) video.currentTime = safeSeconds;
			this.currentSeconds = safeSeconds;
			this.curTime = this.formatTime(safeSeconds);
			this.percent = Math.min(100, Math.round(safeRatio * 100));
			this.progressSaved = false;
		},
		onTimeUpdate(e) {
			const detail = e.detail || {};
			this.currentSeconds = this.safeSeconds(detail.currentTime);
			const duration = this.safeSeconds(detail.duration);
			if (duration > 0) this.durationSeconds = duration;
			this.curTime = this.formatTime(this.currentSeconds);
			this.totalTime = this.formatTime(this.durationSeconds);
			this.percent = this.durationSeconds ? Math.min(100, Math.round((this.currentSeconds / this.durationSeconds) * 100)) : 0;
			this.progressSaved = false;
			if (Date.now() - this.lastSavedAt > 8000) this.persistProgress(false);
		},
		onEnded() {
			this.percent = 100;
			this.videoPlaying = false;
			this.showControls();
			this.clearControlsHideTimer();
			this.persistProgress(true);
		},
		onVideoError() {
			this.videoPlaying = false;
			this.clearControlsHideTimer();
			this.clearVideoErrorTimer();
			if (this.videoUrl && this.videoLoadAttempts < 1) {
				this.videoLoadAttempts += 1;
				this.videoErrorTimer = setTimeout(() => this.reloadVideo(false), 700);
				return;
			}
			this.videoErrorTimer = setTimeout(() => {
				this.videoError = true;
				this.videoErrorTimer = null;
			}, 900);
		},
		clearVideoErrorTimer() {
			if (!this.videoErrorTimer) return;
			clearTimeout(this.videoErrorTimer);
			this.videoErrorTimer = null;
		},
		retryVideo() {
			this.videoLoadAttempts = 0;
			this.reloadVideo(true);
		},
		reloadVideo(playAfterReload = false) {
			const src = this.videoUrl;
			if (!src) return;
			this.clearVideoErrorTimer();
			this.videoError = false;
			this.videoPlaying = false;
			this.videoUrl = '';
			this.$nextTick(() => {
				this.videoUrl = src;
				this.$nextTick(() => {
					this.lockNativeVideoPlayback();
					const video = this.nativeVideoElement();
					if (video && typeof video.load === 'function') video.load();
					if (playAfterReload) this.toggleVideoPlayback();
				});
			});
		},
		setPlaybackRate(rate) {
			this.markPlayerActivity();
			this.playbackRate = Number(rate) || 1;
			this.applyPlaybackRate();
			this.closeSpeedMenu();
		},
		toggleSpeedMenu() {
			this.showControls();
			this.clearControlsHideTimer();
			this.showSpeedMenu = !this.showSpeedMenu;
			if (this.showSpeedMenu) {
				this.scheduleSpeedMenuClose();
			} else {
				this.clearSpeedMenuTimer();
				this.scheduleControlsHide();
			}
		},
		scheduleSpeedMenuClose() {
			this.clearSpeedMenuTimer();
			this.speedMenuTimer = setTimeout(() => {
				this.showSpeedMenu = false;
				this.speedMenuTimer = null;
				this.scheduleControlsHide();
			}, 3000);
		},
		clearSpeedMenuTimer() {
			if (!this.speedMenuTimer) return;
			clearTimeout(this.speedMenuTimer);
			this.speedMenuTimer = null;
		},
		closeSpeedMenu() {
			this.showSpeedMenu = false;
			this.clearSpeedMenuTimer();
			this.scheduleControlsHide();
		},
		markPlayerActivity() {
			this.showControls();
			this.scheduleControlsHide();
		},
		onPlayerTouchStart() {
			this.controlsWereHiddenOnTouch = !this.controlsVisible;
			this.markPlayerActivity();
		},
		showControls() {
			this.controlsVisible = true;
		},
		scheduleControlsHide() {
			this.clearControlsHideTimer();
			if (!this.videoPlaying || this.seekDragging || this.showSpeedMenu) return;
			this.controlsHideTimer = setTimeout(() => {
				this.controlsVisible = false;
				this.controlsHideTimer = null;
			}, 3000);
		},
		clearControlsHideTimer() {
			if (!this.controlsHideTimer) return;
			clearTimeout(this.controlsHideTimer);
			this.controlsHideTimer = null;
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
		toggleMute() {
			this.markPlayerActivity();
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
				await saveLessonProgress(this.lessonId || this.title, {
					lessonTitle: this.title,
					sourceLessonTitle: this.lessonId || this.title,
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
			const safe = Math.max(0, Math.floor(this.safeSeconds(seconds)));
			const min = String(Math.floor(safe / 60)).padStart(2, '0');
			const sec = String(safe % 60).padStart(2, '0');
			return `${min}:${sec}`;
		},
		safeSeconds(value = 0) {
			const number = Number(value);
			return Number.isFinite(number) && number > 0 ? number : 0;
		},
		noop() {},
		goNext() {
			if (!this.nextTitle || this.nextTitle === '下一讲') {
				uni.showToast({ title:'已到当前示例下一讲', icon:'none' });
				return;
			}
			uni.redirectTo({ url:`/pages/lesson/lesson?title=${encodeURIComponent(this.nextTitle)}&categoryTitle=${encodeURIComponent(this.lessonCategoryTitle)}` });
		},
		goPrev() {
			if (!this.prevTitle) {
				uni.showToast({ title:'已经是第一讲', icon:'none' });
				return;
			}
			uni.redirectTo({ url:`/pages/lesson/lesson?title=${encodeURIComponent(this.prevTitle)}&categoryTitle=${encodeURIComponent(this.lessonCategoryTitle)}` });
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
				await saveLessonRatingApi(this.lessonId || this.title, star, this.title, {
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
.nav-title {
	max-width:560rpx;
	overflow:hidden;
	text-overflow:ellipsis;
	white-space:nowrap;
	font-size:28rpx;
	color:#1f2937;
	font-weight:700;
	letter-spacing:0;
}

/* 视频 */
.lesson-player {
	background:#0f172a;
}
.video-wrap {
	position:relative;
	background:#0f172a;
	overflow:hidden;
}
.video-player {
	width:100%;
	height:420rpx;
	background:#0f172a;
	display:block;
	cursor:pointer;
}
.video-wrap .uni-video-bar,
.video-wrap .uni-video-cover-play-button,
.video-wrap .uni-video-toast {
	display:none !important;
}
.video-wrap :deep(.uni-video-bar),
.video-wrap :deep(.uni-video-cover-play-button),
.video-wrap :deep(.uni-video-toast) {
	display:none !important;
}
.poster-cover {
	position:absolute;
	inset:0;
	z-index:2;
	width:100%;
	height:420rpx;
	background:#0f172a;
}
.tap-play-layer {
	position:absolute;
	inset:0;
	z-index:3;
	display:flex;
	align-items:center;
	justify-content:center;
	background:linear-gradient(180deg, rgba(15,23,42,.08), rgba(15,23,42,.38));
	cursor:pointer;
}
.tap-play-button {
	width:92rpx;
	height:92rpx;
	border-radius:50%;
	display:flex;
	align-items:center;
	justify-content:center;
	padding-left:6rpx;
	box-sizing:border-box;
	background:rgba(255,255,255,.92);
	color:#1677ff;
	font-size:42rpx;
	font-weight:900;
	box-shadow:0 12rpx 34rpx rgba(15,23,42,.22);
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
.video-error-action {
	display:inline-flex;
	align-items:center;
	justify-content:center;
	height:52rpx;
	margin-top:16rpx;
	padding:0 22rpx;
	border-radius:999rpx;
	background:#9a3412;
	color:#fff;
	font-size:24rpx;
	font-weight:800;
}
.lesson-lock {
	position:absolute;
	inset:0;
	z-index:7;
	display:flex;
	flex-direction:column;
	align-items:center;
	justify-content:center;
	padding:30rpx;
	text-align:center;
	background:rgba(15,23,42,.86);
}
.lesson-lock-ico { font-size:64rpx; }
.lesson-lock-title { margin-top:16rpx; color:#fff; font-size:30rpx; font-weight:800; }
.lesson-lock-sub { margin-top:12rpx; max-width:520rpx; color:rgba(255,255,255,.82); font-size:24rpx; line-height:1.5; }
/* 控件短暂覆盖底部，播放时 3 秒无操作自动隐藏，避免挡住授课画面 */
.player-controls {
	position:absolute;
	left:0;
	right:0;
	bottom:0;
	z-index:6;
	padding:18rpx 20rpx;
	background:linear-gradient(180deg, rgba(15,23,42,0) 0%, rgba(15,23,42,.46) 42%, rgba(15,23,42,.82) 100%);
	opacity:1;
	transform:translateY(0);
	pointer-events:auto;
	transition:opacity .2s ease-out, transform .2s ease-out;
}
.player-controls.hidden {
	opacity:0;
	transform:translateY(18rpx);
	pointer-events:none;
}
.player-progress-track {
	position:relative;
	height:38rpx;
	display:flex;
	align-items:center;
	cursor:pointer;
	touch-action:none;
}
.player-progress-track::before {
	content:'';
	position:absolute;
	left:0;
	right:0;
	top:50%;
	height:8rpx;
	transform:translateY(-50%);
	border-radius:999rpx;
	background:rgba(255,255,255,.32);
}
.player-progress-fill {
	position:relative;
	z-index:1;
	height:8rpx;
	min-width:0;
	border-radius:999rpx;
	background:#ff4f55;
	box-shadow:0 0 12rpx rgba(255,79,85,.35);
}
.player-progress-thumb {
	position:absolute;
	right:-13rpx;
	top:50%;
	width:26rpx;
	height:26rpx;
	transform:translateY(-50%);
	border-radius:50%;
	background:#fff;
	border:5rpx solid #ff4f55;
	box-shadow:0 4rpx 12rpx rgba(0,0,0,.22);
}
.player-control-row {
	display:flex;
	align-items:center;
	gap:12rpx;
	min-height:56rpx;
}
.control-button {
	min-width:52rpx;
	height:48rpx;
	line-height:48rpx;
	text-align:center;
	border-radius:999rpx;
	background:rgba(255,255,255,.16);
	color:#fff;
	border:1rpx solid rgba(255,255,255,.3);
	font-size:22rpx;
	font-weight:800;
	cursor:pointer;
}
.play-button {
	font-size:24rpx;
}
.rate-button {
	min-width:66rpx;
}
.control-button.active,
.control-button.muted {
	background:rgba(22,119,210,.92);
	color:#fff;
	border-color:rgba(255,255,255,.55);
}
.volume-button {
	display:flex;
	align-items:center;
	justify-content:center;
	padding:0;
}
.speaker-icon {
	position:relative;
	width:34rpx;
	height:30rpx;
}
.speaker-core::before {
	content:'';
	position:absolute;
	left:2rpx;
	top:9rpx;
	width:10rpx;
	height:12rpx;
	border-radius:3rpx;
	background:#fff;
}
.speaker-core::after {
	content:'';
	position:absolute;
	left:10rpx;
	top:5rpx;
	width:0;
	height:0;
	border-top:10rpx solid transparent;
	border-bottom:10rpx solid transparent;
	border-right:16rpx solid #fff;
}
.speaker-wave {
	position:absolute;
	border:3rpx solid rgba(255,255,255,.92);
	border-left:0;
	border-top-color:transparent;
	border-bottom-color:transparent;
	border-radius:0 999rpx 999rpx 0;
}
.wave-one {
	right:4rpx;
	top:8rpx;
	width:9rpx;
	height:14rpx;
}
.wave-two {
	right:-2rpx;
	top:4rpx;
	width:16rpx;
	height:22rpx;
	opacity:.78;
}
.volume-button.muted .speaker-wave {
	display:none;
}
.volume-button.muted .speaker-icon::after {
	content:'';
	position:absolute;
	right:1rpx;
	top:2rpx;
	width:4rpx;
	height:28rpx;
	border-radius:999rpx;
	background:#fff;
	transform:rotate(45deg);
	box-shadow:0 0 0 2rpx rgba(22,119,210,.4);
}
.control-time {
	color:#fff;
	font-size:23rpx;
	font-weight:700;
	white-space:nowrap;
	text-shadow:0 1rpx 4rpx rgba(0,0,0,.35);
}
.time-sep {
	margin:0 6rpx;
	color:rgba(255,255,255,.6);
}
.control-spacer {
	flex:1;
}
.desktop-speed-wrap {
	position:relative;
}
.desktop-speed-menu {
	position:absolute;
	right:0;
	bottom:58rpx;
	width:118rpx;
	padding:8rpx 0;
	border-radius:14rpx;
	background:#fff;
	border:1rpx solid #dbe7f3;
	box-shadow:0 16rpx 36rpx rgba(15,23,42,.16);
}
.desktop-speed-item {
	height:46rpx;
	line-height:46rpx;
	text-align:center;
	color:#334155;
	font-size:23rpx;
	font-weight:750;
	cursor:pointer;
}
.desktop-speed-item.active {
	color:#1677d2;
	background:#eef6ff;
}

/* 本节内容 */
.section {
	display:flex; justify-content:space-between; align-items:flex-start;
	padding: 26rpx 30rpx 14rpx;
}
.section-left {
	display:flex;
	flex-direction:column;
	min-width:0;
}
.s-title { font-size:30rpx; color:#222; font-weight:800; }
.s-page { font-size:28rpx; color:#999; padding-top:2rpx; }

/* 本节章节内容 */
.content {
	position:relative;
	min-height: 360rpx;
}
.lesson-content-list {
	margin: 4rpx 24rpx 22rpx;
	border:1rpx solid #eef0f3;
	border-radius:16rpx;
	overflow:hidden;
	background:#fff;
	box-shadow:0 4rpx 12rpx rgba(15,23,42,.04);
}
.lesson-content-row {
	display:flex;
	align-items:center;
	min-height:86rpx;
	padding:16rpx 20rpx;
	border-top:1rpx solid #f1f4f8;
	cursor:pointer;
	box-sizing:border-box;
}
.lesson-content-row:first-child {
	border-top:0;
}
.lesson-content-row.active {
	background:#eef6ff;
}
.lesson-content-index {
	width:42rpx;
	height:42rpx;
	line-height:42rpx;
	text-align:center;
	border-radius:50%;
	background:#edf2f7;
	color:#64748b;
	font-size:23rpx;
	font-weight:800;
	margin-right:16rpx;
	flex-shrink:0;
}
.lesson-content-row.active .lesson-content-index {
	background:#1677d2;
	color:#fff;
}
.lesson-content-main {
	flex:1;
	min-width:0;
}
.lesson-content-title {
	color:#1f2937;
	font-size:26rpx;
	font-weight:800;
	white-space:nowrap;
	overflow:hidden;
	text-overflow:ellipsis;
}
.lesson-content-meta {
	margin-top:6rpx;
	color:#94a3b8;
	font-size:22rpx;
	white-space:nowrap;
	overflow:hidden;
	text-overflow:ellipsis;
}
.lesson-content-action {
	margin-left:18rpx;
	padding:8rpx 14rpx;
	border-radius:999rpx;
	background:#f3f6fb;
	color:#64748b;
	font-size:22rpx;
	font-weight:800;
	flex-shrink:0;
}
.lesson-content-row.active .lesson-content-action {
	background:#dbeafe;
	color:#1677d2;
}

/* 讲点卡 */
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
		max-width:var(--wk-app-width, 430px);
		margin:0 auto;
		box-shadow:0 0 0 1px #e5e7eb;
	}
	.video-wrap:fullscreen {
		width:100vw;
		height:100vh;
		background:#0f172a;
		display:flex;
		align-items:center;
		justify-content:center;
	}
	.video-wrap:fullscreen .video-player {
		width:100vw;
		height:100%;
		min-height:0;
	}
	.footer {
		left:50%;
		width:var(--wk-app-width, 430px);
		right:auto;
		transform:translateX(-50%);
	}
}
</style>

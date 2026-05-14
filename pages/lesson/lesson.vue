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
				:show-fullscreen-btn="true"
				:show-play-btn="true"
				:enable-progress-gesture="true"
				@loadedmetadata="onLoadedMeta"
				@timeupdate="onTimeUpdate"
				@ended="onEnded"
				@error="onVideoError"
			></video>
			<view class="video-error" v-if="videoError">
				<view class="video-error-title">视频暂时无法加载</view>
				<view class="video-error-sub">请检查网络，或稍后重新进入本讲。</view>
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
				<text class="rating-title">本节课程给你带来的收获</text>
				<text class="rating-state">{{ratingSaved ? '已评价' : (canRate ? '可打分' : '学习90%后可打分')}}</text>
			</view>
			<view class="star-row">
				<view class="star-item" v-for="option in ratingOptions" :key="option.value" :class="{active: currentRating >= option.value, disabled: !canRate}" @click="rateLesson(option.value)">
					<text class="star-icon">{{currentRating >= option.value ? '★' : '☆'}}</text>
					<text class="star-label">{{option.label}}</text>
				</view>
			</view>
			<view class="rating-desc">{{ratingText}}</view>
			<view class="rating-options">
				<view class="rating-option" v-for="option in ratingOptions" :key="option.label">{{option.label}}（{{option.text}}）</view>
			</view>
			<view class="rating-btn" :class="{disabled: !canRate}" @click="submitRating">{{ratingSaved ? '更新评价' : '提交评价'}}</view>
		</view>

		<view class="content">
			<view class="lesson-card-panel" v-if="lessonCard">
				<view class="lesson-card-title">{{lessonCard.title}}</view>
				<view class="lesson-card-item" v-for="(item, index) in lessonCard.items" :key="item">
					<view class="lesson-card-index">{{index + 1}}</view>
					<view class="lesson-card-text">{{item}}</view>
				</view>
			</view>
			<view class="next-fab">
				<text class="fab-arrow">→</text>
				<text class="fab-text">下一关</text>
			</view>
		</view>

		<!-- 底部 -->
		<view class="footer">
			<view class="card-btn" @click="showCard">
				<view class="card-ico">🗂</view>
				<text class="card-text">讲点卡</text>
			</view>
			<view class="prev-btn" :class="{active: prevTitle}" @click="goPrev">上一讲</view>
			<view class="next-btn active" @click="goNext">下一讲</view>
		</view>
	</view>
</template>

<script>
import { RATING_OPTIONS, getLessonRating, saveLessonRating } from '@/common/study-summary.js'
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
			progressSaved: false,
			lastSavedAt: 0,
			prevTitle: '',
			nextTitle: '',
			lessonCard: null,
			page: 1,
			pageTotal: 1,
			ratingOptions: RATING_OPTIONS,
			currentRating: 0,
			ratingSaved: false
		}
	},
	async onLoad(opts) {
		if (opts && opts.title) this.title = decodeURIComponent(opts.title);
		if (opts && opts.courseId) this.courseId = decodeURIComponent(opts.courseId);
		if (opts && opts.courseTitle) this.courseTitle = decodeURIComponent(opts.courseTitle);
		if (opts && opts.chapterTitle) this.chapterTitle = decodeURIComponent(opts.chapterTitle);
		this.currentRating = getLessonRating(this.title);
		this.ratingSaved = !!this.currentRating;
		await this.loadLesson();
		if (isLoggedIn()) await this.loadRemoteRating();
	},
	onUnload() {
		this.persistProgress(false);
	},
	computed: {
		canRate() {
			return Number(this.percent) >= 90;
		},
		ratingText() {
			const matched = this.ratingOptions.find(item => item.value === this.currentRating);
			if (!this.canRate) return '学习进度达到90%后才可以评价本节课';
			return matched ? `${matched.label}（${matched.text}）` : '请选择本节课的收获程度';
		}
	},
	methods: {
		async loadLesson() {
			try {
				const data = await getLessonVideo(this.title);
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
		async loadRemoteRating() {
			try {
				const data = await getLessonRatingApi(this.title);
				this.currentRating = data.rating || 0;
				this.ratingSaved = !!this.currentRating;
			} catch (err) {
				console.warn('评价接口不可用，使用本地评价', err);
			}
		},
		goBack() { uni.navigateBack({ fail:()=>{} }); },
		onLoadedMeta(e) {
			const duration = Number(e.detail && e.detail.duration) || this.durationSeconds;
			if (duration) {
				this.durationSeconds = duration;
				this.totalTime = this.formatTime(duration);
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
			this.persistProgress(true);
		},
		onVideoError() {
			this.videoError = true;
		},
		async persistProgress(ended) {
			if (!isLoggedIn() || !this.videoUrl) return;
			this.lastSavedAt = Date.now();
			try {
				await saveLessonProgress(this.title, {
					lessonTitle: this.title,
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
		showCard() {
			const items = this.lessonCard && this.lessonCard.items ? this.lessonCard.items.join('\n') : '暂无讲点卡';
			uni.showModal({ title: this.lessonCard ? this.lessonCard.title : '讲点卡', content: items, showCancel: false });
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
		toast(title) { uni.showToast({ title, icon:'none' }); },
		rateLesson(value) {
			if (!this.canRate) {
				uni.showToast({ title:'学习进度达到90%后才可以打分', icon:'none' });
				return;
			}
			this.currentRating = value;
			this.ratingSaved = false;
		},
		async submitRating() {
			if (!this.canRate) {
				uni.showToast({ title:'学习进度达到90%后才可以打分', icon:'none' });
				return;
			}
			if (!this.currentRating) {
				uni.showToast({ title:'请选择星级', icon:'none' });
				return;
			}
			if (isLoggedIn()) {
				try {
					await saveLessonRatingApi(this.title, this.currentRating, this.title, {
						courseId: this.courseId,
						courseTitle: this.courseTitle,
						chapterTitle: this.chapterTitle
					});
					saveLessonRating(this.title, this.currentRating);
					this.ratingSaved = true;
					uni.showToast({ title:'评价已保存', icon:'success' });
					return;
				} catch (err) {
					console.warn('评价接口不可用，保存到本地', err);
				}
			}
			if (saveLessonRating(this.title, this.currentRating)) {
				this.ratingSaved = true;
				uni.showToast({ title:'评价已保存', icon:'success' });
			}
		}
	}
}
</script>

<style lang="scss">
page { background:#fff; }
.page { min-height:100vh; background:#fff; padding-bottom:240rpx; }

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
	background:#111827;
}
.video-player {
	width:100%;
	height:420rpx;
	background:#000;
	display:block;
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
.star-item.disabled { opacity:.5; }
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
</style>

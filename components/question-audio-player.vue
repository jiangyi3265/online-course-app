<template>
	<view v-if="resolvedUrl" class="question-audio">
		<view class="question-audio-control">
			<view class="audio-play-btn" :class="{playing}" @click="togglePlay">{{ playing ? '暂停' : '播放' }}</view>
			<view class="audio-info">
				<view class="audio-title">听力音频</view>
				<view class="audio-time">{{ timeText }}</view>
			</view>
		</view>
	</view>
</template>

<script>
import { resolveMediaUrl } from '@/common/api.js'

export default {
	name: 'QuestionAudioPlayer',
	props: {
		src: {
			type: String,
			default: ''
		}
	},
	data() {
		return {
			audio: null,
			playing: false,
			currentTime: 0,
			duration: 0
		}
	},
	computed: {
		resolvedUrl() {
			return resolveMediaUrl(this.src)
		},
		timeText() {
			const current = this.formatTime(this.currentTime)
			const total = this.duration ? this.formatTime(this.duration) : '--:--'
			return `${current} / ${total}`
		}
	},
	watch: {
		resolvedUrl() {
			this.resetAudio()
		}
	},
	mounted() {
		this.createAudio()
	},
	beforeDestroy() {
		this.destroyAudio()
	},
	beforeUnmount() {
		this.destroyAudio()
	},
	methods: {
		createAudio() {
			if (!this.resolvedUrl || this.audio || !uni.createInnerAudioContext) return
			const audio = uni.createInnerAudioContext()
			audio.src = this.resolvedUrl
			audio.onPlay(() => {
				this.playing = true
			})
			audio.onPause(() => {
				this.playing = false
			})
			audio.onStop(() => {
				this.playing = false
			})
			audio.onEnded(() => {
				this.playing = false
				this.currentTime = 0
			})
			audio.onTimeUpdate(() => {
				this.currentTime = Number(audio.currentTime || 0)
				if (audio.duration) this.duration = Number(audio.duration || 0)
			})
			audio.onCanplay(() => {
				setTimeout(() => {
					if (audio && audio.duration) this.duration = Number(audio.duration || 0)
				}, 120)
			})
			audio.onError(() => {
				this.playing = false
				uni.showToast({ title: '音频加载失败', icon: 'none' })
			})
			this.audio = audio
		},
		togglePlay() {
			if (!this.audio) this.createAudio()
			if (!this.audio) return
			if (this.playing) {
				this.audio.pause()
			} else {
				this.audio.play()
			}
		},
		resetAudio() {
			this.destroyAudio()
			this.currentTime = 0
			this.duration = 0
			this.createAudio()
		},
		destroyAudio() {
			if (!this.audio) return
			this.audio.stop()
			this.audio.destroy()
			this.audio = null
			this.playing = false
		},
		formatTime(value = 0) {
			const seconds = Math.max(0, Math.floor(Number(value) || 0))
			const minute = Math.floor(seconds / 60)
			const second = seconds % 60
			return `${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`
		}
	}
}
</script>

<style lang="scss">
.question-audio {
	margin: 12rpx 0 16rpx;
	padding: 14rpx;
	border: 1rpx solid #e4ebf5;
	border-radius: 12rpx;
	background: #f8fbff;
	box-sizing: border-box;
}

.question-audio-control {
	width: 100%;
	min-height: 72rpx;
	display: flex;
	align-items: center;
	gap: 16rpx;
}

.audio-play-btn {
	flex-shrink: 0;
	min-width: 96rpx;
	height: 52rpx;
	line-height: 52rpx;
	text-align: center;
	border-radius: 26rpx;
	background: #1677ff;
	color: #fff;
	font-size: 24rpx;
	font-weight: 800;
}

.audio-play-btn.playing {
	background: #0f766e;
}

.audio-info {
	flex: 1;
	min-width: 0;
}

.audio-title {
	color: #172033;
	font-size: 25rpx;
	font-weight: 800;
}

.audio-time {
	margin-top: 4rpx;
	color: #64748b;
	font-size: 22rpx;
}
</style>

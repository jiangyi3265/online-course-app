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
import { resolveMediaUrl, isUsableMediaUrl } from '@/common/api.js'

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
			duration: 0,
			playRetrying: false
		}
	},
	computed: {
		resolvedUrl() {
			const resolved = resolveMediaUrl(this.src)
			return isUsableMediaUrl(resolved) ? resolved : ''
		},
		timeText() {
			const current = this.formatTime(this.currentTime)
			const total = this.safeSeconds(this.duration) ? this.formatTime(this.duration) : '--:--'
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
			if (!this.resolvedUrl || this.audio) return
			// #ifdef H5
			if (typeof Audio !== 'undefined') {
				const audio = new Audio()
				audio.preload = 'metadata'
				audio.src = this.resolvedUrl
				audio.addEventListener('play', () => { this.playing = true })
				audio.addEventListener('pause', () => { this.playing = false })
				audio.addEventListener('ended', () => {
					this.playing = false
					this.currentTime = 0
				})
				audio.addEventListener('timeupdate', () => {
					this.currentTime = this.safeSeconds(audio.currentTime)
					this.captureDuration(audio.duration)
				})
				audio.addEventListener('loadedmetadata', () => {
					this.captureDuration(audio.duration)
				})
				audio.addEventListener('durationchange', () => {
					this.captureDuration(audio.duration)
				})
				audio.addEventListener('canplay', () => {
					this.captureDuration(audio.duration)
				})
				audio.addEventListener('error', () => {
					this.playing = false
					uni.showToast({ title: '音频加载失败', icon: 'none' })
				})
				audio.load()
				this.audio = audio
				return
			}
			// #endif
			if (!uni.createInnerAudioContext) return
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
				this.currentTime = this.safeSeconds(audio.currentTime)
				this.captureDuration(audio.duration)
			})
			audio.onCanplay(() => {
				setTimeout(() => {
					if (audio) this.captureDuration(audio.duration)
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
				this.playAudio()
			}
		},
		playAudio() {
			if (!this.audio || !this.audio.play) return
			try {
				const result = this.audio.play()
				if (result && typeof result.catch === 'function') {
					result.catch(() => this.retryPlayOnce())
				}
			} catch (err) {
				this.retryPlayOnce()
			}
		},
		retryPlayOnce() {
			if (this.playRetrying) {
				uni.showToast({ title: '音频暂时无法播放', icon: 'none' })
				return
			}
			this.playRetrying = true
			this.resetAudio()
			setTimeout(() => {
				try {
					if (this.audio && this.audio.play) this.audio.play()
				} catch (err) {
					uni.showToast({ title: '音频暂时无法播放', icon: 'none' })
				}
				setTimeout(() => { this.playRetrying = false }, 300)
			}, 80)
		},
		resetAudio() {
			this.destroyAudio()
			this.currentTime = 0
			this.duration = 0
			this.createAudio()
		},
		destroyAudio() {
			if (!this.audio) return
			if (this.audio.stop) this.audio.stop()
			if (this.audio.pause) this.audio.pause()
			if (this.audio.destroy) this.audio.destroy()
			this.audio = null
			this.playing = false
		},
		formatTime(value = 0) {
			const seconds = Math.max(0, Math.floor(this.safeSeconds(value)))
			const minute = Math.floor(seconds / 60)
			const second = seconds % 60
			return `${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`
		},
		safeSeconds(value = 0) {
			const number = Number(value)
			return Number.isFinite(number) && number > 0 ? number : 0
		},
		captureDuration(value = 0) {
			const duration = this.safeSeconds(value)
			if (duration > 0) this.duration = duration
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

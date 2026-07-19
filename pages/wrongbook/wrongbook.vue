<template>
	<view class="page">
		<view class="nav">
			<view class="back" @click="goBack">‹</view>
			<view class="nav-title">错题与巩固</view>
		</view>

		<view class="course-summary">
			<view class="summary-main">
				<view class="summary-line"><text>共计 {{summary.chapterCount || course.chapterCount || 0}} 节</text></view>
				<view class="summary-line"><text>已学节数：{{summary.learnedChapterCount || course.learnedChapterCount || 0}} 节</text><text>已学时长：{{summary.learnedDuration || course.learnedDuration || '--'}}</text></view>
			</view>
		</view>

		<view class="action-grid">
			<view class="action-card" :class="{active: mode === 'review'}" @click="setMode('review')">
				<view class="action-mark">温</view>
				<view>
					<view class="action-title">温习错题</view>
					<view class="action-sub">按来源查看解析与正确答案</view>
				</view>
			</view>
			<view class="action-card" :class="{active: mode === 'records'}" @click="setMode('records')">
				<view class="action-mark records">记</view>
				<view>
					<view class="action-title">查看测试记录</view>
					<view class="action-sub">章节扫雷、复习测试、真题讲练、错题重练记录</view>
				</view>
			</view>
			<view class="action-card" :class="{active: mode === 'retry'}" @click="setMode('retry')">
				<view class="action-mark retry">练</view>
				<view>
					<view class="action-title">错题重练</view>
					<view class="action-sub">再次测试错题，巩固解题技巧</view>
				</view>
			</view>
			<view class="action-card" :class="{active: mode === 'weak'}" @click="setMode('weak')">
				<view class="action-mark weak">短</view>
				<view>
					<view class="action-title">短板题库</view>
					<view class="action-sub">多次重练仍未掌握的题型</view>
				</view>
			</view>
		</view>

		<view class="summary-strip">
			<view class="summary-item total" :class="{active: mode === 'review' && statusFilter === 'all'}" @click="setReviewStatus('all')">
				<text>总收录</text>
				<strong>{{summaryTotal}}</strong>
				<small>道错题</small>
			</view>
			<view class="summary-item" :class="{active: mode === 'review' && statusFilter === 'pending'}" @click="setReviewStatus('pending')">
				<text>待温习</text>
				<strong>{{pendingWrongCount}}</strong>
				<small>道</small>
			</view>
			<view class="summary-item" :class="{active: mode === 'review' && statusFilter === 'mastered'}" @click="setReviewStatus('mastered')">
				<text>已掌握</text>
				<strong>{{masteredWrongCount}}</strong>
				<small>道</small>
			</view>
			<view class="summary-item weak-summary" :class="{active: mode === 'weak'}" @click="setMode('weak')">
				<text>短板</text>
				<strong>{{weakWrongCount}}</strong>
				<small>道</small>
			</view>
		</view>

		<view class="source-filter">
			<view class="source-chip" v-for="item in sources" :key="item" :class="{active: source === item}" @click="setSource(item)">{{item}}</view>
		</view>

		<view v-if="mode === 'review'" class="panel">
			<view class="question-list-anchor"></view>
			<view class="empty" v-if="visibleWrongList.length === 0">暂无错题，完成测试后会自动收录到这里。</view>
			<view class="question-card" v-for="item in visibleWrongList" :key="item.id">
				<view class="source-title">错题来源：</view>
				<view class="tag-row">
					<view class="tag" v-for="tag in mediaList(item.sourceTags)" :key="tag">{{tag}}</view>
					<view class="tag latest-tag">最新收录时间：{{formatFullTime(item.updatedAt || item.createTime)}}</view>
				</view>
				<math-rich-text class="stem" :text="item.stem || item.question || item.title" />
				<question-audio-player v-if="stemAudio(item)" :src="stemAudio(item)" />
				<image v-for="(url, imageIndex) in questionImages(item)" :key="`${item.id}-stem-${imageIndex}`" v-show="!item.stemImageError" class="question-image" :src="url" mode="aspectFit" @click="previewMedia(url, questionImages(item))" @error.stop="onQuestionImageError(item)" />
				<view v-if="item.stemImageError" class="image-fallback" @click="retryQuestionImage(item)">图片加载失败，点此重试</view>
				<view class="option-list" v-if="showOptions(item)">
					<view class="option-row" v-for="(option, optionIndex) in item.options" :key="optionIndex">
						<math-rich-text :text="`${optionLetter(optionIndex)}. ${option || '图片选项'}`" />
						<image v-if="optionImage(item, optionIndex)" class="option-image" :src="optionImage(item, optionIndex)" mode="aspectFit" @click="previewMedia(optionImage(item, optionIndex))" />
					</view>
				</view>
				<math-rich-text class="answer ok" :text="'正确答案：' + (item.answerText || optionText(item, item.answer || item.correctAnswer))" />
				<image v-for="(url, imageIndex) in referenceAnswerImages(item)" :key="`${item.id}-answer-${imageIndex}`" class="answer-image" :src="url" mode="aspectFit" @click="previewMedia(url, referenceAnswerImages(item))" />
				<math-rich-text class="answer bad" :text="'我的答案：' + (item.selectedText || optionText(item, item.selected || item.myAnswer))" />
				<analysis-viewer :item="item" :text="item.analysis || item.explain" />
				<view class="row-actions">
					<view class="state" :class="{done:item.mastered}">{{item.mastered ? '已掌握' : '未掌握'}}</view>
					<view class="mark-btn" :class="{done:item.mastered}" @click="mark(item)">{{item.mastered ? '已标记' : '标记掌握'}}</view>
					<view class="fav-btn" @click="favoriteWrong(item)">加入我的收藏</view>
				</view>
			</view>
		</view>

		<view v-if="mode === 'records'" class="panel">
			<view class="record-total">累计测试：{{records.total || 0}} 次</view>
			<view class="record-courses">
				<text v-for="item in records.courseCounts || []" :key="item.label || item.courseName">{{courseCountLabel(item)}}</text>
			</view>
			<view class="empty" v-if="recordList.length === 0">暂无测试记录。</view>
			<view class="record-card" v-for="record in recordList" :key="record.id">
				<view class="record-head" @click="toggleRecord(record)">
					<view>
						<view class="record-time">完成时间 {{formatFullTime(record.completedAt || record.time || record.createTime)}}</view>
						<view class="record-name">{{record.courseName || record.courseTitle || record.title || '测试记录'}} {{record.sourceType || record.source || ''}}</view>
						<view class="record-meta">共 {{record.total || 0}} 题，答错 {{record.wrongCount || 0}} 题</view>
					</view>
					<view class="record-score">得分 {{record.score || 0}}/{{record.totalScore || 100}} 分</view>
				</view>
				<view class="record-detail" v-if="activeRecordId === record.id">
					<view class="detail-row" v-for="(detail, index) in mediaList(record.questions || record.details)" :key="detail.id || index">
						<view class="detail-index">第 {{index + 1}} 题 · <text :class="detail.correct ? 'detail-correct' : 'detail-wrong'">{{detail.correct ? '正确' : '错误'}}</text></view>
						<math-rich-text class="detail-stem" :text="detailStem(detail)" />
						<view class="detail-actions" v-if="detailAnswerImages(detail).length">
							<button size="mini" @click="previewDetailImage(detail)">查看图片</button>
						</view>
						<image v-if="detailAnswerImages(detail)[0]" class="answer-image" :src="detailAnswerImages(detail)[0]" mode="aspectFit" @click="previewDetailImage(detail)" />
						<math-rich-text class="detail-answer ok" :text="'正确答案：' + (detail.correctAnswerText || detail.correctAnswer || '--')" />
						<math-rich-text class="detail-answer bad" :text="'我的答案：' + detailMyAnswer(detail)" />
					</view>
				</view>
			</view>
		</view>

		<view v-if="mode === 'retry'" class="panel">
			<view class="panel-title">错题重练</view>
			<view class="retry-select">
				<view v-for="count in [5,10,15]" :key="count" :class="{active: retryCount === count}" @click="setRetryCount(count)">随机 {{count}} 道题</view>
			</view>
			<view class="retry-meta">当前可练：{{retryPaper.availableCount || 0}} 道，实际组卷：{{retryPaper.count || 0}} 道</view>
			<button class="primary-btn" @click="startRetry">开始错题重练</button>
			<view class="question-card" v-for="item in retryPreview" :key="item.id">
				<view class="source-title">温习错题来源：</view>
				<math-rich-text class="stem" :text="item.stem || item.question || item.title" />
			</view>
		</view>

		<view v-if="mode === 'weak'" class="panel">
			<view class="empty" v-if="visibleWeakList.length === 0">暂无短板题，多次重练错误后会自动加入。</view>
			<view class="question-card" v-for="item in visibleWeakList" :key="item.id">
				<view class="source-title">题目来源：</view>
				<view class="tag-row">
					<view class="tag" v-for="tag in mediaList(item.sourceTags)" :key="tag">{{tag}}</view>
				</view>
				<math-rich-text class="stem" :text="item.stem || item.question || item.title" />
				<question-audio-player v-if="stemAudio(item)" :src="stemAudio(item)" />
				<image v-for="(url, imageIndex) in questionImages(item)" :key="`${item.id}-weak-stem-${imageIndex}`" v-show="!item.stemImageError" class="question-image" :src="url" mode="aspectFit" @click="previewMedia(url, questionImages(item))" @error.stop="onQuestionImageError(item)" />
				<view v-if="item.stemImageError" class="image-fallback" @click="retryQuestionImage(item)">图片加载失败，点此重试</view>
				<math-rich-text class="answer ok" :text="'正确答案：' + (item.answerText || optionText(item, item.answer || item.correctAnswer))" />
				<image v-for="(url, imageIndex) in referenceAnswerImages(item)" :key="`${item.id}-weak-answer-${imageIndex}`" class="answer-image" :src="url" mode="aspectFit" @click="previewMedia(url, referenceAnswerImages(item))" />
				<analysis-viewer :item="item" :text="item.analysis || item.explain" />
			</view>
		</view>
	</view>
</template>

<script>
import {
	decodeRouteText,
	getWeakWrongBook,
	getWrongBook,
	getWrongBookRecords,
	getWrongBookSummary,
	getWrongRetry,
	isUsableMediaUrl,
	normalizeMediaList,
	markWrongMastered,
	resolveMediaList,
	resolveMediaUrl,
	toggleFavorite
} from '@/common/api.js'
import { safeNavigateBack } from '@/common/navigation.js'
import AnalysisViewer from '@/components/analysis-viewer.vue'
import MathRichText from '@/components/math-rich-text.vue'
import QuestionAudioPlayer from '@/components/question-audio-player.vue'

export default {
	components: { AnalysisViewer, MathRichText, QuestionAudioPlayer },
	data() {
		return {
			mode: 'review',
			source: '全部',
			statusFilter: 'all',
			sources: ['全部', '最新错题', '章节扫雷', '复习测试', '真题讲练', '错题重练'],
			courseId: 'gk-math-full',
			studentId: '',
			readOnly: false,
			course: {},
			summary: {},
			wrongList: [],
			weakList: [],
			records: { total: 0, courseCounts: [], records: [] },
			retryPaper: { questions: [], sourceWrongIds: [], availableCount: 0, count: 0 },
			retryCount: 5,
			activeRecordId: ''
		}
	},
	computed: {
		recordList() {
			return this.mediaList(this.records.records || this.records.list)
		},
		retryPreview() {
			return this.mediaList(this.retryPaper.questions).slice(0, 3)
		},
		summaryTotal() {
			return Number(this.summary.total || this.summary.totalWrong || this.wrongList.length || 0)
		},
		masteredWrongCount() {
			return Number(this.summary.mastered || this.wrongList.filter(item => item.mastered).length || 0)
		},
		pendingWrongCount() {
			return Number(this.summary.pending || Math.max(this.summaryTotal - this.masteredWrongCount, 0))
		},
		weakWrongCount() {
			return Number(this.summary.weak || this.summary.weakCount || this.weakList.length || 0)
		},
		visibleWrongList() {
			return this.scopeCourseItems(this.wrongList).filter(item => this.statusMatched(item))
		},
		visibleWeakList() {
			return this.scopeCourseItems(this.weakList)
		}
	},
	onLoad(query = {}) {
		this.courseId = decodeRouteText(query.courseId || query.courseid || this.courseId)
		this.studentId = decodeRouteText(query.studentId || query.userId || '')
		this.readOnly = query.readonly === '1' || query.readonly === 'true' || query.readOnly === '1' || query.readOnly === 'true'
		this.course.title = decodeRouteText(query.title || '')
		this.loadSummary()
		this.loadCurrent()
	},
	methods: {
		async loadSummary() {
			try {
				const data = await getWrongBookSummary(this.courseId, this.studentId)
				this.summary = data || {}
				this.course = { ...this.course, ...(data.course || data.courseInfo || {}) }
			} catch (err) {}
		},
		async loadCurrent() {
			if (this.mode === 'review') return this.loadWrongBook()
			if (this.mode === 'records') return this.loadRecords()
			if (this.mode === 'weak') return this.loadWeak()
			if (this.mode === 'retry') return this.loadRetry()
		},
		async loadWrongBook() {
			try {
				this.wrongList = this.scopeCourseItems(await getWrongBook(this.source, this.courseId, this.studentId))
			} catch (err) {
				this.wrongList = []
			}
		},
		async loadRecords() {
			try {
				this.records = this.scopeCourseRecords(await getWrongBookRecords(this.source, this.courseId, this.studentId))
				const first = this.recordList[0]
				this.activeRecordId = first ? first.id : ''
			} catch (err) {
				this.records = { total: 0, courseCounts: [], records: [] }
			}
		},
		async loadWeak() {
			try {
				this.weakList = this.scopeCourseItems(await getWeakWrongBook(this.source, this.courseId, this.studentId))
			} catch (err) {
				this.weakList = []
			}
		},
		async loadRetry() {
			try {
				this.retryPaper = await getWrongRetry(this.retryCount, this.source, this.courseId, this.studentId)
			} catch (err) {
				this.retryPaper = { questions: [], sourceWrongIds: [], availableCount: 0, count: 0 }
			}
		},
		setMode(mode) {
			this.mode = mode
			this.activeRecordId = ''
			this.loadCurrent()
		},
		setSource(source) {
			this.source = source
			this.loadCurrent()
		},
		setReviewStatus(status) {
			this.mode = 'review'
			this.statusFilter = status
			this.loadWrongBook()
		},
		setRetryCount(count) {
			this.retryCount = count
			this.loadRetry()
		},
		startRetry() {
			if (this.readOnly) {
				uni.showToast({ title: '只读查看，不能开始练习', icon: 'none' })
				return
			}
			if (!this.retryPaper.count && !this.retryPaper.availableCount) {
				uni.showToast({ title: '当前没有可重练的错题', icon: 'none' })
				return
			}
			uni.navigateTo({
				url: `/pages/practice/practice?type=wrongRetry&count=${this.retryCount}&source=${encodeURIComponent(this.source)}&courseId=${encodeURIComponent(this.courseId)}&title=${encodeURIComponent('错题重练')}`
			})
		},
		jumpToWeakQuestions() {
			this.mode = 'weak'
			this.loadWeak()
		},
		scopeCourseItems(list = []) {
			const items = Array.isArray(list) ? list : (list.records || list.list || list.questions || [])
			return items.filter(item => this.sameCourse(item))
		},
		scopeCourseRecords(data = {}) {
			const records = this.mediaList(data.records || data.list).filter(item => this.sameCourse(item))
			return { ...data, records, total: data.total || records.length }
		},
		sameCourse(item = {}) {
			const id = item.courseId || item.courseID || item.course_id || item.course?.id || ''
			return !this.courseId || !id || id === this.courseId
		},
		statusMatched(item = {}) {
			if (this.statusFilter === 'mastered') return !!item.mastered
			if (this.statusFilter === 'pending') return !item.mastered
			return true
		},
		courseCountLabel(item = {}) {
			return `${item.label || item.courseName || item.name || '课程'}：${item.value || item.count || 0} 次`
		},
		async mark(item) {
			if (this.readOnly) {
				uni.showToast({ title: '只读查看，不能修改掌握状态', icon: 'none' })
				return
			}
			try {
				await markWrongMastered(item.id)
				item.mastered = true
				this.loadSummary()
			} catch (err) {
				uni.showToast({ title: err.message || '标记失败', icon: 'none' })
			}
		},
		async favoriteWrong(item) {
			if (this.readOnly) {
				uni.showToast({ title: '只读查看，不能修改收藏', icon: 'none' })
				return
			}
			const targetId = String(item.questionId || item.targetId || item.rawQuestionId || item.id || '').trim()
			if (!targetId) {
				uni.showToast({ title: '题目编号缺失，暂时无法收藏', icon: 'none' })
				return
			}
			try {
				await toggleFavorite({
					type: 'question',
					targetId,
					action: 'add',
					title: item.stem || item.question || item.title || '',
					courseId: item.courseId || this.courseId
				})
				item.favorited = true
				uni.showToast({ title: '已加入收藏', icon: 'success' })
			} catch (err) {
				uni.showToast({ title: err.message || '收藏失败', icon: 'none' })
			}
		},
		toggleRecord(record) {
			this.activeRecordId = this.activeRecordId === record.id ? '' : record.id
		},
		detailStem(detail = {}) {
			const parentStem = detail.parentStem || detail.parentQuestion || ''
			const stem = detail.stem || detail.question || detail.title || ''
			return parentStem && stem ? `${parentStem}\n小题：${stem}` : (stem || parentStem)
		},
		detailMyAnswer(detail = {}) {
			if (detail.skipped) return '暂不上传'
			return detail.myAnswerText || detail.selectedText || detail.myAnswer || detail.selected || '--'
		},
		detailAnswerImages(detail = {}) {
			return resolveMediaList([
				detail.studentAnswerImages,
				detail.studentAnswerImageUrl,
				detail.answerImages,
				detail.images,
				detail.imageUrls,
				detail.uploadImages,
				detail.selfReviewImages,
				detail.photoUrls,
				detail.photos,
				detail.selfReviewImageUrl
			])
		},
		previewDetailImage(detail) {
			const urls = this.detailAnswerImages(detail)
			if (!urls.length) return
			uni.previewImage({ urls, current: urls[0] })
		},
		mediaUrl(url) {
			const media = resolveMediaUrl(url)
			return media && isUsableMediaUrl(media) ? media : ''
		},
		mediaList(value) {
			return normalizeMediaList(value)
		},
		stemAudio(item = {}) {
			return this.mediaUrl(item.audioUrl || item.stemAudio || item.listenAudio || '')
		},
		onQuestionImageError(item) {
			this.$set ? this.$set(item, 'stemImageError', true) : (item.stemImageError = true)
		},
		retryQuestionImage(item) {
			item.stemImageError = false
		},
		questionImages(item = {}) {
			return resolveMediaList([item.stemImageUrl, item.questionImageUrl, item.stemImage, item.imageUrl, item.imageUrls, item.images])
		},
		referenceAnswerImages(item = {}) {
			return resolveMediaList([item.answerImageUrl, item.answerImageUrls, item.correctAnswerImageUrl, item.correctAnswerImages])
		},
		previewMedia(url, urls = []) {
			const media = this.mediaUrl(url)
			const list = resolveMediaList(urls && urls.length ? urls : [media])
			if (media && isUsableMediaUrl(media) && list.length) uni.previewImage({ urls: list, current: media })
		},
		showOptions(item = {}) {
			return this.mediaList(item.options).length > 0
		},
		optionLetter(index) {
			return String.fromCharCode(65 + index)
		},
		optionText(item = {}, value = '') {
			const text = String(value || '')
			const index = /^[A-D]$/i.test(text) ? text.toUpperCase().charCodeAt(0) - 65 : -1
			const options = this.mediaList(item.options)
			return index >= 0 && options[index] ? `${text.toUpperCase()}. ${options[index]}` : (text || '--')
		},
		optionImage(item = {}, index) {
			const image = this.mediaList([item.optionImageUrls, item.optionImages, item.optionImageUrl])[index]
			const media = image ? this.mediaUrl(image) : ''
			return media && isUsableMediaUrl(media) ? media : ''
		},
		formatFullTime(value) {
			if (!value) return '--'
			const date = new Date(value)
			if (Number.isNaN(date.getTime())) return String(value).replace('T', ' ').slice(0, 19)
			const pad = n => String(n).padStart(2, '0')
			return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
		},
		goBack() {
			safeNavigateBack('/pages/member/member')
		}
	}
}
</script>

<style lang="scss">
.page {
	min-height: 100vh;
	background: #f4f7fb;
	color: #172033;
	padding: 0 24rpx 40rpx;
	box-sizing: border-box;
}
.nav {
	position: sticky;
	top: 0;
	z-index: 20;
	height: 96rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	background: #fff;
	margin: 0 -24rpx 24rpx;
	border-bottom: 1rpx solid #e7edf5;
}
.back {
	position: absolute;
	left: 26rpx;
	font-size: 48rpx;
	width: 72rpx;
	height: 72rpx;
	line-height: 68rpx;
	text-align: center;
}
.nav-title {
	font-size: 34rpx;
	font-weight: 800;
}
.course-summary,
.panel,
.question-card,
.record-card {
	background: #fff;
	border-radius: 18rpx;
	border: 1rpx solid #e4ebf4;
	box-shadow: 0 10rpx 30rpx rgba(20, 50, 90, .05);
}
.course-summary {
	padding: 24rpx;
	margin-bottom: 22rpx;
}
.summary-line {
	display: flex;
	gap: 26rpx;
	flex-wrap: wrap;
	font-size: 28rpx;
	font-weight: 700;
	margin-bottom: 10rpx;
}
.action-grid {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 18rpx;
	margin-bottom: 18rpx;
}
.action-card {
	min-height: 154rpx;
	padding: 24rpx;
	display: flex;
	gap: 18rpx;
	background: #fff;
	border: 1rpx solid #e4ebf4;
	border-radius: 18rpx;
	box-sizing: border-box;
}
.action-card.active {
	border-color: #2b7cff;
	background: #eef6ff;
}
.action-mark {
	flex: 0 0 44rpx;
	height: 44rpx;
	border-radius: 12rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	background: #e8f1ff;
	color: #2077ff;
	font-weight: 800;
}
.records { color: #667085; background: #f2f4f7; }
.retry { color: #009966; background: #e8fff5; }
.weak { color: #c86a1d; background: #fff3e8; }
.action-title {
	font-size: 30rpx;
	font-weight: 800;
	line-height: 1.25;
}
.action-sub {
	margin-top: 10rpx;
	color: #667085;
	font-size: 24rpx;
	line-height: 1.45;
}
.summary-strip {
	display: grid;
	grid-template-columns: repeat(4, minmax(0, 1fr));
	gap: 8rpx;
	background: #fff;
	border-radius: 18rpx;
	padding: 10rpx;
	margin-bottom: 14rpx;
}
.summary-item {
	min-width: 0;
	min-height: 86rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	border-radius: 12rpx;
	background: #f7f9fc;
	border: 1rpx solid transparent;
	overflow: hidden;
}
.summary-item.active {
	border-color: #2b7cff;
	background: #eef6ff;
}
.summary-item.total {
	background: #eef7ff;
	border-color: #c9e3fb;
}
.summary-item.weak-summary {
	background: #fff7ed;
	border-color: #f4d8b8;
}
.summary-item.weak-summary text,
.summary-item.weak-summary strong {
	color: #c45f13;
}
.summary-item.weak-summary.active {
	background: #fff2e2;
	border-color: #dc7a2f;
}
.summary-item text {
	color: #697386;
	font-size: 20rpx;
	font-weight: 700;
	max-width: 100%;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}
.summary-item strong {
	font-size: 32rpx;
	line-height: 1.05;
	margin-top: 4rpx;
}
.summary-item small {
	color: #697386;
	font-size: 18rpx;
	margin-top: 2rpx;
	white-space: nowrap;
}
.source-filter {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 14rpx;
	margin-bottom: 18rpx;
}
.source-chip {
	height: 68rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	background: #fff;
	border: 1rpx solid #e4ebf4;
	border-radius: 12rpx;
	font-weight: 700;
}
.source-chip.active {
	background: #2578ff;
	color: #fff;
}
.panel {
	padding: 18rpx;
	margin-bottom: 20rpx;
}
.panel-title,
.source-title,
.record-total {
	font-size: 30rpx;
	font-weight: 800;
	margin-bottom: 14rpx;
}
.empty {
	padding: 36rpx 20rpx;
	text-align: center;
	color: #667085;
}
.question-card {
	padding: 22rpx;
	margin-bottom: 18rpx;
}
.tag-row {
	display: flex;
	gap: 10rpx;
	flex-wrap: wrap;
	margin-bottom: 18rpx;
}
.tag {
	padding: 8rpx 14rpx;
	border-radius: 8rpx;
	background: #eef5ff;
	color: #1769e0;
	font-size: 24rpx;
	font-weight: 700;
}
.latest-tag {
	color: #b42318;
	background: #fff1f3;
}
.stem {
	display: block;
	font-size: 32rpx;
	font-weight: 800;
	line-height: 1.55;
	margin-bottom: 18rpx;
}
.question-image,
.answer-image {
	width: 100%;
	min-height: 260rpx;
	max-height: 540rpx;
	background: #eef2f7;
	border-radius: 12rpx;
	margin: 12rpx 0;
}
.image-fallback {
	padding: 26rpx;
	border-radius: 12rpx;
	background: #fff7ed;
	color: #c2410c;
	font-weight: 700;
}
.option-list {
	border: 1rpx solid #e4ebf4;
	border-radius: 12rpx;
	overflow: hidden;
	margin-bottom: 16rpx;
}
.option-row {
	padding: 18rpx;
	border-bottom: 1rpx solid #edf2f7;
}
.option-row:last-child {
	border-bottom: 0;
}
.option-image {
	width: 100%;
	height: 180rpx;
	margin-top: 10rpx;
	background: #f3f6fa;
}
.answer,
.detail-answer {
	display: block;
	margin: 10rpx 0;
	font-size: 28rpx;
	font-weight: 700;
}
.ok { color: #00875a; }
.bad { color: #d92d20; }
.row-actions {
	display: grid;
	grid-template-columns: repeat(3, minmax(0, 1fr));
	gap: 10rpx;
	margin-top: 14rpx;
}
.row-actions view,
.primary-btn,
.detail-actions button {
	height: 58rpx;
	min-width: 0;
	border-radius: 10rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	font-weight: 800;
	font-size: 23rpx;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}
.state { background: #f2f4f7; }
.state.done { background: #e8fff5; color: #00875a; }
.mark-btn { background: #e8f1ff; color: #1769e0; }
.mark-btn.done { background: #f2f4f7; color: #667085; }
.fav-btn { background: #e7fff4; color: #00875a; }
.record-courses {
	display: flex;
	gap: 12rpx;
	flex-wrap: wrap;
	color: #667085;
	margin-bottom: 16rpx;
}
.record-card {
	padding: 20rpx;
	margin-bottom: 16rpx;
}
.record-head {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12rpx;
}
.record-time {
	color: #667085;
	font-size: 24rpx;
}
.record-meta { margin-top:8rpx; color:#667085; font-size:23rpx; }
.record-name,
.record-score {
	font-size: 28rpx;
	font-weight: 800;
}
.record-score {
	color: #1769e0;
	white-space: nowrap;
}
.detail-row {
	padding-top: 20rpx;
	border-top: 1rpx solid #edf2f7;
	margin-top: 20rpx;
}
.detail-index {
	font-weight: 800;
	margin-bottom: 10rpx;
}
.detail-correct { color:#00875a; }
.detail-wrong { color:#d92d20; }
.detail-actions {
	display: flex;
	gap: 12rpx;
	margin: 12rpx 0;
}
.retry-select {
	display: grid;
	grid-template-columns: repeat(3, minmax(0, 1fr));
	gap: 12rpx;
	margin-bottom: 18rpx;
}
.retry-select view {
	height: 70rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 12rpx;
	background: #f2f4f7;
	font-weight: 800;
}
.retry-select view.active,
.primary-btn {
	background: #2578ff;
	color: #fff;
}
.retry-meta {
	color: #667085;
	margin-bottom: 18rpx;
}
</style>

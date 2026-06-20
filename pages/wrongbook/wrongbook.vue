<template>
	<view class="page">
		<view class="nav">
			<view class="back" @click="goBack">‹</view>
			<view class="nav-title">错题与巩固</view>
		</view>

		<view class="study-band" v-if="false">
			<view class="band-row">
				<view>
					<view class="band-label">共计 {{course.totalLessons || 0}} 节，总时长：{{course.totalDuration || '--'}}</view>
					<view class="band-sub">已学节数：{{course.readStudyCount || 0}} 节，已学时长：{{course.readDuration || '00小时00分'}}</view>
				</view>
				<view class="band-stats">
					<view class="band-total">共收录错题：{{summary.total || 0}}道</view>
					<view class="band-score">{{summary.pending || 0}}<text>待巩固</text></view>
				</view>
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

		<view class="source-filter">
			<view
				class="source-chip"
				v-for="item in sources"
				:key="item"
				:class="{active: source === item}"
				@click="setSource(item)"
			>{{item}}</view>
		</view>

		<view v-if="mode === 'review'">
			<view class="status-panel">
				<view class="status-item" :class="{active: statusFilter === 'pending'}" @click="setStatusFilter('pending')">
					<text>待温习</text><text class="status-num">{{summary.pending || 0}}</text><text class="status-unit">道</text>
				</view>
				<view class="status-item" :class="{active: statusFilter === 'mastered'}" @click="setStatusFilter('mastered')">
					<text>已掌握</text><text class="status-num">{{summary.mastered || 0}}</text><text class="status-unit">道</text>
				</view>
				<view class="status-item" :class="{active: statusFilter === 'weak'}" @click="setStatusFilter('weak')">
					<text>短板</text><text class="status-num">{{summary.weak || 0}}</text><text class="status-unit">道</text>
				</view>
			</view>
			<view class="empty" v-if="visibleWrongList.length === 0">暂无错题，先完成一次测试后这里会自动收录</view>
			<view class="question-card" v-for="item in visibleWrongList" :key="item.id">
				<view class="source-title">错题来源：</view>
				<view class="tag-row">
					<view class="tag" v-for="tag in item.sourceTags" :key="tag">{{tag}}</view>
					<view class="tag latest-tag">最新收录时间：{{formatFullTime(item.updatedAt)}}</view>
				</view>
				<math-rich-text class="stem" :text="item.stem" />
				<question-audio-player :src="stemAudio(item)" />
				<image v-if="item.stemImageUrl" class="question-image" :src="item.stemImageUrl" mode="aspectFit" @click="previewMedia(item.stemImageUrl)" />
				<view class="option-list" v-if="showOptions(item)">
					<view class="option-row" v-for="(option, optionIndex) in item.options" :key="optionIndex">
						<math-rich-text :text="`${optionLetter(optionIndex)}. ${option || '图片选项'}`" />
						<image v-if="optionImage(item, optionIndex)" class="option-image" :src="optionImage(item, optionIndex)" mode="aspectFit" @click="previewMedia(optionImage(item, optionIndex))" />
					</view>
				</view>
				<math-rich-text class="answer ok" :text="'正确答案：' + (item.answerText || optionText(item, item.answer))" />
				<math-rich-text class="answer bad" :text="'我的答案：' + (item.selectedText || optionText(item, item.selected))" />
				<analysis-viewer :item="item" :text="item.analysis" />
				<view class="row-actions">
					<view class="state" :class="{done:item.mastered}">{{item.mastered ? '已掌握' : '未掌握'}}</view>
					<view class="mark-btn" :class="{done:item.mastered}" @click="mark(item)">{{item.mastered ? '已标记' : '标记掌握'}}</view>
					<view class="fav-btn" @click="favoriteWrong(item)">加入我的收藏</view>
				</view>
			</view>
		</view>

		<view v-if="mode === 'records'">
			<view class="record-summary">
				<view class="record-total">累计测试：{{records.total || 0}} 次</view>
				<view class="record-subjects">
					<text v-for="item in records.courseCounts" :key="item.label">{{item.label}}：{{item.value}} 次</text>
				</view>
			</view>
			<view class="empty" v-if="recordList.length === 0">暂无测试记录</view>
			<view class="record-card" v-for="record in recordList" :key="record.id">
				<view class="record-time">完成时间 {{formatTime(record.completedAt)}}</view>
				<view class="record-main">
					<view class="record-title">{{record.subjectTitle}} {{record.title}} {{record.sourceType}}</view>
					<view class="record-score">得分 {{record.scoreText}}</view>
				</view>
				<view class="detail-toggle" @click="toggleRecord(record.id)">测试详情</view>
				<view class="detail-list" v-if="activeRecordId === record.id">
					<view class="detail-row" v-for="detail in record.details" :key="detail.questionNo">
						<view class="detail-count">题目数：{{detail.questionNo}}/{{detail.total}}</view>
						<math-rich-text class="detail-stem" :text="detailStem(detail)" />
						<question-audio-player :src="stemAudio(detail)" />
						<image v-if="detail.stemImageUrl" class="question-image compact" :src="detail.stemImageUrl" mode="aspectFit" @click="previewMedia(detail.stemImageUrl)" />
						<math-rich-text class="detail-answer bad" :text="'我的答案：' + detailMyAnswer(detail)" />
						<view class="test-record-strip" v-if="showTestRecordDetail(detail)">
							<view class="test-record-title">查看测试记录</view>
							<view class="test-record-actions">
								<view class="record-pill muted" v-if="detail.noUpload">暂不上传</view>
								<view class="record-pill link" v-if="detail.studentAnswerImageUrl" @click.stop="previewDetailImage(detail)">查看图片</view>
								<view class="record-pill" v-if="detail.reviewResult" :class="reviewResultClass(detail)">自评{{reviewResultText(detail)}}</view>
							</view>
						</view>
						<math-rich-text class="detail-answer ok" :text="'正确答案：' + (detail.correctAnswerText || detail.correctAnswer || '--')" />
						<analysis-viewer :item="detail" :text="detail.analysis" />
					</view>
				</view>
			</view>
		</view>

		<view v-if="mode === 'retry'">
			<view class="retry-panel">
				<view class="panel-title">错题重练</view>
				<view class="panel-sub">由【温习错题】题库中组卷出题，开始测试做题。</view>
				<view class="setting-title">题量设置</view>
				<view class="count-row">
					<view class="count-btn" :class="{active: retryCount === 5}" @click="setRetryCount(5)">随机 5 道题</view>
					<view class="count-btn" :class="{active: retryCount === 20}" @click="setRetryCount(20)">随机 20 题</view>
				</view>
				<view class="notice">当前错题库数量不足时，按照最多数量进行分配。</view>
				<view class="retry-meta">当前可练：{{retryPaper.availableCount || 0}} 道，实际组卷：{{retryPaper.count || 0}} 道</view>
				<view class="start-btn" @click="startRetry">开始错题重练</view>
			</view>
			<view class="question-card" v-for="item in retryPreview" :key="item.id">
				<view class="source-title">温习错题来源：</view>
				<view class="tag-row"><view class="tag">{{source}}</view></view>
				<math-rich-text class="stem" :text="item.stem" />
				<question-audio-player :src="stemAudio(item)" />
				<image v-if="item.stemImageUrl" class="question-image" :src="item.stemImageUrl" mode="aspectFit" @click="previewMedia(item.stemImageUrl)" />
			</view>
		</view>

		<view v-if="mode === 'weak'">
			<view class="weak-brief">
				<view>
					<view class="weak-title">短板题库</view>
					<view class="weak-sub">多次重练仍出错，或来源标签较多的题会集中到这里。</view>
				</view>
				<view class="weak-total">{{weakPending + weakMastered}}<text>道</text></view>
			</view>
			<view class="status-panel two">
				<view class="status-item" :class="{active: statusFilter === 'pending'}" @click="setStatusFilter('pending')">
					<text>未掌握</text><text class="status-num">{{weakPending}}</text><text class="status-unit">道</text>
				</view>
				<view class="status-item" :class="{active: statusFilter === 'mastered'}" @click="setStatusFilter('mastered')">
					<text>已掌握</text><text class="status-num">{{weakMastered}}</text><text class="status-unit">道</text>
				</view>
			</view>
			<view class="empty" v-if="visibleWeakList.length === 0">暂无短板题，带三个来源标签或多次重练错误后会自动加入</view>
			<view class="question-card" v-for="item in visibleWeakList" :key="item.id">
				<view class="source-title">题目来源：</view>
				<view class="tag-row">
					<view class="tag" v-for="tag in item.sourceTags" :key="tag">{{tag}}</view>
				</view>
				<math-rich-text class="stem" :text="item.stem" />
				<question-audio-player :src="stemAudio(item)" />
				<image v-if="item.stemImageUrl" class="question-image" :src="item.stemImageUrl" mode="aspectFit" @click="previewMedia(item.stemImageUrl)" />
				<view class="option-list" v-if="showOptions(item)">
					<view class="option-row" v-for="(option, optionIndex) in item.options" :key="optionIndex">
						<math-rich-text :text="`${optionLetter(optionIndex)}. ${option || '图片选项'}`" />
						<image v-if="optionImage(item, optionIndex)" class="option-image" :src="optionImage(item, optionIndex)" mode="aspectFit" @click="previewMedia(optionImage(item, optionIndex))" />
					</view>
				</view>
				<view class="row-actions weak-actions">
					<view class="state" :class="{done:item.mastered}">{{item.mastered ? '已掌握' : '未掌握'}}</view>
					<view class="mark-btn" :class="{done:item.mastered}" @click="mark(item)">{{item.mastered ? '已标记' : '标记掌握'}}</view>
				</view>
				<analysis-viewer :item="item" :text="item.analysis" />
			</view>
		</view>
	</view>
</template>

<script>
import {
	getWrongBook,
	markWrongMastered,
	getWrongBookSummary,
	getWrongBookRecords,
	getWeakWrongBook,
	getWrongRetry,
	toggleFavorite
} from '@/common/api.js'
import AnalysisViewer from '@/components/analysis-viewer.vue'
import MathRichText from '@/components/math-rich-text.vue'
import QuestionAudioPlayer from '@/components/question-audio-player.vue'

export default {
	components: { AnalysisViewer, MathRichText, QuestionAudioPlayer },
	data() {
		return {
			mode: 'review',
			source: '全部',
			sources: ['全部', '最新错题', '章节扫雷', '复习测试', '真题讲练', '错题重练'],
			summary: {},
			course: {},
			wrongList: [],
			weakList: [],
			records: { total: 0, courseCounts: [], records: [] },
			retryPaper: { questions: [], sourceWrongIds: [] },
			retryCount: 5,
			courseId: 'gk-math-full',
			activeRecordId: '',
			statusFilter: 'all'
		}
	},
	computed: {
		recordList() {
			return this.records.records || []
		},
		retryPreview() {
			return (this.retryPaper.questions || []).slice(0, 3)
		},
		weakPending() {
			return this.weakList.filter(item => !item.mastered).length
		},
		weakMastered() {
			return this.weakList.filter(item => item.mastered).length
		},
		visibleWrongList() {
			return this.wrongList.filter(item => this.statusMatched(item))
		},
		visibleWeakList() {
			return this.weakList.filter(item => this.statusMatched(item))
		}
	},
	onLoad(opts = {}) {
		this.courseId = decodeURIComponent(opts.courseId || 'gk-math-full')
	},
	onShow() {
		this.loadSummary()
		this.loadCurrent()
	},
	methods: {
		async loadSummary() {
			try {
				const data = await getWrongBookSummary(this.courseId)
				this.summary = data || {}
				this.course = data.course || {}
			} catch (err) {
				uni.showToast({ title: err.message || '加载失败', icon: 'none' })
			}
		},
		async loadCurrent() {
			if (this.mode === 'review') return this.loadWrongBook()
			if (this.mode === 'records') return this.loadRecords()
			if (this.mode === 'weak') return this.loadWeak()
			return this.loadRetry()
		},
		async loadWrongBook() {
			try {
				this.wrongList = this.scopeCourseItems(await getWrongBook(this.source, this.courseId))
			} catch (err) {
				uni.showToast({ title: err.message || '加载失败', icon: 'none' })
			}
		},
		async loadRecords() {
			try {
				this.records = this.scopeCourseRecords(await getWrongBookRecords(this.source, this.courseId))
			} catch (err) {
				uni.showToast({ title: err.message || '加载失败', icon: 'none' })
			}
		},
		async loadWeak() {
			try {
				this.weakList = this.scopeCourseItems(await getWeakWrongBook(this.source, this.courseId))
			} catch (err) {
				uni.showToast({ title: err.message || '加载失败', icon: 'none' })
			}
		},
		async loadRetry() {
			try {
				this.retryPaper = await getWrongRetry(this.retryCount, this.source, this.courseId)
			} catch (err) {
				uni.showToast({ title: err.message || '加载失败', icon: 'none' })
			}
		},
		itemCourseId(item = {}) {
			return item.courseId || 'gk-math-full'
		},
		sameCourse(item = {}) {
			return this.itemCourseId(item) === (this.courseId || 'gk-math-full')
		},
		scopeCourseItems(list = []) {
			return Array.isArray(list) ? list.filter(item => this.sameCourse(item)) : []
		},
		courseCountLabel(records = []) {
			const first = records[0] || {}
			return first.subjectTitle || first.courseTitle || this.course.title || this.course.courseTitle || this.course.courseName || this.courseId || '当前课程'
		},
		scopeCourseRecords(data = {}) {
			const records = this.scopeCourseItems(data.records || [])
			return {
				...data,
				total: records.length,
				courseCounts: records.length ? [{ label: this.courseCountLabel(records), value: records.length }] : [],
				records
			}
		},
		setMode(mode) {
			this.mode = mode
			this.activeRecordId = ''
			this.statusFilter = 'all'
			this.loadCurrent()
		},
		setSource(source) {
			this.source = source
			this.activeRecordId = ''
			this.statusFilter = 'all'
			this.loadCurrent()
		},
		setStatusFilter(filter) {
			this.statusFilter = this.statusFilter === filter ? 'all' : filter
		},
		statusMatched(item = {}) {
			if (this.statusFilter === 'pending') return !item.mastered
			if (this.statusFilter === 'mastered') return !!item.mastered
			if (this.statusFilter === 'weak') return !!item.weak
			return true
		},
		setRetryCount(count) {
			this.retryCount = count
			this.loadRetry()
		},
		startRetry() {
			if (!this.retryPaper.count) {
				uni.showToast({ title: '当前没有可重练的错题', icon: 'none' })
				return
			}
			uni.navigateTo({
				url: `/pages/practice/practice?type=wrongRetry&count=${this.retryCount}&source=${encodeURIComponent(this.source)}&courseId=${encodeURIComponent(this.courseId)}&title=${encodeURIComponent('错题重练')}`
			})
		},
		async mark(item) {
			if (item.mastered) return
			try {
				await markWrongMastered(item.id)
				item.mastered = true
				item.statusText = '已掌握'
				this.loadSummary()
			} catch (err) {
				uni.showToast({ title: err.message || '标记失败', icon: 'none' })
			}
		},
		async favoriteWrong(item) {
			try {
				await toggleFavorite({
					type: 'question',
					targetId: item.questionId || item.id,
					title: item.stem,
					courseId: item.courseId || this.courseId || 'gk-math-full',
					action: 'add'
				})
				uni.showToast({ title: '已加入我的收藏', icon: 'success' })
			} catch (err) {
				uni.showToast({ title: err.message || '收藏失败', icon: 'none' })
			}
		},
		toggleRecord(id) {
			this.activeRecordId = this.activeRecordId === id ? '' : id
		},
		detailMyAnswer(detail = {}) {
			const answer = detail.myAnswerText || detail.myAnswer || detail.selectedText || ''
			if (answer && answer !== '--') return answer
			return detail.noUpload ? '暂不上传' : '--'
		},
		detailStem(detail = {}) {
			const parentStem = String(detail.parentStem || '').trim()
			const stem = String(detail.stem || '').trim()
			if (parentStem && stem) return `${parentStem}\n小题：${stem}`
			return stem || (detail.stemImageUrl ? '图片题干' : '题目内容暂未返回')
		},
		showTestRecordDetail(detail = {}) {
			return detail.questionType !== 'choice' && (
				!!detail.studentAnswerImageUrl ||
				!!detail.reviewResult ||
				!!detail.noUpload ||
				!!detail.skipped
			)
		},
		reviewResultText(detail = {}) {
			if (detail.reviewResultText) return detail.reviewResultText
			const result = String(detail.reviewResult || '').toLowerCase()
			if (result === 'correct') return '对'
			if (result === 'partial') return '半对'
			if (result === 'wrong') return '错'
			if (result === 'pending') return '待自评'
			return ''
		},
		reviewResultClass(detail = {}) {
			const result = String(detail.reviewResult || '').toLowerCase()
			return {
				'ok': result === 'correct',
				'partial': result === 'partial',
				'bad': result === 'wrong',
				'pending': result === 'pending'
			}
		},
		previewDetailImage(detail = {}) {
			const url = detail.studentAnswerImageUrl || ''
			if (!url) {
				uni.showToast({ title: '暂无作答图片', icon: 'none' })
				return
			}
			uni.previewImage({ urls: [url], current: url })
		},
		mediaList(value) {
			if (Array.isArray(value)) return value.map(item => String(item || '').trim()).filter(Boolean)
			return String(value || '').split(/[,\n]/).map(item => item.trim()).filter(Boolean)
		},
		optionImage(item = {}, index) {
			const urls = this.mediaList(item.optionImageUrls || item.optionImages || item.optionImageUrl)
			return urls[index] || ''
		},
		stemAudio(item = {}) {
			return item.stemAudioUrl || item.questionAudioUrl || item.audioUrl || item.stemAudio || ''
		},
		previewMedia(url) {
			if (!url) return
			uni.previewImage({ urls: [url], current: url })
		},
		optionText(item, index) {
			const options = item.options || []
			return options[index] !== undefined ? `${String.fromCharCode(65 + Number(index))}. ${options[index]}` : '--'
		},
		optionLetter(index) {
			return String.fromCharCode(65 + Number(index))
		},
		showOptions(item = {}) {
			return Array.isArray(item.options) && item.options.length > 0
		},
		formatTime(value) {
			return value ? String(value).replace('T', ' ').slice(0, 16) : '--'
		},
		formatFullTime(value) {
			return value ? String(value).replace('T', ' ').slice(0, 16) : '--'
		},
		goBack() {
			uni.navigateBack({ fail: () => {} })
		}
	}
}
</script>

<style lang="scss">
page { background:#f4f6f8; }
.page { min-height:100vh; background:#f4f6f8; padding-bottom:44rpx; color:#1f2933; }
.nav { position:relative; height:90rpx; background:#fff; display:flex; align-items:center; justify-content:center; border-bottom:1rpx solid #edf0f2; }
.back { position:absolute; left:24rpx; font-size:48rpx; color:#1f2933; line-height:1; }
.nav-title { font-size:31rpx; font-weight:800; }
.study-band { padding:24rpx; background:#fff; }
.band-row { display:grid; grid-template-columns:1fr auto; align-items:center; gap:20rpx; padding:28rpx; border-radius:14rpx; background:#eef9f6; border:1rpx solid #cce9e1; }
.band-label { font-size:27rpx; font-weight:800; color:#143b35; line-height:1.5; }
.band-sub { margin-top:8rpx; font-size:24rpx; color:#526b66; line-height:1.5; }
.band-stats { flex-shrink:0; display:flex; align-items:center; gap:24rpx; }
.band-total { color:#143b35; font-size:27rpx; font-weight:900; white-space:nowrap; }
.band-score { min-width:116rpx; text-align:center; color:#0f766e; font-size:42rpx; font-weight:900; }
.band-score text { display:block; margin-top:4rpx; font-size:21rpx; font-weight:700; }
.action-grid { display:grid; grid-template-columns:1fr 1fr; gap:16rpx; padding:28rpx 24rpx 24rpx; }
.action-card {
	min-height:138rpx;
	padding:22rpx;
	border-radius:14rpx;
	background:#fff;
	border:1rpx solid #e3e8ef;
	display:flex;
	align-items:flex-start;
	gap:16rpx;
	box-shadow:0 3rpx 10rpx rgba(16,24,40,.03);
}
.action-card.active { border-color:#8fb8ff; background:#f4f8ff; box-shadow:0 5rpx 16rpx rgba(37,99,235,.08); }
.action-mark {
	width:42rpx;
	height:42rpx;
	border-radius:10rpx;
	background:#eef5ff;
	color:#2563eb;
	display:flex;
	align-items:center;
	justify-content:center;
	font-size:22rpx;
	font-weight:900;
	flex-shrink:0;
}
.action-mark.records { background:#f1f5f9; color:#475569; }
.action-mark.retry { background:#ecfdf5; color:#0f766e; }
.action-mark.weak { background:#fff7ed; color:#c2410c; }
.action-title { font-size:29rpx; font-weight:800; color:#1f2933; }
.action-sub { margin-top:10rpx; font-size:23rpx; color:#667085; line-height:1.45; }
.source-filter { display:flex; gap:12rpx; padding:0 24rpx 20rpx; overflow-x:auto; }
.source-chip { flex:0 0 auto; height:58rpx; line-height:58rpx; padding:0 22rpx; border-radius:10rpx; background:#fff; color:#52606d; border:1rpx solid #d9e0e8; font-size:24rpx; }
.source-chip.active { background:#2563eb; border-color:#2563eb; color:#fff; font-weight:800; }
.status-panel, .record-summary, .retry-panel { margin:0 24rpx 20rpx; padding:18rpx; border-radius:14rpx; background:#fff; border:1rpx solid #e3e8ef; }
.status-panel { display:grid; grid-template-columns:repeat(3, 1fr); gap:12rpx; }
.status-panel.two { grid-template-columns:repeat(2, 1fr); }
.status-item {
	min-height:96rpx;
	display:flex;
	flex-direction:column;
	align-items:center;
	justify-content:center;
	padding:10rpx;
	border-radius:12rpx;
	background:#f8fafc;
	border:1rpx solid #edf2f7;
	color:#64748b;
	font-size:23rpx;
	font-weight:800;
}
.status-item.active { background:#eef5ff; border-color:#2563eb; color:#1d4ed8; }
.status-num { margin-top:6rpx; color:#1f2933; font-size:34rpx; font-weight:900; line-height:1; }
.status-unit { margin-top:4rpx; color:#94a3b8; font-size:20rpx; }
.weak-brief {
	margin:0 24rpx 20rpx;
	padding:24rpx;
	border-radius:14rpx;
	background:#fffaf4;
	border:1rpx solid #fed7aa;
	display:flex;
	align-items:center;
	justify-content:space-between;
	gap:18rpx;
}
.weak-title { color:#9a3412; font-size:31rpx; font-weight:900; }
.weak-sub { margin-top:8rpx; color:#8a5a37; font-size:24rpx; line-height:1.5; }
.weak-total { color:#c2410c; font-size:42rpx; font-weight:900; text-align:center; flex-shrink:0; }
.weak-total text { display:block; margin-top:2rpx; color:#9a3412; font-size:20rpx; }
.empty { padding:140rpx 24rpx; text-align:center; color:#8a94a3; font-size:28rpx; }
.question-card, .record-card { margin:0 24rpx 20rpx; padding:24rpx; background:#fff; border-radius:14rpx; border:1rpx solid #e3e8ef; box-shadow:0 3rpx 10rpx rgba(16,24,40,.03); }
.source-title { font-size:24rpx; color:#667085; font-weight:800; }
.tag-row { display:flex; flex-wrap:wrap; gap:10rpx; margin-top:10rpx; }
.tag { padding:6rpx 12rpx; border-radius:6rpx; background:#eef5ff; color:#1d4ed8; font-size:22rpx; font-weight:700; }
.tag.latest-tag { background:#fff1f2; color:#be123c; }
.stem { margin-top:18rpx; font-size:29rpx; line-height:1.55; font-weight:800; color:#1f2933; }
.question-image { width:100%; max-height:420rpx; margin:14rpx 0 4rpx; border-radius:12rpx; background:#eef2f7; }
.question-image.compact { max-height:260rpx; margin:10rpx 0; }
.option-list { margin-top:14rpx; padding:14rpx 16rpx; background:#f8fafc; border:1rpx solid #edf0f2; border-radius:8rpx; }
.option-row { color:#475467; font-size:24rpx; line-height:1.65; }
.option-row + .option-row { margin-top:12rpx; }
.option-image { width:100%; max-height:300rpx; margin-top:8rpx; border-radius:10rpx; background:#eef2f7; }
.answer { margin-top:12rpx; font-size:26rpx; line-height:1.45; }
.answer.ok { color:#047857; }
.answer.bad { color:#dc2626; }
.analysis, .detail-analysis { margin-top:14rpx; color:#5f6b7a; font-size:25rpx; line-height:1.55; }
.row-actions { display:grid; grid-template-columns:120rpx 1fr 1fr; align-items:center; gap:16rpx; margin-top:20rpx; }
.state, .weak-status { height:64rpx; line-height:64rpx; text-align:center; border-radius:10rpx; background:#f1f5f9; color:#64748b; font-size:23rpx; font-weight:800; }
.state.done, .weak-status.done { background:#ecfdf5; color:#047857; }
.mark-btn, .fav-btn { height:68rpx; line-height:68rpx; text-align:center; border-radius:10rpx; font-size:27rpx; font-weight:800; }
.mark-btn { background:#eef5ff; color:#1d4ed8; border:1rpx solid #bfdbfe; }
.mark-btn.done { background:#edf1f5; color:#667085; border-color:#edf1f5; }
.fav-btn { background:#0f766e; }
.weak-actions { grid-template-columns:1fr 1fr; }
.record-total { font-size:30rpx; font-weight:900; color:#1f2933; }
.record-subjects { display:flex; flex-wrap:wrap; gap:16rpx; margin-top:12rpx; color:#667085; font-size:24rpx; }
.record-time { font-size:23rpx; color:#8a94a3; }
.record-main { display:flex; justify-content:space-between; gap:18rpx; margin-top:14rpx; }
.record-title { flex:1; min-width:0; font-size:27rpx; line-height:1.5; font-weight:800; color:#1f2933; }
.record-score { flex-shrink:0; color:#2563eb; font-size:26rpx; font-weight:900; }
.detail-toggle { margin-top:18rpx; height:62rpx; line-height:62rpx; text-align:center; border-radius:8rpx; background:#eef5ff; color:#1d4ed8; font-size:25rpx; font-weight:800; }
.detail-list { margin-top:18rpx; border-top:1rpx solid #edf0f2; }
.detail-row { padding:18rpx 0; border-bottom:1rpx solid #edf0f2; color:#334155; font-size:25rpx; line-height:1.65; }
.detail-count { font-weight:800; color:#1f2933; }
.detail-stem { margin-top:10rpx; color:#1f2933; font-size:27rpx; font-weight:800; line-height:1.55; }
.detail-answer { margin-top:8rpx; font-size:25rpx; line-height:1.45; }
.detail-answer.ok { color:#047857; }
.detail-answer.bad { color:#dc2626; }
.test-record-strip {
	margin-top:12rpx;
	padding:12rpx;
	border-radius:10rpx;
	background:#f8fafc;
	border:1rpx solid #e2e8f0;
	display:flex;
	align-items:center;
	justify-content:space-between;
	gap:12rpx;
}
.test-record-title {
	flex-shrink:0;
	color:#475569;
	font-size:23rpx;
	font-weight:900;
}
.test-record-actions {
	min-width:0;
	flex:1;
	display:flex;
	flex-wrap:wrap;
	justify-content:flex-end;
	gap:10rpx;
}
.record-pill {
	height:44rpx;
	line-height:44rpx;
	padding:0 14rpx;
	border-radius:8rpx;
	background:#fff;
	border:1rpx solid #cbd5e1;
	color:#475569;
	font-size:22rpx;
	font-weight:800;
}
.record-pill.link { color:#2563eb; border-color:#93c5fd; background:#eff6ff; }
.record-pill.ok { color:#047857; border-color:#86efac; background:#ecfdf5; }
.record-pill.partial { color:#b45309; border-color:#fcd34d; background:#fffbeb; }
.record-pill.bad { color:#dc2626; border-color:#fecaca; background:#fff1f2; }
.record-pill.pending,
.record-pill.muted { color:#64748b; border-color:#cbd5e1; background:#f1f5f9; }
.panel-title { font-size:32rpx; font-weight:900; color:#1f2933; }
.panel-sub, .notice, .retry-meta { margin-top:10rpx; color:#667085; font-size:25rpx; line-height:1.5; }
.setting-title { margin-top:24rpx; font-size:26rpx; font-weight:900; color:#1f2933; }
.count-row { display:flex; gap:16rpx; margin-top:14rpx; }
.count-btn { flex:1; height:70rpx; line-height:70rpx; text-align:center; border-radius:8rpx; background:#f1f5f9; color:#334155; font-size:26rpx; font-weight:800; }
.count-btn.active { background:#2563eb; color:#fff; }
.start-btn { margin-top:22rpx; height:78rpx; line-height:78rpx; text-align:center; border-radius:8rpx; background:#0f766e; color:#fff; font-size:28rpx; font-weight:900; }
@media screen and (max-width: 420px) {
	.band-row { grid-template-columns:1fr; }
	.band-stats { justify-content:space-between; }
	.status-panel { grid-template-columns:1fr; }
	.status-panel.two { grid-template-columns:1fr 1fr; }
	.row-actions { grid-template-columns:1fr; }
	.weak-actions { grid-template-columns:1fr 1fr; }
}

/* PC H5 polish */
page { background:#eef3f7; }
.page {
	background:linear-gradient(180deg, #f9fbfd 0%, #eef3f7 360rpx, #eef3f7 100%);
	padding-bottom:56rpx;
}
.nav {
	position:sticky;
	top:0;
	z-index:20;
	height:92rpx;
	background:rgba(251,253,255,.96);
	backdrop-filter:saturate(140%) blur(10px);
	border-bottom:1rpx solid #e4eaf1;
}
.study-band {
	padding:24rpx 24rpx 18rpx;
	background:transparent;
}
.band-row {
	grid-template-columns:minmax(0, 1fr) 176rpx;
	align-items:stretch;
	gap:16rpx;
	padding:24rpx;
	border-radius:20rpx;
	background:linear-gradient(135deg, #e9f8f4 0%, #f7fbff 100%);
	border:1rpx solid #bfddd7;
	box-shadow:0 12rpx 34rpx rgba(15,118,110,.09);
}
.band-label {
	max-width:100%;
	font-size:27rpx;
	font-weight:900;
	line-height:1.45;
	word-break:break-word;
}
.band-sub {
	font-size:22rpx;
	line-height:1.55;
	word-break:break-word;
}
.band-stats {
	min-width:0;
	flex-direction:column;
	align-items:stretch;
	justify-content:space-between;
	gap:12rpx;
}
.band-total {
	padding:10rpx 12rpx;
	border-radius:12rpx;
	background:rgba(255,255,255,.72);
	font-size:22rpx;
	line-height:1.35;
	text-align:center;
	white-space:normal;
}
.band-score {
	min-width:0;
	padding:10rpx 8rpx 8rpx;
	border-radius:14rpx;
	background:rgba(255,255,255,.72);
}
.action-grid {
	gap:16rpx;
	padding:28rpx 24rpx 22rpx;
}
.action-card {
	min-height:148rpx;
	padding:24rpx 22rpx;
	border-radius:18rpx;
	border-color:#dfe7f0;
	box-shadow:0 10rpx 26rpx rgba(31,41,51,.045);
	transition:background-color .18s ease, border-color .18s ease, transform .18s ease;
}
.action-card.active {
	border-color:#80aaf2;
	background:#f3f7ff;
	box-shadow:0 12rpx 28rpx rgba(37,99,235,.10);
	transform:translateY(-1rpx);
}
.action-title {
	font-weight:900;
	color:#17212f;
}
.action-sub {
	color:#66758a;
	line-height:1.5;
}
.source-filter {
	flex-wrap:wrap;
	overflow:visible;
}
.source-chip {
	flex:1 1 calc(33.333% - 12rpx);
	min-width:0;
	height:60rpx;
	line-height:60rpx;
	padding:0 14rpx;
	border-radius:12rpx;
	text-align:center;
	box-sizing:border-box;
	box-shadow:0 6rpx 16rpx rgba(31,41,51,.035);
}
.source-chip.active {
	font-weight:900;
	box-shadow:0 10rpx 22rpx rgba(37,99,235,.18);
}
.status-panel,
.record-summary,
.retry-panel,
.question-card,
.record-card {
	border-radius:18rpx;
	border-color:#dfe7f0;
	box-shadow:0 10rpx 24rpx rgba(31,41,51,.04);
}
.status-item {
	min-height:108rpx;
	border-radius:14rpx;
	background:#f7f9fc;
}
.empty {
	margin:0 24rpx 20rpx;
	padding:92rpx 28rpx;
	background:#fff;
	border:1rpx dashed #cbd6e2;
	border-radius:20rpx;
	line-height:1.6;
}
/* Desktop typography refinement */
@media screen and (min-width: 431px) {
	.study-band {
		padding-top:22rpx;
	}
	.band-row {
		grid-template-columns:minmax(0, 1fr) 152rpx;
		min-height:168rpx;
		padding:24rpx 26rpx;
		gap:18rpx;
	}
	.band-label {
		font-size:26rpx;
		line-height:1.32;
		letter-spacing:0;
	}
	.band-sub {
		margin-top:10rpx;
		font-size:22rpx;
		line-height:1.38;
		color:#5d706d;
	}
	.band-stats {
		gap:10rpx;
	}
	.band-total {
		min-height:58rpx;
		display:flex;
		align-items:center;
		justify-content:center;
		padding:8rpx 10rpx;
		font-size:20rpx;
		font-weight:800;
		line-height:1.25;
		color:#173b36;
		box-shadow:0 6rpx 18rpx rgba(15,118,110,.045);
	}
	.band-score {
		min-height:72rpx;
		display:flex;
		flex-direction:column;
		align-items:center;
		justify-content:center;
		padding:8rpx;
		font-size:34rpx;
		line-height:1;
		box-shadow:0 8rpx 20rpx rgba(15,118,110,.055);
	}
	.band-score text {
		margin-top:8rpx;
		font-size:19rpx;
		line-height:1.15;
	}
	.action-grid {
		gap:14rpx;
		padding-top:28rpx;
	}
	.action-card {
		min-height:132rpx;
		padding:22rpx 20rpx;
		gap:14rpx;
	}
	.action-mark {
		width:40rpx;
		height:40rpx;
		border-radius:10rpx;
		font-size:21rpx;
	}
	.action-title {
		font-size:28rpx;
		line-height:1.25;
	}
	.action-sub {
		margin-top:8rpx;
		font-size:22rpx;
		line-height:1.42;
	}
	.source-filter {
		gap:10rpx;
	}
	.source-chip {
		height:56rpx;
		line-height:56rpx;
		font-size:23rpx;
	}
	.status-panel {
		margin-top:0;
		padding:16rpx;
	}
}
@media screen and (max-width: 420px) {
	.band-row {
		grid-template-columns:1fr;
	}
	.band-total {
		text-align:left;
	}
	.source-chip {
		flex-basis:calc(50% - 8rpx);
	}
	.status-panel {
		grid-template-columns:repeat(3, minmax(0, 1fr));
		gap:8rpx;
		padding:14rpx;
	}
	.status-panel.two {
		grid-template-columns:repeat(2, minmax(0, 1fr));
	}
	.status-item {
		min-height:96rpx;
		padding:10rpx 4rpx;
	}
	.status-num {
		font-size:32rpx;
	}
}
</style>

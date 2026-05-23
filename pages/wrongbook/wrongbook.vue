<template>
	<view class="page">
		<view class="nav">
			<view class="back" @click="goBack">‹</view>
			<view class="nav-title">错题与巩固</view>
		</view>

		<view class="study-band">
			<view class="band-row">
				<view>
					<view class="band-label">共计 {{course.totalLessons || 0}} 节，总时长：{{course.totalDuration || '--'}}</view>
					<view class="band-sub">已学节数：{{course.readStudyCount || 0}} 节，已学时长：{{course.readDuration || '00小时00分'}}</view>
				</view>
				<view class="band-score">{{summary.pending || 0}}<text>待巩固</text></view>
			</view>
		</view>

		<view class="action-grid">
			<view class="action-card" :class="{active: mode === 'review'}" @click="setMode('review')">
				<view class="action-title">温习错题</view>
				<view class="action-sub">按来源查看解析与正确答案</view>
			</view>
			<view class="action-card" :class="{active: mode === 'records'}" @click="setMode('records')">
				<view class="action-title">查看测试记录</view>
				<view class="action-sub">章节扫雷、复习测试、错题重练记录</view>
			</view>
			<view class="action-card" :class="{active: mode === 'retry'}" @click="setMode('retry')">
				<view class="action-title">错题重练</view>
				<view class="action-sub">再次测试错题，巩固解题技巧</view>
			</view>
			<view class="action-card" :class="{active: mode === 'weak'}" @click="setMode('weak')">
				<view class="action-title">短板题库</view>
				<view class="action-sub">多次重练仍未掌握的题型</view>
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
			<view class="summary-card">
				<view>待温习：{{summary.pending || 0}} 道</view>
				<view>已掌握：{{summary.mastered || 0}} 道</view>
				<view>短板：{{summary.weak || 0}} 道</view>
			</view>
			<view class="empty" v-if="wrongList.length === 0">暂无错题，先完成一次测试后这里会自动收录</view>
			<view class="question-card" v-for="item in wrongList" :key="item.id">
				<view class="source-title">错题来源：</view>
				<view class="tag-row">
					<view class="tag" v-for="tag in item.sourceTags" :key="tag">【{{tag}}】</view>
				</view>
				<view class="stem">{{item.stem}}</view>
				<view class="answer ok">正确答案：{{item.answerText || optionText(item, item.answer)}}</view>
				<view class="answer bad">我的答案：{{item.selectedText || optionText(item, item.selected)}}</view>
				<analysis-viewer :item="item" :text="item.analysis" />
				<view class="row-actions">
					<view class="state" :class="{done:item.mastered}">{{item.mastered ? '已掌握' : '未掌握'}}</view>
					<view class="mark-btn" :class="{done:item.mastered}" @click="mark(item)">{{item.mastered ? '已标记' : '标记掌握'}}</view>
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
						<view>我的答案：{{detail.myAnswer}}</view>
						<view>正确答案：{{detail.correctAnswer}}</view>
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
				<view class="notice">错题库数量不够的话以最多量来分配</view>
				<view class="retry-meta">当前可练：{{retryPaper.availableCount || 0}} 道，实际组卷：{{retryPaper.count || 0}} 道</view>
				<view class="start-btn" @click="startRetry">开始错题重练</view>
			</view>
			<view class="question-card" v-for="item in retryPreview" :key="item.id">
				<view class="source-title">温习错题来源：</view>
				<view class="tag-row"><view class="tag">{{source}}</view></view>
				<view class="stem">{{item.stem}}</view>
			</view>
		</view>

		<view v-if="mode === 'weak'">
			<view class="summary-card">
				<view>未掌握：{{weakPending}} 道</view>
				<view>已掌握：{{weakMastered}} 道</view>
			</view>
			<view class="empty" v-if="weakList.length === 0">暂无短板题，带三个来源标签或多次重练错误后会自动加入</view>
			<view class="question-card" v-for="item in weakList" :key="item.id">
				<view class="source-title">题目来源：</view>
				<view class="tag-row">
					<view class="tag" v-for="tag in item.sourceTags" :key="tag">【{{tag}}】</view>
				</view>
				<view class="stem">{{item.stem}}</view>
				<view class="weak-status" :class="{done:item.mastered}">{{item.mastered ? '已掌握' : '未掌握'}}</view>
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
	getWrongRetry
} from '@/common/api.js'
import AnalysisViewer from '@/components/analysis-viewer.vue'

export default {
	components: { AnalysisViewer },
	data() {
		return {
			mode: 'review',
			source: '全部',
			sources: ['全部', '章节扫雷', '复习测试', '真题讲练', '错题重练'],
			summary: {},
			course: {},
			wrongList: [],
			weakList: [],
			records: { total: 0, courseCounts: [], records: [] },
			retryPaper: { questions: [], sourceWrongIds: [] },
			retryCount: 5,
			activeRecordId: ''
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
		}
	},
	onShow() {
		this.loadSummary()
		this.loadCurrent()
	},
	methods: {
		async loadSummary() {
			try {
				const data = await getWrongBookSummary('gk-math-full')
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
				this.wrongList = await getWrongBook(this.source)
			} catch (err) {
				uni.showToast({ title: err.message || '加载失败', icon: 'none' })
			}
		},
		async loadRecords() {
			try {
				this.records = await getWrongBookRecords(this.source)
			} catch (err) {
				uni.showToast({ title: err.message || '加载失败', icon: 'none' })
			}
		},
		async loadWeak() {
			try {
				this.weakList = await getWeakWrongBook(this.source)
			} catch (err) {
				uni.showToast({ title: err.message || '加载失败', icon: 'none' })
			}
		},
		async loadRetry() {
			try {
				this.retryPaper = await getWrongRetry(this.retryCount, this.source)
			} catch (err) {
				uni.showToast({ title: err.message || '加载失败', icon: 'none' })
			}
		},
		setMode(mode) {
			this.mode = mode
			this.activeRecordId = ''
			this.loadCurrent()
		},
		setSource(source) {
			this.source = source
			this.activeRecordId = ''
			this.loadCurrent()
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
				url: `/pages/practice/practice?type=wrongRetry&count=${this.retryCount}&source=${encodeURIComponent(this.source)}&title=${encodeURIComponent('错题重练')}`
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
		toggleRecord(id) {
			this.activeRecordId = this.activeRecordId === id ? '' : id
		},
		optionText(item, index) {
			const options = item.options || []
			return options[index] !== undefined ? `${String.fromCharCode(65 + Number(index))}. ${options[index]}` : '--'
		},
		formatTime(value) {
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
.band-row { display:flex; align-items:center; justify-content:space-between; gap:24rpx; padding:24rpx; border-radius:8rpx; background:#eaf6f3; border:1rpx solid #cce9e1; }
.band-label { font-size:27rpx; font-weight:800; color:#143b35; line-height:1.5; }
.band-sub { margin-top:8rpx; font-size:24rpx; color:#526b66; line-height:1.5; }
.band-score { min-width:116rpx; text-align:center; color:#0f766e; font-size:42rpx; font-weight:900; }
.band-score text { display:block; margin-top:4rpx; font-size:21rpx; font-weight:700; }
.action-grid { display:grid; grid-template-columns:1fr 1fr; gap:16rpx; padding:24rpx; }
.action-card { min-height:132rpx; padding:22rpx; border-radius:8rpx; background:#fff; border:1rpx solid #e3e8ef; }
.action-card.active { border-color:#2563eb; background:#eef5ff; }
.action-title { font-size:29rpx; font-weight:800; color:#1f2933; }
.action-sub { margin-top:10rpx; font-size:23rpx; color:#667085; line-height:1.45; }
.source-filter { display:flex; gap:14rpx; padding:0 24rpx 20rpx; overflow-x:auto; }
.source-chip { flex:0 0 auto; height:58rpx; line-height:58rpx; padding:0 22rpx; border-radius:8rpx; background:#fff; color:#52606d; border:1rpx solid #d9e0e8; font-size:24rpx; }
.source-chip.active { background:#2563eb; border-color:#2563eb; color:#fff; font-weight:800; }
.summary-card, .record-summary, .retry-panel { margin:0 24rpx 20rpx; padding:24rpx; border-radius:8rpx; background:#fff; border:1rpx solid #e3e8ef; }
.summary-card { display:flex; justify-content:space-between; gap:16rpx; color:#9a3412; font-size:26rpx; font-weight:800; background:#fff7ed; border-color:#fed7aa; }
.empty { padding:140rpx 24rpx; text-align:center; color:#8a94a3; font-size:28rpx; }
.question-card, .record-card { margin:0 24rpx 20rpx; padding:24rpx; background:#fff; border-radius:8rpx; border:1rpx solid #e3e8ef; }
.source-title { font-size:24rpx; color:#667085; font-weight:800; }
.tag-row { display:flex; flex-wrap:wrap; gap:10rpx; margin-top:10rpx; }
.tag { padding:6rpx 12rpx; border-radius:6rpx; background:#eef5ff; color:#1d4ed8; font-size:22rpx; }
.stem { margin-top:18rpx; font-size:29rpx; line-height:1.55; font-weight:800; color:#1f2933; }
.answer { margin-top:12rpx; font-size:26rpx; line-height:1.45; }
.answer.ok { color:#047857; }
.answer.bad { color:#dc2626; }
.analysis, .detail-analysis { margin-top:14rpx; color:#5f6b7a; font-size:25rpx; line-height:1.55; }
.row-actions { display:flex; align-items:center; gap:16rpx; margin-top:20rpx; }
.state, .weak-status { padding:8rpx 16rpx; border-radius:6rpx; background:#fff1f2; color:#be123c; font-size:23rpx; font-weight:800; }
.state.done, .weak-status.done { background:#ecfdf5; color:#047857; }
.mark-btn { flex:1; height:68rpx; line-height:68rpx; text-align:center; border-radius:8rpx; background:#2563eb; color:#fff; font-size:27rpx; font-weight:800; }
.mark-btn.done { background:#edf1f5; color:#667085; }
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
.panel-title { font-size:32rpx; font-weight:900; color:#1f2933; }
.panel-sub, .notice, .retry-meta { margin-top:10rpx; color:#667085; font-size:25rpx; line-height:1.5; }
.setting-title { margin-top:24rpx; font-size:26rpx; font-weight:900; color:#1f2933; }
.count-row { display:flex; gap:16rpx; margin-top:14rpx; }
.count-btn { flex:1; height:70rpx; line-height:70rpx; text-align:center; border-radius:8rpx; background:#f1f5f9; color:#334155; font-size:26rpx; font-weight:800; }
.count-btn.active { background:#2563eb; color:#fff; }
.start-btn { margin-top:22rpx; height:78rpx; line-height:78rpx; text-align:center; border-radius:8rpx; background:#0f766e; color:#fff; font-size:28rpx; font-weight:900; }
</style>

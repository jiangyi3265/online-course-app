<template>
	<view class="page">
		<view class="nav"><view class="back" @click="goBack">‹</view><view class="nav-title">我的收藏</view></view>

		<view class="tabs">
			<view class="tab" :class="{active: tab === 'doc'}" @click="tab='doc'">收藏文档</view>
			<view class="tab" :class="{active: tab === 'question'}" @click="tab='question'">收藏题目</view>
		</view>

		<block v-if="tab === 'doc'">
			<view class="doc-tabs">
				<view class="doc-tab" :class="{active: docTab === 'lecture'}" @click="docTab='lecture'">收藏资料</view>
				<view class="doc-tab" :class="{active: docTab === 'paper'}" @click="docTab='paper'">收藏试卷</view>
			</view>
			<view class="empty" v-if="!activeDocs.length">{{docTab === 'paper' ? '暂无收藏试卷' : '暂无收藏资料'}}</view>
			<view class="doc-card" v-for="item in activeDocs" :key="item.favoriteId || item.id">
				<view class="doc-icon">{{item.fileType || (docTab === 'paper' ? '卷' : '资')}}</view>
				<view class="doc-info">
					<view class="doc-title">{{item.title}}</view>
					<view class="doc-meta">{{item.courseTitle || item.courseId || '课程文档'}} · {{item.size || '未知大小'}}</view>
					<view class="doc-time">收藏时间：{{formatDate(item.createdAt)}}</view>
				</view>
				<view class="doc-actions">
					<view class="doc-action cancel" @click="cancelFavorite(item, docTab === 'paper' ? 'paper' : 'doc')">取消收藏</view>
					<view class="doc-action download" @click="downloadDoc(item)">下载</view>
					<view class="doc-action open" @click="openDoc(item)">打开</view>
				</view>
			</view>
		</block>

		<block v-else>
			<view class="empty" v-if="!questions.length">暂无收藏题目</view>
			<view class="question-card" v-for="item in questions" :key="item.id">
				<view class="question-head">
					<view class="tag">{{item.knowledge || '题目'}}</view>
					<view class="cancel-fav" @click="cancelFavorite(item, 'question')">取消收藏</view>
				</view>
				<math-rich-text class="stem" :text="item.stem" />
				<question-audio-player :src="stemAudio(item)" />
				<image v-if="item.stemImageUrl" class="question-image" :src="mediaUrl(item.stemImageUrl)" mode="aspectFit" @click="previewMedia(item.stemImageUrl)" />
				<block v-if="questionType(item) === 'reading'">
					<view class="reading-sub-card" v-for="(sub, subIndex) in subQuestions(item)" :key="sub.id || subIndex">
						<view class="reading-sub-head">小题 {{subIndex + 1}}</view>
						<math-rich-text class="reading-sub-stem" :text="sub.stem" />
						<view class="option" v-for="(opt, idx) in sub.options || []" :key="idx">
							<text class="radio">{{optionLetter(idx)}}.</text>
							<view class="option-body">
								<math-rich-text v-if="opt" :text="opt" />
								<text v-else class="image-option-label">图片选项</text>
							</view>
						</view>
					</view>
					<view class="reading-tip">阅读理解包含多个小题，请从课程练习或章节扫雷进入作答。</view>
				</block>
				<block v-else-if="questionType(item) === 'choice'">
					<view class="option" v-for="(opt, idx) in item.options" :key="idx" :class="{active: answers[item.id] === idx}" @click="answers[item.id] = idx">
						<text class="radio">{{answers[item.id] === idx ? '●' : '○'}}</text>
						<view class="option-body">
							<math-rich-text v-if="opt" :text="opt" />
							<text v-else class="image-option-label">图片选项</text>
							<image v-if="optionImage(item, idx)" class="option-image" :src="optionImage(item, idx)" mode="aspectFit" @click.stop="previewMedia(optionImage(item, idx))" />
						</view>
					</view>
				</block>
				<view class="text-answer" v-else>
					<textarea class="answer-textarea" v-model="answers[item.id]" :auto-height="true" :placeholder="questionType(item) === 'fill' ? '请输入填空答案' : '请输入你的解题思路或答案'" />
				</view>
				<view class="analysis" v-if="results[item.id]">
					<view :class="results[item.id].manualReview ? 'review' : (results[item.id].correct ? 'ok' : 'bad')">{{results[item.id].manualReview ? '已提交，查看参考答案自评' : (results[item.id].correct ? '回答正确' : '回答错误')}}</view>
					<math-rich-text class="ana-text" :text="'参考答案：' + answerText(item, results[item.id])" />
					<analysis-viewer :item="results[item.id]" :text="results[item.id].analysis" />
				</view>
				<view v-if="questionType(item) !== 'reading'" class="answer-btn" @click="submitQuestion(item)">提交作答</view>
			</view>
		</block>
	</view>
</template>

<script>
import { answerFavoriteQuestion, getFavorites, resolveMediaUrl, isUsableMediaUrl, toggleFavorite } from '@/common/api.js'
import { safeNavigateBack } from '@/common/navigation.js'
import AnalysisViewer from '@/components/analysis-viewer.vue'
import MathRichText from '@/components/math-rich-text.vue'
import QuestionAudioPlayer from '@/components/question-audio-player.vue'

export default {
	components: { AnalysisViewer, MathRichText, QuestionAudioPlayer },
	data() {
		return {
			tab: 'doc',
			docTab: 'lecture',
			courses: [],
			docs: [],
			papers: [],
			questions: [],
			answers: {},
			results: {}
		}
	},
	computed: {
		activeDocs() {
			return this.docTab === 'paper' ? this.papers : this.docs;
		}
	},
	onShow() {
		this.loadData();
	},
	methods: {
		async loadData() {
			try {
				const data = await getFavorites();
				this.courses = data.courses || [];
				this.docs = data.docs || [];
				this.papers = data.papers || [];
				this.questions = data.questions || [];
			} catch (err) {
				uni.showToast({ title: err.message || '加载失败', icon:'none' });
			}
		},
		openCourse(item) {
			if (!item.available) {
				uni.showToast({ title:'权限未开通，请联系授权', icon:'none' });
				return;
			}
			uni.navigateTo({ url:`/pages/course-full/course-full?id=${encodeURIComponent(item.targetId)}&subject=${encodeURIComponent(item.subject || '')}&kind=${encodeURIComponent(item.kind || 'full')}` });
		},
		openDoc(item) {
			const fileUrl = this.mediaUrl(item.fileUrl || '');
			if (fileUrl && fileUrl !== '#' && typeof window !== 'undefined') {
				window.open(fileUrl, '_blank');
				return;
			}
			uni.showToast({ title:item.title || '文档', icon:'none' });
		},
		downloadDoc(item) {
			this.openDoc(item);
		},
		formatDate(value = '') {
			const text = String(value || '').replace('T', ' ');
			return text ? text.slice(0, 16) : '--';
		},
		async submitQuestion(item) {
			if (this.isAnswerMissing(item)) {
				uni.showToast({ title:'请完成作答', icon:'none' });
				return;
			}
			try {
				const result = await answerFavoriteQuestion({ questionId: item.id, selected: this.answers[item.id], answer: this.answers[item.id] });
				this.results = { ...this.results, [item.id]: result };
			} catch (err) {
				uni.showToast({ title: err.message || '提交失败', icon:'none' });
			}
		},
		optionText(item, index) {
			return item.options && item.options[index] !== undefined ? item.options[index] : '--';
		},
		optionLetter(index) {
			return String.fromCharCode(65 + Number(index));
		},
		mediaList(value) {
			if (Array.isArray(value)) return value.map(item => String(item || '').trim()).filter(Boolean);
			return String(value || '').split(/[,\n]/).map(item => item.trim()).filter(Boolean);
		},
		optionImage(item = {}, index) {
			const urls = this.mediaList(item.optionImageUrls || item.optionImages || item.optionImageUrl);
			return this.mediaUrl(urls[index] || '');
		},
		mediaUrl(url = '') {
			const resolved = resolveMediaUrl(url);
			return isUsableMediaUrl(resolved) ? resolved : '';
		},
		stemAudio(item = {}) {
			return this.mediaUrl(item.stemAudioUrl || item.questionAudioUrl || item.audioUrl || item.stemAudio || '');
		},
		previewMedia(url) {
			const current = this.mediaUrl(url);
			if (!current) return;
			uni.previewImage({ urls: [current], current });
		},
		favoriteTargetId(item = {}) {
			return String(item.targetId || item.questionId || item.docId || item.paperId || item.id || item.favoriteId || '').trim();
		},
		async cancelFavorite(item = {}, type = 'doc') {
			const targetId = this.favoriteTargetId(item);
			if (!targetId) return;
			const favoriteType = type === 'paper' ? 'doc' : type;
			try {
				await toggleFavorite({
					type: favoriteType,
					targetId,
					action: 'remove',
					title: item.title || item.stem || '',
					courseId: item.courseId || '',
					category: type === 'paper' ? 'paper' : (type === 'doc' ? (item.category || 'lecture') : '')
				});
				uni.showToast({ title:'已取消收藏', icon:'success' });
				await this.loadData();
			} catch (err) {
				uni.showToast({ title: err.message || '取消失败', icon:'none' });
			}
		},
		questionType(item = {}) {
			const value = item.questionType || item.type || 'choice';
			if (value === 'fill' || value === '填空' || value === '填空题') return 'fill';
			if (value === 'subjective' || value === '主观' || value === '主观题') return 'subjective';
			if (value === 'reading' || value === '阅读理解' || value === '阅读理解题') return 'reading';
			return 'choice';
		},
		subQuestions(item = {}) {
			return Array.isArray(item.subQuestions) ? item.subQuestions : [];
		},
		isAnswerMissing(item) {
			const value = this.answers[item.id];
			return this.questionType(item) === 'choice' ? value === undefined : String(value || '').trim().length === 0;
		},
		answerText(item, result = {}) {
			if (this.questionType(item) === 'choice') return this.optionText(item, result.answer);
			return result.answerText || result.answer || '--';
		},
		goBack() { safeNavigateBack('/pages/member/member'); }
	}
}
</script>

<style lang="scss">
page { background:#f5f7fa; }
.page { min-height:100vh; background:#f5f7fa; padding-bottom:40rpx; }
.nav { position:relative; height:90rpx; background:#fff; display:flex; align-items:center; justify-content:center; border-bottom:1rpx solid #eef0f3; }
.back { position:absolute; left:24rpx; font-size:46rpx; color:#222; cursor:pointer; }
.nav-title { font-size:30rpx; font-weight:700; }
.tabs { display:flex; margin:24rpx; background:#fff; border-radius:14rpx; padding:8rpx; border:1rpx solid #e8edf3; }
.tab { flex:1; height:68rpx; line-height:68rpx; text-align:center; border-radius:10rpx; color:#64748b; font-size:26rpx; font-weight:700; }
.tab.active { background:#1677ff; color:#fff; }
.doc-tabs { display:flex; gap:16rpx; margin:0 24rpx 20rpx; }
.doc-tab { flex:1; height:64rpx; line-height:64rpx; text-align:center; border-radius:12rpx; background:#fff; border:1rpx solid #e5e9ef; color:#64748b; font-size:25rpx; font-weight:800; }
.doc-tab.active { background:#eaf4ff; border-color:#9ac9ff; color:#1677ff; }
.empty { padding:180rpx 0; text-align:center; color:#8a94a3; font-size:28rpx; }
.course-card, .question-card, .doc-card { margin:24rpx; padding:22rpx; background:#fff; border-radius:16rpx; border:1rpx solid #edf0f4; }
.course-card { display:flex; }
.doc-card { display:flex; align-items:center; gap:18rpx; }
.doc-icon { width:84rpx; height:84rpx; border-radius:10rpx; display:flex; align-items:center; justify-content:center; flex-shrink:0; background:#eef6ff; color:#1677ff; font-size:22rpx; font-weight:900; }
.doc-info { flex:1; min-width:0; }
.doc-title { color:#222; font-size:28rpx; font-weight:900; line-height:1.35; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
.doc-meta, .doc-time { margin-top:8rpx; color:#697386; font-size:23rpx; }
.doc-actions { display:flex; flex-direction:column; gap:10rpx; flex-shrink:0; }
.doc-action { min-width:86rpx; height:50rpx; line-height:50rpx; text-align:center; border-radius:999rpx; font-size:23rpx; font-weight:800; }
.doc-action.cancel { background:#fff1f2; color:#e11d48; }
.doc-action.download { background:#eef6ff; color:#2563eb; }
.doc-action.open { background:#ecfdf5; color:#0f766e; }
.cover { width:210rpx; height:146rpx; border-radius:12rpx; flex-shrink:0; background:#e8eef5; }
.course-info { flex:1; min-width:0; margin-left:20rpx; }
.course-title { color:#222; font-size:28rpx; font-weight:800; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.course-expiry { margin-top:10rpx; color:#8a94a3; font-size:23rpx; }
.course-state { margin-top:8rpx; color:#16a34a; font-size:23rpx; }
.course-state.off { color:#e5484d; }
.course-btn { display:inline-block; margin-top:12rpx; padding:8rpx 24rpx; border-radius:26rpx; background:#1677ff; color:#fff; font-size:24rpx; }
.course-btn.disabled { background:#d8dde5; color:#8a929c; }
.question-head { display:flex; align-items:center; justify-content:space-between; gap:16rpx; }
.tag { display:inline-block; padding:6rpx 14rpx; border-radius:8rpx; background:#eef6ff; color:#1677ff; font-size:22rpx; }
.cancel-fav { flex-shrink:0; height:48rpx; line-height:48rpx; padding:0 18rpx; border-radius:999rpx; background:#fff1f2; color:#e11d48; font-size:22rpx; font-weight:800; }
.stem { margin-top:18rpx; font-size:30rpx; line-height:1.5; font-weight:700; color:#222; }
.question-image { width:100%; max-height:420rpx; margin:14rpx 0 4rpx; border-radius:12rpx; background:#eef2f7; }
.option { display:flex; align-items:flex-start; min-height:72rpx; padding:18rpx; margin-top:12rpx; border:1rpx solid #e5e9ef; border-radius:12rpx; font-size:28rpx; color:#333; box-sizing:border-box; }
.option.active { border-color:#1677ff; background:#edf5ff; color:#1677ff; }
.radio { flex-shrink:0; margin-right:14rpx; line-height:1.5; }
.option-body { flex:1; min-width:0; display:grid; gap:12rpx; line-height:1.5; }
.option-image { width:100%; max-height:300rpx; border-radius:10rpx; background:#eef2f7; }
.image-option-label { color:#64748b; font-size:25rpx; }
.reading-sub-card { margin-top:14rpx; padding:16rpx; border:1rpx solid #e5e9ef; border-radius:12rpx; background:#fbfcfe; }
.reading-sub-head { color:#1677ff; font-size:24rpx; font-weight:900; margin-bottom:8rpx; }
.reading-sub-stem { color:#172033; font-size:27rpx; font-weight:800; line-height:1.55; }
.reading-tip { margin-top:14rpx; color:#64748b; font-size:24rpx; line-height:1.5; }
.text-answer { margin-top:12rpx; }
.answer-textarea { width:100%; min-height:118rpx; box-sizing:border-box; padding:18rpx; border:1rpx solid #e5e9ef; border-radius:12rpx; background:#fbfcfe; color:#222; font-size:28rpx; line-height:1.5; }
.analysis { margin-top:18rpx; padding:18rpx; border-radius:12rpx; background:#f8fafc; font-size:26rpx; line-height:1.5; }
.ok { color:#0f9f6e; font-weight:700; }
.bad { color:#e5484d; font-weight:700; }
.review { color:#1677ff; font-weight:700; }
.ana-text { margin-top:8rpx; color:#596272; }
.answer-btn { margin-top:20rpx; height:70rpx; line-height:70rpx; text-align:center; border-radius:12rpx; background:#1677ff; color:#fff; font-size:28rpx; }
</style>

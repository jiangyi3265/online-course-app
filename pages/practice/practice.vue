<template>
	<view class="page">
		<view class="nav">
			<view class="back" @click="goBack">‹</view>
			<view class="nav-title">{{title}}</view>
		</view>

		<view class="hero">
			<view class="hero-title">{{modeText}}</view>
			<view class="hero-sub">共 {{questions.length}} 题，提交后自动生成错题与解析</view>
		</view>

		<view class="question" v-for="(q, i) in questions" :key="q.id">
			<view class="q-head">
				<view class="q-title">
					<text class="difficulty-stars">{{difficultyStars(q)}}</text>
					<text>{{i + 1}}. {{q.stem}}</text>
				</view>
				<view class="collect-btn" :class="{active: q.favorited}" @click="collectQuestion(q)">{{q.favorited ? '已收藏' : '收藏'}}</view>
			</view>
			<image v-if="q.stemImageUrl" class="question-image" :src="q.stemImageUrl" mode="aspectFit" @click="previewMedia(q.stemImageUrl)" />
			<block v-if="questionType(q) === 'choice'">
				<view class="option" v-for="(opt, idx) in q.options" :key="idx" :class="{active: answers[q.id] === idx}" @click="answers[q.id] = idx">
					<text class="radio">{{answers[q.id] === idx ? '●' : '○'}}</text>
					<view class="option-body">
						<text v-if="opt">{{opt}}</text>
						<text v-else class="image-option-label">图片选项</text>
						<image v-if="optionImage(q, idx)" class="option-image" :src="optionImage(q, idx)" mode="aspectFit" @click.stop="previewMedia(optionImage(q, idx))" />
					</view>
				</view>
			</block>
			<view class="text-answer" v-else>
				<view class="manual-answer-row" v-if="!result">
					<textarea
						class="answer-textarea"
						v-model="answers[q.id]"
						:auto-height="true"
						:disabled="false"
						:placeholder="questionType(q) === 'fill' ? '请输入填空答案' : '手动输入解题过程或答案'"
					/>
					<view class="photo-btn" :class="{disabled: uploadingImages[q.id]}" @click="chooseAnswerImage(q)">
						{{uploadingImages[q.id] ? '上传中' : '拍照自评'}}
					</view>
					<view class="skip-btn" :class="{active: noUploads[q.id]}" @click="toggleNoUpload(q)">
						暂不上传
					</view>
				</view>
				<textarea
					v-else
					class="answer-textarea"
					v-model="answers[q.id]"
					:auto-height="true"
					:disabled="true"
					:placeholder="questionType(q) === 'fill' ? '请输入填空答案' : '手动输入解题过程或答案'"
				/>
				<image v-if="answerImages[q.id]" class="answer-photo" :src="answerImages[q.id]" mode="aspectFit" />
				<view class="skip-note" v-if="noUploads[q.id] && !result">已选择暂不上传，请对照参考答案完成自评。</view>
				<view class="inline-review" v-if="showInlineReview(q)">
					<view class="feedback-title">答案自评</view>
					<view class="feedback-options">
						<view class="feedback-option" :class="{active: preReviewResult(q.id) === 'correct'}" @click="setSelfReview(q, 'correct')">
							<text>正确</text><text class="feedback-dot"></text>
						</view>
						<view class="feedback-option" :class="{active: preReviewResult(q.id) === 'wrong'}" @click="setSelfReview(q, 'wrong')">
							<text>错误</text><text class="feedback-dot"></text>
						</view>
						<view class="feedback-option" :class="{active: preReviewResult(q.id) === 'partial'}" @click="setSelfReview(q, 'partial')">
							<text>半对</text><text class="feedback-dot"></text>
						</view>
					</view>
					<view class="feedback-toggle" @click="toggleAnalysis(q.id)">
						<text>查看答案/解析</text>
						<text>{{expandedAnalysis[q.id] ? '收起' : '展开'}} ›</text>
					</view>
					<view class="feedback-body" v-if="expandedAnalysis[q.id]">
						<view class="answer-line">参考答案：{{displayQuestionAnswer(q)}}</view>
						<image v-if="q.answerImageUrl" class="answer-photo" :src="q.answerImageUrl" mode="aspectFit" />
						<analysis-viewer :item="q" :text="q.analysis" />
					</view>
				</view>
			</view>
			<view class="analysis" v-if="result">
				<view v-if="isFeedbackResult(resultMap[q.id])" class="feedback-panel">
					<view class="feedback-title">答案反馈</view>
					<view class="feedback-options" v-if="needsSelfReview(resultMap[q.id])">
						<view class="feedback-option" :class="{active: reviewResult(resultMap[q.id]) === 'correct'}" @click="submitSelfReview(resultMap[q.id], 'correct')">
							<text>正确</text><text class="feedback-dot"></text>
						</view>
						<view class="feedback-option" :class="{active: reviewResult(resultMap[q.id]) === 'wrong'}" @click="submitSelfReview(resultMap[q.id], 'wrong')">
							<text>错误</text><text class="feedback-dot"></text>
						</view>
						<view class="feedback-option" :class="{active: reviewResult(resultMap[q.id]) === 'partial'}" @click="submitSelfReview(resultMap[q.id], 'partial')">
							<text>半对</text><text class="feedback-dot"></text>
						</view>
					</view>
					<view v-else :class="resultStatusClass(resultMap[q.id])">{{resultStatusText(resultMap[q.id])}}</view>
					<view class="feedback-toggle" @click="toggleAnalysis(q.id)">
						<text>查看答案/解析</text>
						<text>{{expandedAnalysis[q.id] ? '收起' : '展开'}} ›</text>
					</view>
					<view class="feedback-body" v-if="expandedAnalysis[q.id]">
						<view class="answer-line">我的答案：{{displayAnswer(resultMap[q.id], 'selected')}}</view>
						<image v-if="resultMap[q.id] && resultMap[q.id].studentAnswerImageUrl" class="answer-photo" :src="resultMap[q.id].studentAnswerImageUrl" mode="aspectFit" />
						<view class="answer-line">参考答案：{{displayAnswer(resultMap[q.id], 'answer')}}</view>
						<image v-if="resultMap[q.id] && resultMap[q.id].answerImageUrl" class="answer-photo" :src="resultMap[q.id].answerImageUrl" mode="aspectFit" />
						<analysis-viewer :item="resultMap[q.id]" :text="resultMap[q.id] && resultMap[q.id].analysis" />
					</view>
				</view>
				<view v-else>
					<view :class="resultStatusClass(resultMap[q.id])">
						{{resultStatusText(resultMap[q.id])}}
					</view>
					<view class="answer-line">我的答案：{{displayAnswer(resultMap[q.id], 'selected')}}</view>
					<image v-if="resultMap[q.id] && resultMap[q.id].studentAnswerImageUrl" class="answer-photo" :src="resultMap[q.id].studentAnswerImageUrl" mode="aspectFit" />
					<view class="answer-line">参考答案：{{displayAnswer(resultMap[q.id], 'answer')}}</view>
					<image v-if="resultMap[q.id] && resultMap[q.id].answerImageUrl" class="answer-photo" :src="resultMap[q.id].answerImageUrl" mode="aspectFit" />
					<analysis-viewer :item="resultMap[q.id]" :text="resultMap[q.id] && resultMap[q.id].analysis" />
				</view>
			</view>
		</view>

		<view class="result" v-if="result">
			<view class="score">{{result.score}}分</view>
			<view class="result-text">答对 {{result.correct}} / {{result.total}} 题</view>
			<view class="result-text" v-if="result.manualReviewCount">主观题 {{result.manualReviewCount}} 道，请查看参考答案自评</view>
			<view class="result-actions">
				<view class="ghost-btn" @click="goWrongBook">查看错题与巩固</view>
				<view class="primary-btn" @click="reload">再练一次</view>
			</view>
		</view>

		<view class="overview" v-if="result">
			<view class="overview-title">题目总览</view>
			<view class="overview-row" v-for="(item, index) in resultDetails" :key="item.id">
				<view class="overview-count">题目数：{{index + 1}}/{{resultDetails.length}}</view>
				<image v-if="item.stemImageUrl" class="question-image compact" :src="item.stemImageUrl" mode="aspectFit" @click="previewMedia(item.stemImageUrl)" />
				<view>我的答案：{{displayAnswer(item, 'selected')}}</view>
				<view>参考答案：{{displayAnswer(item, 'answer')}}</view>
				<analysis-viewer :item="item" :text="item.analysis" />
			</view>
		</view>

		<view class="footer">
			<view class="submit" :class="{submitted: result}" @click="submit">{{result ? '已提交' : '提交答案'}}</view>
			<view v-if="result" class="footer-back" @click="goBack">返回上一页</view>
		</view>
	</view>
</template>

<script>
import { getFavorites, getPractice, getQuiz, getReinforcePractice, getWrongRetry, submitPractice, submitPracticeSelfReview, submitQuiz, toggleFavorite, uploadAnswerImage } from '@/common/api.js'
import AnalysisViewer from '@/components/analysis-viewer.vue'

export default {
	components: { AnalysisViewer },
	data() {
		return {
			type: 'practice',
			title: '真题讲练',
			practiceTitle: '',
			pointId: '',
			count: 5,
			source: '全部',
			courseId: 'gk-math-full',
			questionIds: [],
			sourceWrongIds: [],
			questions: [],
			answers: {},
			answerImages: {},
			uploadingImages: {},
			expandedAnalysis: {},
			noUploads: {},
			selfReviews: {},
			reviewVisible: {},
			result: null
		}
	},
	computed: {
		modeText() {
			const map = { practice: '真题讲练', quiz: '章节扫雷', reinforce: '复习测试', wrongRetry: '错题重练' };
			return map[this.type] || '练习测评';
		},
		resultMap() {
			const map = {};
			(this.result && this.result.details || []).forEach(item => { map[item.id] = item; });
			return map;
		},
		resultDetails() {
			return (this.result && this.result.details) || [];
		}
	},
	onLoad(opts = {}) {
		this.type = opts.type || 'practice';
		this.title = decodeURIComponent(opts.title || opts.quizId || '真题讲练');
		this.practiceTitle = decodeURIComponent(opts.practiceTitle || '');
		this.pointId = opts.pointId || '';
		this.count = Number(opts.count || 5);
		this.source = decodeURIComponent(opts.source || '全部');
		this.courseId = decodeURIComponent(opts.courseId || 'gk-math-full');
		this.questionIds = String(decodeURIComponent(opts.questionIds || '')).split(',').map(item => item.trim()).filter(Boolean);
		this.loadData();
	},
	methods: {
		async loadData() {
			try {
				const practiceLookupTitle = this.practiceTitle || this.title;
				const usePracticeLookup = this.type === 'reinforce' && !this.pointId;
				const data = this.type === 'quiz'
					? await getQuiz(this.title, this.courseId, this.questionIds)
					: this.type === 'reinforce' && !usePracticeLookup
						? await getReinforcePractice(this.pointId)
						: this.type === 'wrongRetry'
							? await getWrongRetry(this.count, this.source, this.courseId)
							: await getPractice(practiceLookupTitle, this.questionIds, this.type, this.courseId);
				if (!usePracticeLookup) this.title = data.title || this.title;
				this.questions = data.questions || [];
				this.sourceWrongIds = data.sourceWrongIds || [];
				this.answers = {};
				this.answerImages = {};
				this.uploadingImages = {};
				this.expandedAnalysis = {};
				this.noUploads = {};
				this.selfReviews = {};
				this.reviewVisible = {};
				this.result = null;
				this.syncFavoriteState();
				if (this.type === 'wrongRetry' && this.questions.length === 0) {
					uni.showToast({ title: '当前没有可重练的错题', icon: 'none' });
				}
			} catch (err) {
				uni.showToast({ title: err.message || '加载失败', icon: 'none' });
			}
		},
		async submit() {
			if (this.result) return;
			if (this.questions.length === 0) {
				uni.showToast({ title: '当前没有可提交的题目', icon: 'none' });
				return;
			}
			if (this.questions.some(q => this.isAnswerMissing(q))) {
				uni.showToast({ title: '请完成全部题目', icon: 'none' });
				return;
			}
			if (this.questions.some(q => this.needsPreSubmitReview(q))) {
				uni.showToast({ title: '请先完成拍照自评或暂不上传后的答案自评', icon: 'none' });
				return;
			}
			try {
				const payload = {
					title: this.title,
					type: this.type,
					answers: this.answers,
					answerImages: this.answerImages,
					noUploads: this.noUploads,
					selfReviews: this.selfReviews,
					questionIds: this.questions.map(item => item.id),
					sourceWrongIds: this.sourceWrongIds,
					courseId: this.courseId,
					quizId: this.title
				};
				this.result = this.type === 'quiz' ? await submitQuiz(payload) : await submitPractice(payload);
			} catch (err) {
				uni.showToast({ title: err.message || '提交失败', icon: 'none' });
			}
		},
		async syncFavoriteState() {
			try {
				const data = await getFavorites();
				const favoriteIds = new Set(((data && data.questions) || []).map(item => String(item.id || item.targetId || '')));
				this.questions.forEach(question => {
					question.favorited = favoriteIds.has(String(question.id || ''));
				});
				if (this.$forceUpdate) this.$forceUpdate();
			} catch (err) {}
		},
		async collectQuestion(q) {
			try {
				const result = await toggleFavorite({
					type: 'question',
					targetId: q.id,
					title: q.stem,
					courseId: this.courseId || 'gk-math-full'
				});
				q.favorited = !!result.favorited;
				if (this.$forceUpdate) this.$forceUpdate();
				uni.showToast({ title: result.favorited ? '已收藏' : '已取消收藏', icon:'success' });
			} catch (err) {
				uni.showToast({ title: err.message || '收藏失败', icon:'none' });
			}
		},
		setMapValue(map, key, value) {
			if (this.$set) {
				this.$set(map, key, value);
			} else {
				map[key] = value;
				if (this.$forceUpdate) this.$forceUpdate();
			}
		},
		chooseAnswerImage(question) {
			if (this.result || this.uploadingImages[question.id]) return;
			uni.chooseImage({
				count: 1,
				sourceType: ['album', 'camera'],
				success: async res => {
					const path = (res.tempFilePaths && res.tempFilePaths[0]) || '';
					if (path) {
						this.setMapValue(this.uploadingImages, question.id, true);
						this.setMapValue(this.answerImages, question.id, path);
						this.setMapValue(this.noUploads, question.id, false);
						try {
							const url = await uploadAnswerImage(path);
							if (url) this.setMapValue(this.answerImages, question.id, url);
							this.openSelfReview(question);
							uni.showToast({ title: '答案图片已上传', icon: 'success' });
						} catch (err) {
							this.setMapValue(this.answerImages, question.id, '');
							uni.showToast({ title: err.message || '图片上传失败', icon:'none' });
						} finally {
							this.setMapValue(this.uploadingImages, question.id, false);
						}
					}
				},
				fail: () => {}
			});
		},
		toggleNoUpload(question) {
			if (this.result) return;
			const next = !this.noUploads[question.id];
			this.setMapValue(this.noUploads, question.id, next);
			if (next) {
				this.setMapValue(this.answerImages, question.id, '');
				this.openSelfReview(question);
			} else {
				this.setMapValue(this.selfReviews, question.id, '');
				this.setMapValue(this.reviewVisible, question.id, false);
			}
		},
		openSelfReview(question) {
			if (!question || this.questionType(question) === 'choice') return;
			this.setMapValue(this.reviewVisible, question.id, true);
			this.setMapValue(this.expandedAnalysis, question.id, true);
		},
		setSelfReview(question, reviewResult) {
			if (!question || this.result) return;
			this.openSelfReview(question);
			const normalized = reviewResult === 'partial' ? 'partial' : (reviewResult === 'correct' ? 'correct' : 'wrong');
			this.setMapValue(this.selfReviews, question.id, normalized);
		},
		preReviewResult(questionId) {
			return this.selfReviews[questionId] || '';
		},
		showInlineReview(question) {
			return !this.result && this.questionType(question) !== 'choice' && !!this.reviewVisible[question.id];
		},
		needsPreSubmitReview(question) {
			return this.questionType(question) !== 'choice' && !this.selfReviews[question.id];
		},
		async submitSelfReview(item, reviewResult) {
			if (!item || !this.result) return;
			const normalized = reviewResult === 'partial' ? 'partial' : (reviewResult === 'correct' ? 'correct' : 'wrong');
			try {
				const data = await submitPracticeSelfReview({
					attemptId: this.result.id,
					questionId: item.id,
					reviewResult: normalized,
					correct: normalized === 'correct'
				});
				this.result = data.attempt || this.result;
				this.setMapValue(this.expandedAnalysis, item.id, true);
				uni.showToast({ title: this.reviewToastText(normalized), icon:'success' });
			} catch (err) {
				uni.showToast({ title: err.message || '自评保存失败', icon:'none' });
			}
		},
		mediaList(value) {
			if (Array.isArray(value)) return value.map(item => String(item || '').trim()).filter(Boolean);
			return String(value || '').split(/[,\n]/).map(item => item.trim()).filter(Boolean);
		},
		optionImage(item = {}, index) {
			const urls = this.mediaList(item.optionImageUrls || item.optionImages || item.optionImageUrl);
			return urls[index] || '';
		},
		previewMedia(url) {
			if (!url) return;
			uni.previewImage({ urls: [url], current: url });
		},
		answerLetter(value) {
			const index = Number(value);
			return Number.isFinite(index) && index >= 0 ? String.fromCharCode(65 + index) : '--';
		},
		questionType(question = {}) {
			const value = question.questionType || question.type || 'choice';
			if (value === 'fill' || value === '填空' || value === '填空题') return 'fill';
			if (value === 'subjective' || value === '主观' || value === '主观题') return 'subjective';
			return 'choice';
		},
		isAnswerMissing(question) {
			if (this.noUploads[question.id]) return false;
			const value = this.answers[question.id];
			return this.questionType(question) === 'choice'
				? value === undefined
				: String(value || '').trim().length === 0 && !this.answerImages[question.id];
		},
		displayAnswer(item = {}, field = 'selected') {
			if (!item) return '--';
			const type = this.questionType(item);
			if (field === 'selected') {
				if (item.noUpload) return '暂不上传';
				if (item.skipped) return '已跳过';
				return item.selectedText || (type === 'choice' ? this.answerLetter(item.selected) : String(item.selected || '').trim()) || (item.studentAnswerImageUrl ? '已上传图片答案' : '--');
			}
			return item.answerText || (type === 'choice' ? this.answerLetter(item.answer) : String(item.answer || '').trim()) || (item.answerImageUrl ? '见参考答案图片' : '--');
		},
		displayQuestionAnswer(question = {}) {
			if (!question) return '--';
			return question.answerText || String(question.answer || '').trim() || (question.answerImageUrl ? '见参考答案图片' : '--');
		},
		isFeedbackResult(item = {}) {
			return !!(item && (item.manualReview || item.skipped || this.questionType(item) !== 'choice'));
		},
		needsSelfReview(item = {}) {
			return !!(item && item.manualReview && !item.selfReviewed && !item.skipped);
		},
		reviewResult(item = {}) {
			if (item && item.reviewResult) return item.reviewResult;
			if (item && item.selfReviewed) return item.correct ? 'correct' : 'wrong';
			return '';
		},
		reviewToastText(result) {
			if (result === 'correct') return '已记为正确';
			if (result === 'partial') return '已记为半对';
			return '已记为错误';
		},
		resultStatusText(item = {}) {
			if (item && item.skipped) return '已跳过，计为错误';
			if (item && item.selfReviewed) {
				if (item.reviewResult === 'partial') return '已自评：半对';
				return item.correct ? '已自评：正确' : '已自评：错误';
			}
			if (item && item.manualReview) return '已提交，查看参考答案自评';
			return item && item.correct ? '回答正确' : '回答错误';
		},
		resultStatusClass(item = {}) {
			if (item && item.reviewResult === 'partial') return 'partial';
			if (item && item.manualReview) return 'review';
			return item && item.correct ? 'ok' : 'bad';
		},
		difficultyStars(question = {}) {
			const value = Math.max(1, Math.min(5, Number(question.difficulty || 1)));
			return '★'.repeat(value) + '☆'.repeat(5 - value);
		},
		toggleAnalysis(questionId) {
			this.setMapValue(this.expandedAnalysis, questionId, !this.expandedAnalysis[questionId]);
		},
		reload() { this.loadData(); },
		goWrongBook() {
			uni.navigateTo({ url: `/pages/wrongbook/wrongbook?courseId=${encodeURIComponent(this.courseId || 'gk-math-full')}` });
		},
		goBack() {
			const pages = typeof getCurrentPages === 'function' ? getCurrentPages() : [];
			if (pages.length > 1) {
				uni.navigateBack({ fail: () => this.goHome() });
				return;
			}
			this.goHome();
		},
		goHome() {
			uni.reLaunch({ url: '/pages/index/index' });
		}
	}
}
</script>

<style lang="scss">
page { background:#f5f7fa; }
.page { min-height:100vh; padding-bottom:150rpx; background:#f5f7fa; }
.nav { position:relative; height:90rpx; background:#fff; display:flex; align-items:center; justify-content:center; border-bottom:1rpx solid #eef0f3; }
.back { position:absolute; left:24rpx; font-size:46rpx; color:#222; cursor:pointer; }
.nav-title { font-size:30rpx; font-weight:700; color:#222; }
.hero { margin:24rpx; padding:28rpx; border-radius:16rpx; background:#1677ff; color:#fff; }
.hero-title { font-size:36rpx; font-weight:800; }
.hero-sub { margin-top:10rpx; font-size:24rpx; opacity:.9; }
.question { margin:24rpx; padding:26rpx; background:#fff; border-radius:16rpx; border:1rpx solid #edf0f4; }
.q-head { display:flex; align-items:flex-start; gap:16rpx; margin-bottom:18rpx; }
.q-title { flex:1; min-width:0; font-size:30rpx; color:#222; font-weight:700; line-height:1.5; }
.difficulty-stars { display:inline-block; margin-right:12rpx; color:#f59e0b; font-size:24rpx; letter-spacing:0; vertical-align:2rpx; }
.collect-btn { flex-shrink:0; padding:8rpx 18rpx; border-radius:24rpx; border:1rpx solid #d7e6ff; background:#eef6ff; color:#1677ff; font-size:24rpx; font-weight:700; }
.collect-btn.active { border-color:#f6d365; background:#fff8e6; color:#d97706; }
.question-image { width:100%; max-height:420rpx; margin:4rpx 0 16rpx; border-radius:12rpx; background:#eef2f7; }
.question-image.compact { max-height:260rpx; margin:10rpx 0; }
.option { display:flex; align-items:flex-start; min-height:72rpx; padding:18rpx; margin-top:12rpx; border:1rpx solid #e5e9ef; border-radius:12rpx; font-size:28rpx; color:#333; box-sizing:border-box; }
.option.active { border-color:#1677ff; background:#edf5ff; color:#1677ff; }
.radio { flex-shrink:0; margin-right:14rpx; line-height:1.5; }
.option-body { flex:1; min-width:0; display:grid; gap:12rpx; line-height:1.5; }
.option-image { width:100%; max-height:300rpx; border-radius:10rpx; background:#eef2f7; }
.image-option-label { color:#64748b; font-size:25rpx; }
.text-answer { margin-top:12rpx; }
.manual-answer-row { display:grid; grid-template-columns:minmax(0, 1fr) 148rpx 130rpx; gap:10rpx; align-items:stretch; }
.answer-textarea { width:100%; min-height:118rpx; box-sizing:border-box; padding:18rpx; border:1rpx solid #e5e9ef; border-radius:12rpx; background:#fbfcfe; color:#222; font-size:28rpx; line-height:1.5; }
.answer-photo { width:100%; max-height:360rpx; margin-top:14rpx; border-radius:12rpx; background:#eef2f7; }
.photo-btn,
.skip-btn { min-height:118rpx; display:flex; align-items:center; justify-content:center; text-align:center; border-radius:12rpx; font-size:25rpx; line-height:1.25; font-weight:800; box-sizing:border-box; padding:0 12rpx; }
.photo-btn { border:2rpx solid #1677ff; color:#1677ff; background:#fff; }
.photo-btn.disabled { opacity:.58; background:#f8fafc; }
.skip-btn { border:2rpx solid #f97316; color:#ea580c; background:#fff; }
.skip-btn.active { background:#fff7ed; }
.skip-note { margin-top:12rpx; color:#ea580c; font-size:24rpx; }
.subjective-actions,
.review-actions { display:flex; gap:14rpx; margin-top:16rpx; }
.outline-btn,
.review-btn { flex:1; height:68rpx; line-height:68rpx; text-align:center; border-radius:10rpx; font-size:26rpx; font-weight:800; box-sizing:border-box; }
.outline-btn { border:2rpx solid #1677ff; color:#1677ff; background:#fff; }
.outline-btn.danger { border-color:#ef4444; color:#ef4444; }
.outline-btn.active { background:#fff1f2; }
.review-btn { background:#fff; }
.ok-btn { border:2rpx solid #1677ff; color:#1677ff; }
.bad-btn { border:2rpx solid #ef4444; color:#ef4444; }
.analysis { margin-top:18rpx; padding:18rpx; border-radius:12rpx; background:#f8fafc; font-size:26rpx; line-height:1.5; }
.ok { color:#0f9f6e; font-weight:700; }
.bad { color:#e5484d; font-weight:700; }
.review { color:#1677ff; font-weight:700; }
.partial { color:#f59e0b; font-weight:700; }
.answer-line { margin-top:8rpx; color:#334155; font-size:25rpx; }
.ana-text { margin-top:8rpx; color:#596272; }
.feedback-panel { padding:6rpx 0 0; }
.inline-review { margin-top:16rpx; padding:18rpx; border-radius:14rpx; border:1rpx solid #e5e9ef; background:#f8fafc; }
.feedback-title { color:#111827; font-size:28rpx; font-weight:900; margin-bottom:18rpx; }
.feedback-options { display:grid; grid-template-columns:repeat(3, minmax(0, 1fr)); gap:14rpx; margin-bottom:20rpx; }
.feedback-option { min-height:68rpx; padding:0 16rpx; display:flex; align-items:center; justify-content:space-between; border:2rpx solid #e5e9ef; border-radius:12rpx; background:#fff; color:#111827; font-size:26rpx; font-weight:800; box-sizing:border-box; }
.feedback-option.active { border-color:#1677ff; color:#1677ff; background:#edf5ff; }
.feedback-dot { width:34rpx; height:34rpx; border-radius:50%; border:3rpx solid #e5e9ef; box-sizing:border-box; }
.feedback-option.active .feedback-dot { border-color:#1677ff; box-shadow:inset 0 0 0 8rpx #fff; background:#1677ff; }
.feedback-toggle { margin-top:18rpx; padding-top:18rpx; border-top:1rpx solid #edf0f4; display:flex; align-items:center; justify-content:space-between; color:#111827; font-size:28rpx; font-weight:900; }
.feedback-toggle text:last-child { color:#596272; font-size:26rpx; }
.feedback-body { padding-top:8rpx; }
.result { margin:24rpx; padding:30rpx; background:#fff; border-radius:16rpx; text-align:center; border:1rpx solid #edf0f4; }
.score { color:#1677ff; font-size:64rpx; font-weight:900; }
.result-text { margin-top:8rpx; color:#596272; font-size:28rpx; }
.result-actions { display:flex; gap:18rpx; margin-top:24rpx; }
.ghost-btn, .primary-btn { flex:1; height:74rpx; line-height:74rpx; border-radius:12rpx; font-size:28rpx; }
.ghost-btn { background:#eef2f7; color:#222; }
.primary-btn { background:#1677ff; color:#fff; }
.overview { margin:24rpx; padding:26rpx; background:#fff; border-radius:16rpx; border:1rpx solid #edf0f4; }
.overview-title { color:#222; font-size:30rpx; font-weight:800; }
.overview-row { padding:18rpx 0; border-bottom:1rpx solid #edf0f4; color:#334155; font-size:26rpx; line-height:1.6; }
.overview-row:last-child { border-bottom:0; padding-bottom:0; }
.overview-count { font-weight:800; color:#222; }
.overview-analysis { margin-top:8rpx; color:#596272; }
.footer { position:fixed; left:0; right:0; bottom:0; padding:20rpx 24rpx 34rpx; display:flex; gap:16rpx; background:#fff; box-shadow:0 -4rpx 16rpx rgba(0,0,0,.05); box-sizing:border-box; }
.submit,
.footer-back { flex:1; height:88rpx; line-height:88rpx; text-align:center; border-radius:44rpx; background:#1677ff; color:#fff; font-size:30rpx; font-weight:800; box-sizing:border-box; }
.submit.submitted { opacity:.92; }
</style>

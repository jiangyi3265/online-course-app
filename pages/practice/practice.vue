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
			<view class="q-title">{{i + 1}}. {{q.stem}}</view>
			<view class="option" v-for="(opt, idx) in q.options" :key="opt" :class="{active: answers[q.id] === idx}" @click="answers[q.id] = idx">
				<text class="radio">{{answers[q.id] === idx ? '●' : '○'}}</text>
				<text>{{opt}}</text>
			</view>
			<view class="analysis" v-if="result">
				<view :class="resultMap[q.id] && resultMap[q.id].correct ? 'ok' : 'bad'">
					{{resultMap[q.id] && resultMap[q.id].correct ? '回答正确' : '回答错误'}}
				</view>
				<view class="ana-text">解析：{{resultMap[q.id] && resultMap[q.id].analysis}}</view>
			</view>
		</view>

		<view class="result" v-if="result">
			<view class="score">{{result.score}}分</view>
			<view class="result-text">答对 {{result.correct}} / {{result.total}} 题</view>
			<view class="result-actions">
				<view class="ghost-btn" @click="goWrongBook">查看错题与测试</view>
				<view class="primary-btn" @click="reload">再练一次</view>
			</view>
		</view>

		<view class="footer">
			<view class="submit" @click="submit">{{result ? '已提交' : '提交答案'}}</view>
		</view>
	</view>
</template>

<script>
import { getPractice, getQuiz, getReinforcePractice, submitPractice, submitQuiz } from '@/common/api.js'

export default {
	data() {
		return {
			type: 'practice',
			title: '真题讲练',
			pointId: '',
			questions: [],
			answers: {},
			result: null
		}
	},
	computed: {
		modeText() {
			const map = { practice: '章节测试', quiz: '知识扫雷', reinforce: '复习测试' };
			return map[this.type] || '练习测评';
		},
		resultMap() {
			const map = {};
			(this.result && this.result.details || []).forEach(item => { map[item.id] = item; });
			return map;
		}
	},
	onLoad(opts = {}) {
		this.type = opts.type || 'practice';
		this.title = decodeURIComponent(opts.title || opts.quizId || '真题讲练');
		this.pointId = opts.pointId || '';
		this.loadData();
	},
	methods: {
		async loadData() {
			try {
				const data = this.type === 'quiz'
					? await getQuiz(this.title)
					: this.type === 'reinforce'
						? await getReinforcePractice(this.pointId)
						: await getPractice(this.title);
				this.title = data.title || this.title;
				this.questions = data.questions || [];
				this.answers = {};
				this.result = null;
			} catch (err) {
				uni.showToast({ title: err.message || '加载失败', icon: 'none' });
			}
		},
		async submit() {
			if (this.result) return;
			if (this.questions.some(q => this.answers[q.id] === undefined)) {
				uni.showToast({ title: '请完成全部题目', icon: 'none' });
				return;
			}
			try {
				const payload = {
					title: this.title,
					type: this.type,
					answers: this.answers,
					questionIds: this.questions.map(item => item.id),
					quizId: this.title
				};
				this.result = this.type === 'quiz' ? await submitQuiz(payload) : await submitPractice(payload);
			} catch (err) {
				uni.showToast({ title: err.message || '提交失败', icon: 'none' });
			}
		},
		reload() { this.loadData(); },
		goWrongBook() { uni.navigateTo({ url: '/pages/wrongbook/wrongbook' }); },
		goBack() { uni.navigateBack({ fail:()=>{} }); }
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
.q-title { font-size:30rpx; color:#222; font-weight:700; line-height:1.5; margin-bottom:18rpx; }
.option { display:flex; align-items:center; min-height:72rpx; padding:0 18rpx; margin-top:12rpx; border:1rpx solid #e5e9ef; border-radius:12rpx; font-size:28rpx; color:#333; }
.option.active { border-color:#1677ff; background:#edf5ff; color:#1677ff; }
.radio { margin-right:14rpx; }
.analysis { margin-top:18rpx; padding:18rpx; border-radius:12rpx; background:#f8fafc; font-size:26rpx; line-height:1.5; }
.ok { color:#0f9f6e; font-weight:700; }
.bad { color:#e5484d; font-weight:700; }
.ana-text { margin-top:8rpx; color:#596272; }
.result { margin:24rpx; padding:30rpx; background:#fff; border-radius:16rpx; text-align:center; border:1rpx solid #edf0f4; }
.score { color:#1677ff; font-size:64rpx; font-weight:900; }
.result-text { margin-top:8rpx; color:#596272; font-size:28rpx; }
.result-actions { display:flex; gap:18rpx; margin-top:24rpx; }
.ghost-btn, .primary-btn { flex:1; height:74rpx; line-height:74rpx; border-radius:12rpx; font-size:28rpx; }
.ghost-btn { background:#eef2f7; color:#222; }
.primary-btn { background:#1677ff; color:#fff; }
.footer { position:fixed; left:0; right:0; bottom:0; padding:20rpx 24rpx 34rpx; background:#fff; box-shadow:0 -4rpx 16rpx rgba(0,0,0,.05); }
.submit { height:88rpx; line-height:88rpx; text-align:center; border-radius:44rpx; background:#1677ff; color:#fff; font-size:30rpx; font-weight:800; }
</style>

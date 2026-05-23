<template>
	<view class="page">
		<view class="nav"><view class="back" @click="goBack">‹</view><view class="nav-title">我的收藏</view></view>

		<view class="tabs">
			<view class="tab" :class="{active: tab === 'course'}" @click="tab='course'">收藏课程</view>
			<view class="tab" :class="{active: tab === 'question'}" @click="tab='question'">收藏题目</view>
		</view>

		<block v-if="tab === 'course'">
			<view class="empty" v-if="!courses.length">暂无收藏课程</view>
			<view class="course-card" v-for="item in courses" :key="item.id">
				<image class="cover" :src="item.cover" mode="aspectFill" />
				<view class="course-info">
					<view class="course-title">{{item.title}}</view>
					<view class="course-expiry">有效期至：{{item.expiry || '未开通'}}</view>
					<view class="course-state" :class="{off: !item.available}">{{item.available ? '权限有效' : '权限已过期/未开通'}}</view>
					<view class="course-btn" :class="{disabled: !item.available}" @click="openCourse(item)">去学习</view>
				</view>
			</view>
		</block>

		<block v-else>
			<view class="empty" v-if="!questions.length">暂无收藏题目</view>
			<view class="question-card" v-for="item in questions" :key="item.id">
				<view class="tag">{{item.knowledge || '题目'}}</view>
				<view class="stem">{{item.stem}}</view>
				<view class="option" v-for="(opt, idx) in item.options" :key="opt" :class="{active: answers[item.id] === idx}" @click="answers[item.id] = idx">
					<text class="radio">{{answers[item.id] === idx ? '●' : '○'}}</text>
					<text>{{opt}}</text>
				</view>
				<view class="analysis" v-if="results[item.id]">
					<view :class="results[item.id].correct ? 'ok' : 'bad'">{{results[item.id].correct ? '回答正确' : '回答错误'}}</view>
					<view class="ana-text">正确答案：{{optionText(item, results[item.id].answer)}}</view>
					<analysis-viewer :item="results[item.id]" :text="results[item.id].analysis" />
				</view>
				<view class="answer-btn" @click="submitQuestion(item)">提交作答</view>
			</view>
		</block>
	</view>
</template>

<script>
import { answerFavoriteQuestion, getFavorites } from '@/common/api.js'
import AnalysisViewer from '@/components/analysis-viewer.vue'

export default {
	components: { AnalysisViewer },
	data() {
		return {
			tab: 'course',
			courses: [],
			questions: [],
			answers: {},
			results: {}
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
		async submitQuestion(item) {
			if (this.answers[item.id] === undefined) {
				uni.showToast({ title:'请选择答案', icon:'none' });
				return;
			}
			try {
				const result = await answerFavoriteQuestion({ questionId: item.id, selected: this.answers[item.id] });
				this.results = { ...this.results, [item.id]: result };
			} catch (err) {
				uni.showToast({ title: err.message || '提交失败', icon:'none' });
			}
		},
		optionText(item, index) {
			return item.options && item.options[index] !== undefined ? item.options[index] : '--';
		},
		goBack() { uni.navigateBack({ fail:()=>{} }); }
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
.empty { padding:180rpx 0; text-align:center; color:#8a94a3; font-size:28rpx; }
.course-card, .question-card { margin:24rpx; padding:22rpx; background:#fff; border-radius:16rpx; border:1rpx solid #edf0f4; }
.course-card { display:flex; }
.cover { width:210rpx; height:146rpx; border-radius:12rpx; flex-shrink:0; background:#e8eef5; }
.course-info { flex:1; min-width:0; margin-left:20rpx; }
.course-title { color:#222; font-size:28rpx; font-weight:800; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.course-expiry { margin-top:10rpx; color:#8a94a3; font-size:23rpx; }
.course-state { margin-top:8rpx; color:#16a34a; font-size:23rpx; }
.course-state.off { color:#e5484d; }
.course-btn { display:inline-block; margin-top:12rpx; padding:8rpx 24rpx; border-radius:26rpx; background:#1677ff; color:#fff; font-size:24rpx; }
.course-btn.disabled { background:#d8dde5; color:#8a929c; }
.tag { display:inline-block; padding:6rpx 14rpx; border-radius:8rpx; background:#eef6ff; color:#1677ff; font-size:22rpx; }
.stem { margin-top:18rpx; font-size:30rpx; line-height:1.5; font-weight:700; color:#222; }
.option { display:flex; align-items:center; min-height:72rpx; padding:0 18rpx; margin-top:12rpx; border:1rpx solid #e5e9ef; border-radius:12rpx; font-size:28rpx; color:#333; }
.option.active { border-color:#1677ff; background:#edf5ff; color:#1677ff; }
.radio { margin-right:14rpx; }
.analysis { margin-top:18rpx; padding:18rpx; border-radius:12rpx; background:#f8fafc; font-size:26rpx; line-height:1.5; }
.ok { color:#0f9f6e; font-weight:700; }
.bad { color:#e5484d; font-weight:700; }
.ana-text { margin-top:8rpx; color:#596272; }
.answer-btn { margin-top:20rpx; height:70rpx; line-height:70rpx; text-align:center; border-radius:12rpx; background:#1677ff; color:#fff; font-size:28rpx; }
</style>

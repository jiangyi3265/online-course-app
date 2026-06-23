<template>
	<view class="page">
		<view class="nav"><view class="back" @click="goBack">‹</view><view class="nav-title">外语词汇</view></view>

		<view class="hero">
			<view>
				<view class="hero-title">英语单词工具</view>
				<view class="hero-sub">今日已掌握 {{knownCount}} / {{words.length}} 个</view>
			</view>
			<view class="hero-badge">Aa</view>
		</view>

		<view class="form-card">
			<input class="input" v-model.trim="form.word" placeholder="输入英语单词" />
			<input class="input" v-model.trim="form.meaning" placeholder="输入中文释义" />
			<view class="primary" @click="addWord">保存词汇</view>
		</view>

		<view class="list-title">今日词汇</view>
		<view class="empty" v-if="!words.length">暂无词汇，先添加一个单词吧</view>
		<view class="word-card" v-for="item in words" :key="item.id">
			<view class="word-main">
				<view class="word">{{item.word}}</view>
				<view class="meaning">{{item.meaning}}</view>
			</view>
			<view class="word-actions">
				<view class="small-btn" :class="{done:item.known}" @click="toggleKnown(item)">{{item.known ? '已掌握' : '掌握'}}</view>
				<view class="small-btn ghost" @click="removeWord(item)">删除</view>
			</view>
		</view>
	</view>
</template>

<script>
import { safeNavigateBack } from '@/common/navigation.js'

const WORD_KEY = 'englishVocabularyWords'

export default {
	data() {
		return {
			words: [],
			form: { word: '', meaning: '' }
		}
	},
	computed: {
		knownCount() {
			return this.words.filter(item => item.known).length;
		}
	},
	onShow() {
		this.words = uni.getStorageSync(WORD_KEY) || [
			{ id:'w-1', word:'analysis', meaning:'分析；解析', known:false },
			{ id:'w-2', word:'practice', meaning:'练习；实践', known:true }
		];
		this.save();
	},
	methods: {
		addWord() {
			if (!this.form.word || !this.form.meaning) {
				uni.showToast({ title:'请填写单词和释义', icon:'none' });
				return;
			}
			this.words.unshift({ id:`w-${Date.now()}`, word:this.form.word, meaning:this.form.meaning, known:false });
			this.form.word = '';
			this.form.meaning = '';
			this.save();
			uni.showToast({ title:'已保存', icon:'success' });
		},
		toggleKnown(item) {
			item.known = !item.known;
			this.save();
		},
		removeWord(item) {
			this.words = this.words.filter(word => word.id !== item.id);
			this.save();
		},
		save() {
			uni.setStorageSync(WORD_KEY, this.words);
		},
		goBack() { safeNavigateBack('/pages/index/index'); }
	}
}
</script>

<style lang="scss">
page { background:#f5f7fa; }
.page { min-height:100vh; background:#f5f7fa; padding-bottom:40rpx; }
.nav { position:relative; height:90rpx; background:#fff; display:flex; align-items:center; justify-content:center; border-bottom:1rpx solid #eef0f3; }
.back { position:absolute; left:24rpx; font-size:46rpx; color:#222; cursor:pointer; }
.nav-title { font-size:30rpx; font-weight:700; }
.hero { margin:24rpx; padding:32rpx; border-radius:16rpx; background:#0f766e; color:#fff; display:flex; align-items:center; justify-content:space-between; }
.hero-title { font-size:38rpx; font-weight:900; }
.hero-sub { margin-top:10rpx; font-size:24rpx; opacity:.9; }
.hero-badge { width:76rpx; height:76rpx; border-radius:16rpx; background:rgba(255,255,255,.18); display:flex; align-items:center; justify-content:center; font-size:30rpx; font-weight:900; }
.form-card, .word-card { margin:0 24rpx 18rpx; padding:24rpx; background:#fff; border:1rpx solid #edf0f4; border-radius:16rpx; }
.input { height:78rpx; border-radius:12rpx; background:#f3f6fa; padding:0 18rpx; font-size:27rpx; margin-bottom:14rpx; box-sizing:border-box; }
.primary { height:76rpx; line-height:76rpx; text-align:center; border-radius:12rpx; background:#1677ff; color:#fff; font-size:28rpx; font-weight:800; }
.list-title { margin:28rpx 30rpx 18rpx; font-size:32rpx; color:#222; font-weight:900; }
.empty { padding:80rpx 0; text-align:center; color:#8a94a3; font-size:28rpx; }
.word-card { display:flex; align-items:center; justify-content:space-between; }
.word-main { min-width:0; flex:1; }
.word { color:#222; font-size:34rpx; font-weight:900; }
.meaning { color:#697386; font-size:26rpx; margin-top:8rpx; }
.word-actions { display:flex; gap:10rpx; margin-left:16rpx; }
.small-btn { padding:12rpx 18rpx; border-radius:10rpx; background:#1677ff; color:#fff; font-size:24rpx; font-weight:700; }
.small-btn.done { background:#20b486; }
.small-btn.ghost { background:#eef2f7; color:#596272; }
</style>

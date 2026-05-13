<template>
	<view class="page">
		<!-- 导航 -->
		<view class="nav">
			<view class="back" @click="goBack">‹</view>
			<view class="nav-title">{{courseName}}</view>
		</view>

		<!-- 封面 -->
		<view class="cover">
			<image v-if="cover" class="cover-img" :src="cover" mode="aspectFill" />
			<view v-else class="cover-fallback" :style="{background: bg}">
				<view class="cover-title">{{title}}</view>
			</view>
		</view>

		<!-- 信息块 -->
		<view class="info-block">
			<view class="info-top">
				<view class="info-title">{{courseName}}</view>
				<view class="star">☆</view>
			</view>
			<view class="info-meta">共计{{total}}讲, 技巧总时长：{{duration}}, 真题讲练总时长：{{realDuration}}</view>
			<view class="progress-row">
				<text class="p-label">学习进度：</text>
				<view class="bar"><view class="bar-inner" :style="{width: progress+'%'}"></view></view>
				<text class="p-num">{{progress}}%</text>
				<text class="p-extra">已学讲点数{{learntCount}},已学时长：{{learntDuration}}</text>
			</view>
		</view>

		<!-- 三功能 -->
		<view class="funcs">
			<view class="func" @click="goDocs"><view class="f-ico blue">📄</view><text class="f-text">我的文档</text></view>
			<view class="func" @click="goPlan"><view class="f-ico pink">📋</view><text class="f-text">我的学案</text></view>
			<view class="func" @click="goReport"><view class="f-ico green">📊</view><text class="f-text">学习报告</text></view>
		</view>

		<!-- Tabs -->
		<view class="tabs">
			<view class="tab" v-for="(t,i) in projectTabs" :key="t" :class="{active: tab===i}" @click="tab=i">{{t}}</view>
		</view>

		<!-- 技巧干货 -->
		<block v-if="tab===0">
			<view class="chip-row">
				<view class="chip" v-for="(v,i) in versions" :key="v.name || v" :class="{active: versionIndex===i}" @click="setVersion(i)">{{v.name || v}}</view>
			</view>

			<view class="chap-list">
				<view class="chap" v-for="(c,i) in chapters" :key="i">
					<view class="chap-head" @click="toggle(i)">
						<text class="chap-title">{{c.title}}</text>
						<view class="chap-right">
							<text class="lock" v-if="locked">🔒</text>
							<text class="caret" :class="{open: c.open}">{{c.open ? '⌄' : '›'}}</text>
						</view>
					</view>
					<view class="chap-sub" v-if="c.open">
						<view class="sub-row" v-for="(s,j) in c.items" :key="j">
							<text class="sub-title">{{s.title || s}}</text>
							<view class="sub-right">
								<text class="lock" v-if="locked">🔒</text>
								<text class="caret">›</text>
							</view>
							<view class="lesson-children" v-if="s.children && s.children.length">
								<view class="lesson-child" v-for="(child,k) in s.children" :key="k">
									<view class="child-left">
										<view class="child-mark" :class="{practice:child.type===2}">{{child.type===2 ? '练' : '学'}}</view>
										<view>
											<view class="child-name">{{child.name}}</view>
											<view class="child-progress">已学习：{{progressText(child)}}</view>
										</view>
									</view>
									<view class="child-actions">
										<view class="child-btn go" @click.stop="goLesson(s, child)">{{child.type===2 ? '去练习' : '去学习'}}</view>
										<view class="child-btn ai" @click.stop="goAi(s.title || s)">AI问答</view>
									</view>
								</view>
							</view>
						</view>
					</view>
				</view>
			</view>
		</block>

		<!-- 知识扫雷 -->
		<block v-if="tab===1">
			<view class="quiz-list">
				<view class="quiz" v-for="(q,i) in quizzes" :key="i">
					<view class="quiz-left">
							<view class="q-mark">测</view>
							<view>
								<view class="q-name">{{q.name}}</view>
								<view class="q-status">{{q.status || '未学习'}}</view>
							</view>
						</view>
					<view class="quiz-right">
						<view class="download" @click="goDocs">下载</view>
						<view class="q-btn" @click="goQuiz(q)">{{q.action || '去测评'}}</view>
					</view>
				</view>
			</view>
		</block>

		<view class="minor-panel" v-if="tab===2">
			<view class="minor-title">错题本</view>
			<view class="minor-text">当前课程错题共25道，可继续巩固薄弱题型。</view>
			<view class="minor-btn" @click="goWrongBook">进入错题本</view>
		</view>

		<view class="minor-panel" v-if="tab===3">
			<view class="minor-title">知识巩固</view>
			<view class="minor-text">当前课程有17个知识点可强化练习。</view>
			<view class="minor-btn" @click="goReinforce">开始巩固</view>
		</view>

		<view style="height:160rpx"></view>

		<!-- 底部开通栏 -->
		<view class="footer" v-if="showFooter">
			<view class="apply" @click="goActivate('apply')">
				<view class="apply-ico">📦</view>
				<text class="apply-text">申请授权</text>
			</view>
			<view class="card-open" @click="goActivate('card')">
				<view class="card-title">卡密开通</view>
				<view class="card-text">输入卡密验证</view>
			</view>
			<view class="active" @click="goActivate('active')">扫码/卡密</view>
		</view>
	</view>
</template>

<script>
import { getGaokaoMathCourse, isGaokaoMath } from '@/common/course-data.js'
import { getCourse } from '@/common/api.js'
export default {
	data() {
		return {
			title: '中考语文',
			courseName: '《中考语文2026》',
			bg: 'linear-gradient(135deg,#c94f7c 0%,#7e3a6b 100%)',
			total: 105,
			duration: '20小时37分',
			realDuration: '02小时23分',
			progress: 0,
			learntCount: 0,
			learntDuration: '00小时00分',
			cover: '',
			tab: 0,
			projectTabs: ['技巧干货','知识扫雷','错题本','知识巩固'],
			versionIndex: 0,
			versions: [{ name:'2026版' }, { name:'绝招课' }],
			locked: true,
			showFooter: true,
			courseId: 'gk-math-full',
			chapters: [
				{ title:'一、基础运用提升系列', open:true, items:[
					'巧辨字音字形','词语理解运用','病句辨析解题技巧','文学文化常识突破','句子的连贯得体',
					'拟写、仿写解题技巧','图文转换技巧','标点符号辨析','书法类考点突破','修辞手法答题技巧','对联题解题技巧'
				]},
				{ title:'二、现代文阅读提升系列', open:false, items:[] },
				{ title:'三、古诗文提升系列', open:false, items:[] },
				{ title:'四、作文提升系列', open:false, items:[] }
			],
			quizzes: [
				{ name:'入门测' },
				{ name:'第一章 汉字' },
				{ name:'第二章 词汇' },
				{ name:'第三章 句子' },
				{ name:'第四章 文学文化常识' },
				{ name:'第五章 名篇名句默写' },
				{ name:'第六章 语言表达的要求' },
				{ name:'第七章 语言表达的应用' },
				{ name:'第八章 文言文阅读' }
			]
		}
	},
	async onLoad(opts) {
		if (opts && opts.title) this.title = opts.title;
		if (opts && opts.bg) this.bg = decodeURIComponent(opts.bg);
		if (opts && opts.cover) this.cover = decodeURIComponent(opts.cover);
		if (opts && opts.id) {
			await this.loadCourse(opts.id);
		} else if ((opts && opts.subject === 'gaokao-math') || isGaokaoMath(this.title)) {
			this.applyMathCourse();
		}
	},
	methods: {
		async loadCourse(id) {
			try {
				const course = await getCourse(id);
				this.applyRemoteCourse(course);
			} catch (err) {
				console.warn('正式课接口不可用，使用本地详情', err);
				if (isGaokaoMath(this.title)) this.applyMathCourse();
			}
		},
		applyRemoteCourse(course) {
			this.courseId = course.id || this.courseId;
			this.title = course.title || this.title;
			this.courseName = course.courseName || this.courseName;
			this.cover = course.detailCover || course.cover || this.cover;
			this.total = course.totalLessons || this.total;
			this.duration = course.totalDuration || this.duration;
			this.realDuration = course.practiceDuration || this.realDuration;
			this.progress = course.progress || 0;
			this.learntCount = course.readStudyCount || 0;
			this.learntDuration = course.readDuration || '00小时00分';
			this.versions = course.versions || this.versions;
			this.quizzes = course.quizzes || this.quizzes;
			this.locked = course.subject === 'gaokao-math' ? false : this.locked;
			this.showFooter = course.subject === 'gaokao-math' ? false : this.showFooter;
			this.setVersion(0);
		},
		goBack() { uni.navigateBack({ fail:()=>{} }); },
		toggle(i) { this.chapters[i].open = !this.chapters[i].open; },
		applyMathCourse() {
			const course = getGaokaoMathCourse('full');
			this.courseId = 'gk-math-full';
			this.title = course.title;
			this.courseName = course.courseName;
			this.cover = course.detailCover || course.cover;
			this.total = course.totalLessons;
			this.duration = course.totalDuration;
			this.realDuration = course.practiceDuration;
			this.progress = course.progress;
			this.learntCount = course.readStudyCount;
			this.learntDuration = course.readDuration;
			this.versions = course.versions;
			this.quizzes = course.quizzes;
			this.locked = false;
			this.showFooter = false;
			this.setVersion(0);
		},
		setVersion(i) {
			this.versionIndex = i;
			if (this.versions[i] && this.versions[i].chapters) this.chapters = this.versions[i].chapters;
		},
		progressText(item) {
			if (item.type === 2) return `${item.read || 0}/${item.total || 0}`;
			return `${Math.round(((item.read || 0) / (item.total || 1)) * 100)}%`;
		},
		goDocs() { uni.navigateTo({ url:'/pages/my-docs/my-docs' }); },
		goPlan() { uni.navigateTo({ url:`/pages/study-plan/study-plan?courseId=${encodeURIComponent(this.courseId)}` }); },
		goReport() { uni.navigateTo({ url:`/pages/study-report/study-report?courseId=${encodeURIComponent(this.courseId)}` }); },
		goAi(context) { uni.navigateTo({ url:`/pages/ai-chat/ai-chat?context=${encodeURIComponent(context || this.courseName)}` }); },
		goQuiz(q) { uni.navigateTo({ url:`/pages/practice/practice?type=quiz&quizId=${encodeURIComponent(q.name)}&title=${encodeURIComponent(q.name)}` }); },
		goWrongBook() { uni.navigateTo({ url:'/pages/wrongbook/wrongbook' }); },
		goReinforce() { uni.navigateTo({ url:`/pages/reinforce/reinforce?courseId=${encodeURIComponent(this.courseId)}` }); },
		goActivate() { uni.navigateTo({ url:`/pages/activate/activate?courseId=${encodeURIComponent(this.courseId)}` }); },
		goLesson(lesson, child) {
			if (child.type === 2) {
				uni.navigateTo({ url:`/pages/practice/practice?type=practice&title=${encodeURIComponent(lesson.title || lesson)}` });
				return;
			}
			uni.navigateTo({ url:`/pages/lesson/lesson?title=${encodeURIComponent(lesson.title || lesson)}` });
		},
		toast(title) { uni.showToast({ title, icon:'none' }); }
	}
}
</script>

<style lang="scss">
page { background:#f5f7fa; }
.page { min-height:100vh; background:#f5f7fa; }

.nav {
	position:relative; height:90rpx;
	background:#fff;
	display:flex; align-items:center; justify-content:center;
	border-bottom:1rpx solid #eef0f3;
}
.back { position:absolute; left:24rpx; font-size:46rpx; font-weight:300; color:#222; cursor:pointer; }
.nav-title { font-size:30rpx; color:#222; font-weight:600; }

.cover { position:relative; height:240rpx; overflow:hidden; }
.cover-img { width:100%; height:100%; display:block; }
.cover-fallback { height:100%; display:flex; align-items:center; color:#fff; padding-left:50rpx; }
.cover-title {
	font-size:60rpx; font-weight:800; letter-spacing:6rpx;
}
.wave-deco {
	position:absolute; left:0; right:0; bottom:0; height:120rpx;
	background:
		radial-gradient(120rpx 50rpx at 20% 50%, rgba(255,255,255,0.25), transparent 70%),
		radial-gradient(160rpx 50rpx at 70% 50%, rgba(255,255,255,0.2), transparent 70%);
}

.info-block { background:#fff; padding: 24rpx 30rpx; }
.info-top { display:flex; justify-content:space-between; align-items:center; }
.info-title { font-size:32rpx; font-weight:800; color:#222; }
.star { font-size:42rpx; color:#cfd3da; }
.info-meta { font-size:24rpx; color:#888; margin-top:14rpx; }
.progress-row {
	display:flex; align-items:center;
	margin-top: 18rpx;
	flex-wrap:wrap;
}
.p-label { font-size:24rpx; color:#666; }
.bar {
	width:200rpx; height:14rpx;
	background:#e6e8ec; border-radius:7rpx;
	margin: 0 14rpx; overflow:hidden;
}
.bar-inner { height:100%; background:#3aa3f5; }
.p-num { font-size:24rpx; color:#666; margin-right:24rpx; }
.p-extra { font-size:24rpx; color:#888; }

.funcs { background:#fff; display:flex; padding: 30rpx 30rpx 40rpx; border-top:1rpx solid #f1f3f6; }
.func { width:33.33%; display:flex; flex-direction:column; align-items:center; cursor:pointer; }
.f-ico {
	width:90rpx; height:90rpx; border-radius:18rpx;
	display:flex; align-items:center; justify-content:center;
	font-size:46rpx; color:#fff; margin-bottom:14rpx;
}
.f-ico.blue { background:#3aa3f5; }
.f-ico.pink { background:#e7548c; }
.f-ico.green { background:#2bb673; }
.f-text { font-size:24rpx; color:#333; }

/* Tabs */
.tabs {
	background:#fff;
	display:flex;
	padding: 24rpx 0;
	border-top:1rpx solid #f1f3f6;
}
.tab {
	flex:1; text-align:center;
	font-size:28rpx; color:#666; font-weight:500;
	position:relative;
	padding: 8rpx 0;
	cursor:pointer;
}
.tab.active { color:#3aa3f5; font-weight:700; }
.tab.active::after {
	content:''; position:absolute;
	left:50%; bottom:-6rpx; transform:translateX(-50%);
	width:80rpx; height:3rpx; background:#3aa3f5;
}

/* Chips */
.chip-row { padding: 24rpx 30rpx 10rpx; display:flex; }
.chip {
	font-size:24rpx;
	padding: 6rpx 22rpx;
	border-radius:30rpx;
	background:#f0f2f5;
	color:#888;
	margin-right:14rpx;
}
.chip.active {
	background:#3aa3f5; color:#fff;
}

/* 章节 */
.chap-list { padding: 10rpx 24rpx; }
.chap { margin-bottom: 18rpx; }
.chap-head {
	background:#eef1f5;
	height:90rpx;
	border-radius:14rpx;
	display:flex; justify-content:space-between; align-items:center;
	padding: 0 30rpx;
	cursor:pointer;
}
.chap-title { font-size:30rpx; color:#222; font-weight:700; }
.chap-right, .sub-right { display:flex; align-items:center; }
.lock { font-size:26rpx; color:#9aa1a9; margin-right:18rpx; }
.caret { font-size:32rpx; color:#9aa1a9; }
.caret.open { font-size:30rpx; }

.chap-sub { padding: 10rpx 0 0; }
.sub-row {
	background:#fff;
	min-height:80rpx;
	border-radius:10rpx;
	display:flex; justify-content:space-between; align-items:center;
	flex-wrap:wrap;
	padding: 18rpx 30rpx;
	margin-bottom: 12rpx;
	box-shadow: 0 2rpx 6rpx rgba(0,0,0,0.03);
}
.sub-title { font-size:28rpx; color:#222; font-weight:600; max-width:560rpx; }
.lesson-children { width:100%; padding-top:16rpx; }
.lesson-child {
	display:flex;
	justify-content:space-between;
	align-items:center;
	padding:14rpx 0;
	border-top:1rpx dashed #edf0f3;
}
.child-left { display:flex; align-items:center; min-width:0; }
.child-mark {
	width:42rpx;
	height:42rpx;
	border-radius:8rpx;
	background:#eafbe6;
	color:#2bb673;
	display:flex;
	align-items:center;
	justify-content:center;
	font-size:22rpx;
	font-weight:700;
	margin-right:14rpx;
	flex-shrink:0;
}
.child-mark.practice { background:#eaf3fc; color:#3aa3f5; }
.child-name { font-size:25rpx; color:#222; font-weight:600; }
.child-progress { font-size:21rpx; color:#999; margin-top:4rpx; }
.child-actions { display:flex; align-items:center; flex-shrink:0; }
.child-btn {
	color:#fff;
	font-size:22rpx;
	padding:8rpx 18rpx;
	border-radius:28rpx;
	margin-left:10rpx;
	cursor:pointer;
}
.child-btn.go { background:#3aa3f5; }
.child-btn.ai { background:#2bb673; }

/* 知识扫雷 */
.quiz-list { padding: 16rpx 24rpx; }
.quiz {
	background:#fff;
	border-radius:14rpx;
	padding: 20rpx 24rpx;
	margin-bottom: 18rpx;
	display:flex; justify-content:space-between; align-items:center;
	box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.03);
}
.quiz-left { display:flex; align-items:center; flex:1; min-width:0; }
.q-mark {
	width:46rpx; height:46rpx; border-radius:8rpx;
	background:#eaf3fc; color:#3aa3f5;
	display:flex; align-items:center; justify-content:center;
	font-size:24rpx; font-weight:700;
	margin-right:16rpx;
}
.q-name { font-size:28rpx; color:#222; font-weight:600; line-height:1.35; }
.q-status { font-size:22rpx; color:#999; margin-top:4rpx; }
.quiz-right { display:flex; align-items:center; flex-shrink:0; margin-left:14rpx; }
.download {
	color:#3aa3f5;
	font-size:24rpx;
	margin-right:14rpx;
	white-space:nowrap;
	cursor:pointer;
}
.q-btn {
	background:#3aa3f5;
	color:#fff;
	font-size:24rpx;
	padding: 10rpx 26rpx;
	border-radius:30rpx;
	white-space:nowrap;
	cursor:pointer;
}

.minor-panel {
	margin:24rpx;
	background:#fff;
	border-radius:14rpx;
	padding:34rpx 30rpx;
	box-shadow:0 2rpx 8rpx rgba(0,0,0,.03);
}
.minor-title { font-size:32rpx; color:#222; font-weight:800; }
.minor-text { font-size:26rpx; color:#666; margin-top:14rpx; line-height:1.6; }
.minor-btn {
	display:inline-block;
	margin-top:24rpx;
	background:#3aa3f5;
	color:#fff;
	font-size:26rpx;
	padding:12rpx 28rpx;
	border-radius:32rpx;
	cursor:pointer;
}

/* Footer */
.footer {
	position:fixed; left:0; right:0; bottom:0;
	height:120rpx;
	background:#fff;
	display:flex; align-items:center;
	border-top:1rpx solid #eef0f3;
}
.apply {
	width:160rpx;
	display:flex; flex-direction:column; align-items:center;
	color:#222;
	cursor:pointer;
}
.apply-ico { font-size:36rpx; }
.apply-text { font-size:24rpx; margin-top:2rpx; font-weight:700; }
.card-open {
	flex:1;
	background:#3aa3f5;
	color:#fff;
	height:100%;
	display:flex; flex-direction:column; align-items:center; justify-content:center;
	cursor:pointer;
}
.card-title { font-size:30rpx; font-weight:800; }
.card-text { font-size:22rpx; margin-top:2rpx; }
.active {
	flex:1;
	background:#2bb673;
	color:#fff;
	height:100%;
	display:flex; align-items:center; justify-content:center;
	font-size:30rpx; font-weight:700;
	cursor:pointer;
}
</style>

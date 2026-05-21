<template>
	<view class="page">
		<!-- 自定义导航 -->
		<view class="nav">
			<view class="back" @click="goBack">‹</view>
			<view class="nav-title">{{courseName}}</view>
		</view>
		<!-- 未登录提示弹窗 -->
		<view class="mask" v-if="showLogin">
			<view class="modal">
				<view class="m-title">提示</view>
				<view class="m-body">您还未登录，是否登录？</view>
				<view class="m-actions">
					<view class="m-btn cancel" @click="showLogin=false">取消</view>
					<view class="m-divider"></view>
					<view class="m-btn ok" @click="goLogin">登录</view>
				</view>
			</view>
		</view>

		<!-- 封面 -->
		<view class="cover">
			<image v-if="cover" class="cover-img" :src="cover" mode="aspectFill" />
			<template v-else>
				<view class="cover-fallback" :style="{background: bg}">
					<view class="cover-title">{{coverTitle}}</view>
				</view>
			</template>
		</view>

		<!-- 课程信息 -->
		<view class="info-block">
			<view class="info-top">
				<view class="info-title">{{courseName}}</view>
				<view class="star">☆</view>
			</view>
			<view class="info-meta">共计{{totalLessons}}节，课程时长：{{totalDuration}}</view>
			<view class="progress-row">
				<text class="p-label">学习进度：</text>
				<view class="bar"><view class="bar-inner" :style="{width: progress+'%'}"></view></view>
				<text class="p-num">{{progress}}%</text>
			</view>
			<view class="learnt">已学课程节数{{learntCount}}节，已学时长：{{learntDuration}}</view>
		</view>

		<!-- 三个功能 -->
		<view class="funcs">
			<view class="func" @click="goDocs">
				<view class="f-ico blue">📄</view>
				<text class="f-text">我的文档</text>
			</view>
			<view class="func" @click="goPlan">
				<view class="f-ico pink">📋</view>
				<text class="f-text">学习计划</text>
			</view>
			<view class="func" @click="goReport">
				<view class="f-ico green">📊</view>
				<text class="f-text">学习报告</text>
			</view>
		</view>

		<view class="tabs">
			<view class="tab" v-for="(t,i) in detailTabs" :key="t" :class="{active: activeTab===i}" @click="activeTab=i">{{t}}</view>
		</view>

		<block v-if="activeTab===0">
			<view class="ver-tag">2026版</view>

			<view class="chapter" v-for="(c,i) in chapters" :key="i">
				<view class="ch-head" @click="toggle(i)">
					<text class="ch-title">{{c.title}}</text>
					<view class="ch-right">
						<text class="trial" v-if="c.audition !== false">试听</text>
						<text class="caret">{{c.open ? '▾' : '›'}}</text>
					</view>
				</view>
				<block v-if="c.open">
					<view class="ch-body" v-for="(s,j) in c.children" :key="j">
						<view class="ch-left">
							<view class="ch-mark" :class="{practice:s.type===2}">{{s.type===2 ? '练' : '学'}}</view>
							<view>
								<view class="ch-name">{{s.name}}</view>
								<view class="ch-progress">已学习：{{progressText(s)}}</view>
							</view>
						</view>
							<view class="ch-actions">
								<view class="btn-go" @click.stop="goLesson(c, s)">{{s.type===2 ? '去练习' : '去学习'}}</view>
							<view class="btn-ai" @click.stop="goAi(c.title)">AI问答</view>
						</view>
					</view>
				</block>
			</view>
		</block>

		<view class="quiz-list" v-else-if="activeTab===1">
			<view class="minor-panel" v-if="isChineseTrial">
				<view class="minor-title">章节扫雷</view>
				<view class="minor-text">权限未开通，请联系授权。</view>
				<view class="minor-btn locked" @click="requestPermission">申请授权</view>
			</view>
			<template v-else>
				<view class="trial-tip">试听课仅开放部分章节扫雷内容，完整测评请开通课程。</view>
				<view class="quiz" v-for="(q,i) in trialQuizzes" :key="i">
				<view class="quiz-left">
					<view class="q-mark">测</view>
					<view>
						<view class="q-name">{{q.name}}</view>
						<view class="q-status">{{q.status}}</view>
					</view>
				</view>
				<view class="q-btn" @click="goQuiz(q)">{{q.action || '去测评'}}</view>
				</view>
			</template>
		</view>

		<view class="minor-panel" v-else-if="activeTab===2">
			<view class="minor-title">错题与巩固</view>
			<view class="minor-text">权限未开通，请联系授权。</view>
			<view class="minor-btn locked" @click="requestPermission">申请授权</view>
		</view>

		<view class="minor-panel" v-else>
			<view class="minor-title">复习加强</view>
			<view class="minor-text">权限未开通，请联系授权。</view>
			<view class="minor-btn locked" @click="requestPermission">申请授权</view>
		</view>

		<view style="height:60rpx"></view>
	</view>
</template>

<script>
import { getGaokaoMathCourse, isGaokaoMath } from '@/common/course-data.js'
import { getCourse } from '@/common/api.js'
export default {
	data() {
		return {
			title: '中考语文',
			courseName: '《中考语文2026》试听课',
			coverTitle: '中考语文',
			bg: 'linear-gradient(135deg,#c94f7c 0%,#7e3a6b 100%)',
			totalLessons: 3,
			totalDuration: '01小时29分',
			practiceDuration: '',
			progress: 0,
			learntCount: 0,
			learntDuration: '00小时00分',
			activeTab: 0,
			detailTabs: ['技巧干货','章节扫雷','错题与巩固','复习加强'],
			chapters: [
				{ title:'选材与加工高分技巧', open:true, audition:true, children:[{ name:'技巧干货', type:1, total:1, read:0 }] },
				{ title:'课外文言文做题技巧', open:true, audition:true, children:[{ name:'技巧干货', type:1, total:1, read:0 }] },
				{ title:'词句的理解与赏析', open:true, audition:true, children:[{ name:'技巧干货', type:1, total:1, read:0 }] }
			],
			quizzes: [],
			showLogin: false,
			cover: '',
			courseId: 'gk-math-trial'
		}
	},
	computed: {
		trialQuizzes() {
			return (this.quizzes || []).slice(0, 1);
		},
		isChineseTrial() {
			return /中考语文|高考语文|初中语文|高中语文/.test(`${this.title}${this.courseName}`);
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
		this.coverTitle = this.title;
	},
	methods: {
		async loadCourse(id) {
			try {
				const course = await getCourse(id);
				this.applyRemoteCourse(course);
			} catch (err) {
				console.warn('课程详情接口不可用，使用本地详情', err);
				if (isGaokaoMath(this.title)) this.applyMathCourse();
			}
		},
		applyRemoteCourse(course) {
			this.courseId = course.id || this.courseId;
			this.title = course.title || this.title;
			this.courseName = course.courseName || this.courseName;
			this.cover = course.detailCover || course.cover || this.cover;
			const stats = this.resolveCourseStats(course);
			this.totalLessons = stats.totalLessons || this.totalLessons;
			this.totalDuration = stats.totalDuration || this.totalDuration;
			this.practiceDuration = course.practiceDuration || this.practiceDuration;
			this.progress = course.progress || 0;
			this.learntCount = course.readStudyCount || 0;
			this.learntDuration = course.readDuration || '00小时00分';
			this.chapters = course.chapters || this.chapters;
			this.quizzes = course.quizzes || [];
		},
		goBack() { uni.navigateBack({ fail:()=>uni.switchTab({url:'/pages/index/index',fail:()=>{}}) }); },
		goLogin() { this.showLogin=false; uni.navigateTo({ url:'/pages/login/login' }); },
		applyMathCourse() {
			const course = getGaokaoMathCourse('trial');
			this.courseId = 'gk-math-trial';
			this.title = course.title;
			this.courseName = course.courseName;
			this.cover = course.detailCover || course.cover;
			const stats = this.resolveCourseStats(course);
			this.totalLessons = stats.totalLessons || course.totalLessons;
			this.totalDuration = stats.totalDuration || course.totalDuration;
			this.practiceDuration = course.practiceDuration;
			this.progress = course.progress;
			this.learntCount = course.readStudyCount;
			this.learntDuration = course.readDuration;
			this.chapters = course.chapters;
			this.quizzes = course.quizzes;
		},
		toggle(i) { this.chapters[i].open = !this.chapters[i].open; },
		resolveCourseStats(course = {}) {
			const totalLessons = this.countCourseLessons(course) || course.totalLessons || 0;
			return {
				totalLessons,
				totalDuration: course.totalDuration || ''
			};
		},
		countCourseLessons(course = {}) {
			const version = course.versions && course.versions[0];
			const chapters = version && version.chapters ? version.chapters : (course.chapters || []);
			return this.countChapters(chapters);
		},
		countChapters(chapters = []) {
			return chapters.reduce((total, chapter) => {
				const items = chapter.items || chapter.children || [];
				return total + items.reduce((sum, item) => {
					if (item.children && item.children.length) {
						return sum + item.children.filter(child => child.type !== 2).length;
					}
					return sum + (item.type === 2 ? 0 : 1);
				}, 0);
			}, 0);
		},
		goDocs() { uni.navigateTo({ url:'/pages/my-docs/my-docs' }); },
		goPlan() { uni.navigateTo({ url:`/pages/study-plan/study-plan?courseId=${encodeURIComponent(this.courseId)}` }); },
		goReport() { uni.navigateTo({ url:`/pages/study-report/study-report?courseId=${encodeURIComponent(this.courseId)}` }); },
		goAi(context) { uni.navigateTo({ url:`/pages/ai-chat/ai-chat?context=${encodeURIComponent(context || this.courseName)}` }); },
		goQuiz(q) { uni.navigateTo({ url:`/pages/practice/practice?type=quiz&quizId=${encodeURIComponent(q.name)}&title=${encodeURIComponent(q.name)}` }); },
		goWrongBook() { uni.navigateTo({ url:'/pages/wrongbook/wrongbook' }); },
		goReinforce() { uni.navigateTo({ url:`/pages/reinforce/reinforce?courseId=${encodeURIComponent(this.courseId)}` }); },
		goLesson(chapter, item) {
			if (item.type === 2) {
				uni.navigateTo({ url:`/pages/practice/practice?type=practice&title=${encodeURIComponent(chapter.title)}` });
				return;
			}
			uni.navigateTo({ url:`/pages/lesson/lesson?title=${encodeURIComponent(chapter.title)}&courseId=${encodeURIComponent(this.courseId)}&courseTitle=${encodeURIComponent(this.courseName)}&chapterTitle=${encodeURIComponent(chapter.title)}` });
		},
		progressText(item) {
			if (item.type === 2) return `${item.read || 0}/${item.total || 0}`;
			return `${Math.round(((item.read || 0) / (item.total || 1)) * 100)}%`;
		},
		requestPermission() {
			uni.showModal({ title:'权限未开通', content:'权限未开通，请联系授权。', showCancel:false });
		},
		toast(title) { uni.showToast({ title, icon:'none' }); }
	}
}
</script>

<style lang="scss">
page { background:#f5f7fa; }
.page { min-height:100vh; background:#f5f7fa; }

.nav {
	position:relative;
	height:90rpx;
	background:#fff;
	display:flex; align-items:center; justify-content:center;
	border-bottom:1rpx solid #eef0f3;
}
.back {
	position:absolute; left:24rpx; top:0; bottom:0;
	display:flex; align-items:center;
	font-size:46rpx; color:#222; font-weight:300;
	cursor:pointer;
}
.nav-title { font-size:30rpx; color:#222; font-weight:600; }

/* 封面 */
.cover {
	position:relative;
	height:240rpx;
	overflow:hidden;
}
.cover-img { width:100%; height:100%; display:block; }
.cover-fallback {
	height:100%;
	display:flex; align-items:center;
	color:#fff;
	padding-left: 50rpx;
}
.tag {
	position:absolute; top:24rpx; right:24rpx;
	background:rgba(255,255,255,0.3);
	color:#fff; font-size:22rpx;
	padding:6rpx 16rpx; border-radius:6rpx;
}
.cover-title {
	font-size:64rpx; font-weight:800; letter-spacing:6rpx;
}
.wave-deco {
	position:absolute; left:0; right:0; bottom:0; height:120rpx;
	background:
		radial-gradient(120rpx 50rpx at 20% 50%, rgba(255,255,255,0.25), transparent 70%),
		radial-gradient(160rpx 50rpx at 70% 50%, rgba(255,255,255,0.2), transparent 70%);
}

/* 信息块 */
.info-block {
	background:#fff;
	padding: 24rpx 30rpx;
}
.info-top { display:flex; justify-content:space-between; align-items:center; }
.info-title { font-size:32rpx; font-weight:800; color:#222; }
.star { font-size:42rpx; color:#cfd3da; }
.info-meta { font-size:24rpx; color:#888; margin-top:14rpx; }

.progress-row {
	display:flex; align-items:center;
	margin-top: 20rpx;
}
.p-label { font-size:24rpx; color:#666; }
.bar {
	flex:1;
	height:14rpx;
	background:#e6e8ec;
	border-radius:7rpx;
	margin: 0 14rpx;
	overflow:hidden;
}
.bar-inner { height:100%; background:#0d7cfe; }
.p-num { font-size:24rpx; color:#666; }

.learnt {
	margin-top:14rpx;
	font-size:24rpx; color:#888;
}

/* 三个功能 */
.funcs {
	background:#fff;
	display:flex;
	padding: 30rpx 30rpx 40rpx;
	border-top:1rpx solid #f1f3f6;
}
.func {
	width:33.33%;
	display:flex; flex-direction:column; align-items:center;
	cursor:pointer;
}
.f-ico {
	width:90rpx; height:90rpx; border-radius:18rpx;
	display:flex; align-items:center; justify-content:center;
	font-size:46rpx; color:#fff;
	margin-bottom:14rpx;
}
.f-ico.blue { background:#0d7cfe; }
.f-ico.pink { background:#e7548c; }
.f-ico.green { background:#2bb673; }
.f-text { font-size:24rpx; color:#333; }

/* 段标题（带下划线） */
.section-tab {
	background:#fff;
	text-align:center;
	color:#0d7cfe;
	font-size:28rpx;
	padding: 24rpx 0;
	position:relative;
}
.section-tab::after {
	content:'';
	position:absolute;
	left:50%; bottom:14rpx;
	transform:translateX(-50%);
	width:90rpx; height:2rpx; background:#0d7cfe;
}

/* 版本标签 */
.ver-tag {
	display:inline-block;
	margin: 24rpx 30rpx 12rpx;
	padding: 6rpx 22rpx;
	background:#eaf4ff;
	color:#0d7cfe;
	font-size:24rpx;
	border-radius:30rpx;
	border:1rpx solid #b9defc;
}

/* 章节卡片 */
.chapter {
	background:#fff;
	margin: 16rpx 24rpx;
	border-radius:14rpx;
	padding: 24rpx 24rpx;
	box-shadow: 0 4rpx 10rpx rgba(0,0,0,0.03);
}
.ch-head {
	display:flex; justify-content:space-between; align-items:center;
}
.ch-title { font-size:30rpx; font-weight:800; color:#222; }
.ch-right { display:flex; align-items:center; }
.trial {
	color:#0d7cfe; font-size:24rpx;
	text-decoration:underline; margin-right:10rpx;
}
.caret { color:#bbb; font-size:22rpx; }

.ch-body {
	display:flex; align-items:center; justify-content:space-between;
	margin-top: 24rpx;
	padding-top: 20rpx;
	border-top:1rpx dashed #eef0f3;
}
.ch-left { display:flex; align-items:center; }
.ch-mark {
	width:46rpx; height:46rpx; border-radius:8rpx;
	background:#eafbe6; color:#2bb673;
	display:flex; align-items:center; justify-content:center;
	font-size:24rpx; font-weight:700;
	margin-right:18rpx;
}
.ch-mark.practice { background:#eaf3ff; color:#0d7cfe; }
.ch-name { font-size:26rpx; color:#222; font-weight:600; }
.ch-progress { font-size:22rpx; color:#999; margin-top:4rpx; }

.ch-actions { display:flex; }
.mask { position:fixed; inset:0; background:rgba(0,0,0,0.5); display:flex; align-items:center; justify-content:center; z-index:200; }
.modal { width:560rpx; background:#fff; border-radius:14rpx; overflow:hidden; }
.m-title { text-align:center; padding:36rpx 0 16rpx; font-size:34rpx; color:#000; }
.m-body { text-align:center; padding:0 30rpx 36rpx; color:#888; font-size:28rpx; }
.m-actions { display:flex; border-top:1rpx solid #ececec; }
.m-btn { flex:1; height:96rpx; line-height:96rpx; text-align:center; font-size:32rpx; cursor:pointer; }
.m-btn.cancel { color:#000; }
.m-btn.ok { color:#007aff; }
.m-divider { width:1rpx; background:#ececec; }

.btn-go, .btn-ai {
	font-size:24rpx;
	color:#fff;
	padding: 10rpx 26rpx;
	border-radius:30rpx;
	margin-left:14rpx;
}
.btn-go { background:#1890e1; box-shadow:0 4rpx 8rpx rgba(24,144,225,0.3); cursor:pointer; }
.btn-ai { background:#22ac38; box-shadow:0 4rpx 8rpx rgba(34,172,56,0.3); cursor:pointer; }

.tabs {
	background:#fff;
	display:flex;
	padding: 24rpx 0;
	border-top:1rpx solid #f1f3f6;
}
.tab {
	flex:1;
	text-align:center;
	font-size:26rpx;
	color:#666;
	position:relative;
	padding:8rpx 0;
	cursor:pointer;
}
.tab.active { color:#4fa9f8; font-weight:700; }
.tab.active::after {
	content:'';
	position:absolute;
	left:50%;
	bottom:-6rpx;
	transform:translateX(-50%);
	width:70rpx;
	height:4rpx;
	background:#4fa9f8;
	border-radius:4rpx;
}

.quiz-list { padding: 20rpx 24rpx; }
.trial-tip {
	margin-bottom:18rpx;
	padding:18rpx 22rpx;
	border-radius:12rpx;
	background:#fff7ed;
	color:#b45309;
	font-size:24rpx;
	line-height:1.5;
}
.quiz {
	background:#fff;
	border-radius:14rpx;
	padding:22rpx 24rpx;
	margin-bottom:18rpx;
	display:flex;
	align-items:center;
	justify-content:space-between;
	box-shadow:0 2rpx 8rpx rgba(0,0,0,0.03);
}
.quiz-left { display:flex; align-items:center; min-width:0; }
.q-mark {
	width:46rpx;
	height:46rpx;
	border-radius:8rpx;
	background:#eaf3fc;
	color:#4fa9f8;
	display:flex;
	align-items:center;
	justify-content:center;
	font-size:24rpx;
	font-weight:700;
	margin-right:16rpx;
	flex-shrink:0;
}
.q-name { font-size:28rpx; color:#222; font-weight:600; }
.q-status { font-size:22rpx; color:#999; margin-top:4rpx; }
.q-btn {
	background:#4fa9f8;
	color:#fff;
	font-size:24rpx;
	padding:10rpx 24rpx;
	border-radius:30rpx;
	flex-shrink:0;
	cursor:pointer;
}
.empty-tab {
	margin:70rpx 30rpx;
	text-align:center;
	color:#9aa1a9;
	font-size:28rpx;
}
.minor-panel {
	margin:24rpx;
	padding:28rpx;
	background:#fff;
	border-radius:16rpx;
	border:1rpx solid #edf0f4;
}
.minor-title {
	font-size:32rpx;
	color:#222;
	font-weight:800;
}
.minor-text {
	margin-top:12rpx;
	color:#697386;
	font-size:26rpx;
	line-height:1.5;
}
.minor-btn {
	margin-top:24rpx;
	height:74rpx;
	line-height:74rpx;
	text-align:center;
	border-radius:12rpx;
	background:#4fa9f8;
	color:#fff;
	font-size:28rpx;
	font-weight:700;
}
.minor-btn.locked {
	background:#eef2f7;
	color:#596272;
}
</style>

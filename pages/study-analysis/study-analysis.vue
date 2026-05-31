<template>
	<view class="page">
		<view class="nav">
			<view class="back" @click="goBack">‹</view>
			<view class="nav-title">学情统计</view>
		</view>

		<view class="section-head">
			<view>
				<view class="section-title">{{pageTitle}}</view>
				<view class="section-sub">{{readOnly ? '推荐绑定学生的学习情况汇总，此处只允许查看统计。' : '所有已开通科目的学习情况汇总。'}}</view>
			</view>
			<view class="readonly-tag" v-if="readOnly">只读查看</view>
		</view>

		<view class="readonly-banner" v-if="readOnly">
			<view class="readonly-banner-title">只读权限</view>
			<view class="readonly-banner-text">可查看学习时长、打卡记录和各科报告，不能编辑打卡、错题、文档或学生资料。</view>
		</view>

		<view class="time-summary">
			<view class="time-card">
				<text class="time-value">{{summaryStats.totalText}}</text>
				<text class="time-label">学习时长汇总</text>
			</view>
			<view class="time-card">
				<text class="time-value">{{summaryStats.days}}天</text>
				<text class="time-label">累计学习</text>
			</view>
			<view class="time-card">
				<text class="time-value">{{summaryStats.weekText}}</text>
				<text class="time-label">本周学习</text>
			</view>
			<view class="time-card">
				<text class="time-value">{{summaryStats.todayText}}</text>
				<text class="time-label">今日学习</text>
			</view>
			<view class="time-card checkin-card">
				<view>
					<text class="time-value">{{checkinDays}}天</text>
					<text class="time-label">累计打卡</text>
				</view>
				<view class="text-action" @click="showCheckinRecords = !showCheckinRecords">{{showCheckinRecords ? '收起记录' : '查看打卡记录'}}</view>
			</view>
		</view>

		<view class="checkin-panel" v-if="showCheckinRecords">
			<view class="panel-title">打卡记录</view>
			<view class="empty" v-if="!checkinRecords.length">暂无打卡记录</view>
			<view class="checkin-row" v-for="item in checkinRecords" :key="item.id">
				<view>
					<view class="checkin-date">{{formatDate(item.updatedAt || item.createdAt || item.date)}}</view>
					<view class="checkin-course">全科共享</view>
				</view>
				<view class="checkin-content">{{item.content || '已打卡'}}</view>
			</view>
		</view>

		<view class="report-panel">
			<view class="panel-title">各科目学习报告</view>
			<view class="panel-note">科目根据已激活课程显示；未激活课程不显示。</view>
			<view class="course-report-grid" v-if="courseReports.length">
				<view class="course-report" v-for="course in courseReports" :key="course.id">
					<view class="course-name" @click="goReport(course)">{{course.title}}</view>
					<view class="course-actions" v-if="!readOnly">
						<view class="outline-btn" @click="goWrongBook(course)">查看【错题与巩固】</view>
						<view class="outline-btn" @click="goDocs(course)">查看我的文档</view>
					</view>
					<view class="readonly-note" v-else>仅查看统计</view>
				</view>
			</view>
			<view class="empty" v-else>暂无已激活课程，激活课程后这里会显示对应科目的学习报告。</view>
		</view>

		<view class="english-panel" v-if="englishStats">
			<view class="english-title">英语外语科目</view>
			<view class="english-grid">
				<view class="english-item" v-for="item in englishStats.items" :key="item.label">
					<text>{{item.label}}</text>
					<strong>{{item.value}}</strong>
				</view>
			</view>
			<view class="english-daily">
				<view>今日学习词汇名字：高考单词3500词</view>
				<view>今日认读完成：xx个</view>
				<view>今日听写完成：xx个</view>
				<view>今日新学：xx个</view>
				<view>今日复习：xx个</view>
			</view>
		</view>
	</view>
</template>

<script>
import { getStudySummary } from '@/common/study-summary.js'
import { getStudyReport, getStudySummaryApi, getMyCourses, getMyStudents, isLoggedIn } from '@/common/api.js'
import { AUTHORIZED_COURSES, stripCourseYear } from '@/common/course-data.js'

const CHECKIN_KEY = 'studyCheckins';

export default {
	data() {
		return {
			studySummary: null,
			learningStats: null,
			userInfo: {},
			courseId: '',
			studentId: '',
			studentName: '',
			readOnly: false,
			expandedSummary: {},
			activeCourses: [],
			checkinRecords: [],
			showCheckinRecords: false
		}
	},
	computed: {
		summaryStats() {
			const stats = this.learningStats || {};
			return {
				totalText: stats.totalText || '0秒',
				days: Number(stats.days) || 0,
				weekText: stats.weekText || '0秒',
				todayText: stats.todayText || '0秒'
			};
		},
		checkinDays() {
			return new Set(this.checkinRecords.map(item => item.date || String(item.createdAt || '').slice(0, 10)).filter(Boolean)).size;
		},
		courseReports() {
			return this.activeCourses.map(item => this.normalizeCourse(item)).filter(item => item.id && item.title);
		},
		pageTitle() {
			return this.readOnly && this.studentName ? `${this.studentName}的学情统计` : '学习情况总结';
		},
		englishStats() {
			return (this.studySummary && this.studySummary.sections || []).find(section => /英语|外语/.test(section.title));
		},
		nonEnglishSections() {
			return (this.studySummary && this.studySummary.sections || []).filter(section => !/英语|外语/.test(section.title));
		}
	},
	onLoad(opts = {}) {
		this.courseId = opts.courseId || '';
		this.studentId = opts.studentId || opts.userId || '';
		this.studentName = opts.studentName ? decodeURIComponent(opts.studentName) : '';
		this.readOnly = opts.readonly === '1' || opts.readOnly === '1' || opts.readonly === true;
	},
	async onShow() {
		if (!isLoggedIn()) {
			uni.showToast({ title:'请先登录', icon:'none' });
			return;
		}
		this.userInfo = uni.getStorageSync('userInfo') || {};
		this.studySummary = getStudySummary();
		this.checkinRecords = this.sharedCheckins(uni.getStorageSync(CHECKIN_KEY) || []);
		await this.loadRemoteData();
	},
	methods: {
		async loadRemoteData() {
			try {
				this.studySummary = await getStudySummaryApi();
			} catch (err) {
				console.warn('学习统计接口不可用，使用本地统计', err);
			}
			try {
				const report = await getStudyReport('', this.studentId);
				this.learningStats = report.learningStats || null;
			} catch (err) {
				console.warn('学习报告接口不可用', err);
			}
			if (this.readOnly && this.studentId) {
				try {
					const students = await getMyStudents();
					const current = (students || []).find(item => String(item.id || item.userId || item.studentUserId || '') === String(this.studentId));
					if (current) {
						this.studentName = this.studentName || current.name || '';
						const courses = current.courses || current.openCourses || [];
						if (courses.length) {
							this.activeCourses = courses;
							return;
						}
					}
				} catch (err) {
					console.warn('学生课程接口不可用', err);
				}
			}
			try {
				const list = await getMyCourses();
				this.activeCourses = (list && list.length ? list : AUTHORIZED_COURSES);
			} catch (err) {
				console.warn('已激活课程接口不可用，使用本地课程', err);
				this.activeCourses = AUTHORIZED_COURSES;
			}
		},
		normalizeCourse(course = {}) {
			const title = stripCourseYear(course.courseName || course.title || course.sub || '');
			return {
				...course,
				id: course.id || course.courseId || this.inferCourseId(title, course.subject),
				title: this.cleanCourseTitle(title)
			};
		},
		cleanCourseTitle(title = '') {
			return stripCourseYear(title).replace(/[《》]/g, '').replace(/试听课/g, '').trim();
		},
		inferCourseId(title = '', subject = '') {
			const text = `${title}${subject}`;
			if (/高考数学|gaokao-math/.test(text)) return 'gk-math-full';
			if (/高考语文/.test(text)) return 'gk-yuwen-full';
			if (/高考英语/.test(text)) return 'gk-yingyu-full';
			if (/高考物理/.test(text)) return 'gk-wuli-full';
			if (/高考化学/.test(text)) return 'gk-huaxue-full';
			if (/中考语文/.test(text)) return 'zk-yuwen-full';
			if (/中考数学/.test(text)) return 'zk-shuxue-full';
			if (/中考英语/.test(text)) return 'zk-yingyu-full';
			if (/中考物理/.test(text)) return 'zk-wuli-full';
			if (/中考化学/.test(text)) return 'zk-huaxue-full';
			return '';
		},
		courseNameById(courseId = '') {
			const found = this.courseReports.find(item => item.id === courseId);
			return found ? found.title : (courseId || '课程学习');
		},
		sharedCheckins(records = []) {
			const byDate = {};
			(Array.isArray(records) ? records : []).filter(item => this.sameStudentCheckin(item)).forEach(item => {
				const date = item.date || String(item.updatedAt || item.createdAt || '').slice(0, 10);
				if (!date) return;
				if (!byDate[date] || this.checkinTime(item) >= this.checkinTime(byDate[date])) {
					byDate[date] = { ...item, date };
				}
			});
			return Object.values(byDate).sort((a, b) => this.checkinTime(b) - this.checkinTime(a));
		},
		sameStudentCheckin(item = {}) {
			const recordId = item.studentId || item.userId || item.user_id || item.uid || '';
			const targetId = this.targetStudentId();
			if (recordId) return recordId === targetId;
			return !this.studentId;
		},
		targetStudentId() {
			const user = this.userInfo || {};
			return this.studentId || user.id || user.userId || user.user_id || user.uid || user.phone || '';
		},
		checkinTime(item = {}) {
			const time = new Date(String(item.updatedAt || item.createdAt || '').replace(' ', 'T')).getTime();
			return Number.isFinite(time) ? time : 0;
		},
		formatDate(value) {
			const raw = value ? String(value) : '';
			const match = raw.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
			return match ? `${match[1]}年${match[2].padStart(2, '0')}月${match[3].padStart(2, '0')}日` : raw;
		},
		toggleSummary(title) {
			this.expandedSummary = { ...this.expandedSummary, [title]: !this.expandedSummary[title] };
		},
		goReport(course) {
			const readonly = this.readOnly ? '&readonly=1' : '';
			const student = this.studentId ? `&studentId=${encodeURIComponent(this.studentId)}` : '';
			uni.navigateTo({ url:`/pages/study-report/study-report?courseId=${encodeURIComponent(course.id)}&title=${encodeURIComponent(course.title)}${student}${readonly}` });
		},
		goWrongBook(course) {
			if (this.readOnly) {
				uni.showToast({ title:'只读查看，不能操作错题', icon:'none' });
				return;
			}
			uni.navigateTo({ url:`/pages/wrongbook/wrongbook?courseId=${encodeURIComponent(course.id)}&title=${encodeURIComponent(course.title)}` });
		},
		goDocs(course) {
			if (this.readOnly) {
				uni.showToast({ title:'只读查看，不能操作文档', icon:'none' });
				return;
			}
			uni.navigateTo({ url:`/pages/my-docs/my-docs?courseId=${encodeURIComponent(course.id)}&kw=${encodeURIComponent(course.title)}` });
		},
		goBack() { uni.navigateBack({ fail:()=>uni.switchTab({ url:'/pages/member/member', fail:()=>{} }) }); }
	}
}
</script>

<style lang="scss">
page { background:#f5f7fa; }
.page { min-height:100vh; padding-bottom:40rpx; background:#f5f7fa; }
.nav { position:relative; height:90rpx; background:#fff; display:flex; align-items:center; justify-content:center; border-bottom:1rpx solid #eef0f3; }
.back { position:absolute; left:24rpx; font-size:46rpx; color:#222; cursor:pointer; }
.nav-title { font-size:30rpx; color:#222; font-weight:800; }
.section-head { padding:28rpx 30rpx 18rpx; display:flex; align-items:flex-start; justify-content:space-between; gap:18rpx; }
.section-title { font-size:34rpx; font-weight:900; color:#222; }
.section-sub { margin-top:10rpx; color:#596272; font-size:24rpx; line-height:1.5; }
.readonly-tag { flex-shrink:0; margin-top:4rpx; padding:8rpx 16rpx; border-radius:999rpx; background:#eef6ff; color:#1677ff; font-size:23rpx; font-weight:900; }
.readonly-banner { margin:0 24rpx 20rpx; padding:22rpx 24rpx; border-radius:12rpx; background:#f8fafc; border:1rpx solid #e1e8f0; box-sizing:border-box; }
.readonly-banner-title { color:#1f2933; font-size:26rpx; font-weight:900; }
.readonly-banner-text { margin-top:8rpx; color:#667085; font-size:23rpx; line-height:1.5; }
.time-summary { display:grid; grid-template-columns:1fr 1fr; gap:16rpx; padding:0 24rpx 20rpx; }
.time-card { min-height:112rpx; background:#fff; border:1rpx solid #eef0f3; border-radius:8rpx; padding:22rpx; display:flex; flex-direction:column; justify-content:center; box-shadow:0 3rpx 10rpx rgba(0,0,0,0.03); box-sizing:border-box; }
.checkin-card { grid-column:1 / -1; flex-direction:row; align-items:center; justify-content:space-between; }
.time-value { color:#1677ff; font-size:30rpx; font-weight:900; }
.time-label { margin-top:8rpx; color:#8a929c; font-size:22rpx; }
.text-action { color:#1677ff; font-size:26rpx; font-weight:800; cursor:pointer; }
.checkin-panel, .report-panel, .english-panel, .summary-card, .master-card { margin:0 24rpx 20rpx; padding:24rpx; background:#fff; border:1rpx solid #e3e8ef; border-radius:8rpx; box-sizing:border-box; }
.panel-title { color:#222; font-size:30rpx; font-weight:900; }
.panel-note { margin-top:8rpx; color:#697386; font-size:23rpx; line-height:1.45; }
.course-report-grid { display:grid; grid-template-columns:1fr; gap:14rpx; margin-top:20rpx; }
.course-report { display:flex; align-items:center; justify-content:space-between; gap:18rpx; padding:18rpx; border:1rpx solid #e8edf3; border-radius:8rpx; background:#fbfcfe; }
.course-name { flex:0 0 150rpx; min-height:58rpx; display:flex; align-items:center; justify-content:center; border-radius:8rpx; background:#fff1f2; color:#b42335; font-size:27rpx; font-weight:900; cursor:pointer; }
.course-actions { flex:1; display:flex; flex-wrap:wrap; gap:12rpx; justify-content:flex-end; }
.outline-btn { min-height:58rpx; padding:0 18rpx; display:flex; align-items:center; justify-content:center; border-radius:8rpx; border:1rpx solid #d7e3f2; color:#1f2933; font-size:25rpx; font-weight:800; background:#fff; box-sizing:border-box; cursor:pointer; }
.readonly-note { flex-shrink:0; color:#8a929c; font-size:24rpx; font-weight:800; }
.checkin-row { display:flex; justify-content:space-between; gap:18rpx; padding:18rpx 0; border-top:1rpx solid #eef0f3; }
.checkin-date { color:#222; font-size:26rpx; font-weight:800; }
.checkin-course { margin-top:6rpx; color:#697386; font-size:22rpx; }
.checkin-content { flex:1; color:#596272; font-size:24rpx; line-height:1.45; text-align:right; overflow:hidden; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; }
.english-title { color:#222; font-size:28rpx; font-weight:900; }
.english-grid { display:grid; grid-template-columns:repeat(2, 1fr); gap:14rpx; margin-top:18rpx; }
.english-item { padding:18rpx; border-radius:8rpx; background:#f8fafc; }
.english-item text { display:block; color:#697386; font-size:22rpx; }
.english-item strong { display:block; margin-top:8rpx; color:#222; font-size:30rpx; }
.english-daily { display:grid; grid-template-columns:1fr; gap:14rpx; margin-top:22rpx; color:#b42335; font-size:26rpx; line-height:1.45; }
.summary { padding:0; }
.summary-title { font-size:28rpx; color:#222; font-weight:800; margin-bottom:16rpx; }
.summary-items { display:flex; flex-wrap:wrap; }
.summary-item { width:50%; padding:10rpx 0; display:flex; flex-direction:column; }
.summary-label { font-size:22rpx; color:#8a929c; }
.summary-value { margin-top:6rpx; font-size:30rpx; color:#222; font-weight:800; }
.summary-detail-toggle { margin-top:18rpx; color:#1677ff; font-size:24rpx; font-weight:700; cursor:pointer; }
.summary-details { margin-top:16rpx; border-top:1rpx solid #eef0f3; }
.summary-detail { padding:18rpx 0 4rpx; }
.detail-head { display:flex; align-items:center; flex-wrap:wrap; gap:12rpx; }
.detail-title { font-size:26rpx; color:#222; font-weight:800; }
.detail-count { font-size:22rpx; color:#697386; }
.detail-score { margin-left:auto; font-size:24rpx; color:#b78200; font-weight:800; }
.detail-record { display:flex; align-items:center; margin-top:12rpx; padding:14rpx; border-radius:8rpx; background:#f8fafc; font-size:22rpx; color:#596272; }
.record-name { width:130rpx; color:#222; font-weight:700; }
.record-result { flex:1; min-width:0; }
.record-score { margin-left:12rpx; color:#1677ff; font-weight:800; }
.master-row { display:flex; align-items:center; margin-top:18rpx; }
.master-name { width:150rpx; font-size:24rpx; color:#333; }
.master-bar { flex:1; height:14rpx; background:#edf0f3; border-radius:8rpx; overflow:hidden; margin:0 16rpx; }
.master-bar-inner { height:100%; border-radius:8rpx; }
.master-score { width:130rpx; font-size:22rpx; text-align:right; font-weight:700; }
.level-gray { background:#a9b0b8; }
.level-red { background:#ff4d4f; }
.level-yellow { background:#f5b42a; }
.level-green { background:#2bb673; }
.level-purple { background:#8b5cf6; }
.text-gray { color:#7d858e; }
.text-red { color:#ff4d4f; }
.text-yellow { color:#b78200; }
.text-green { color:#2bb673; }
.text-purple { color:#7c3aed; }
.empty { color:#8a94a3; font-size:26rpx; padding:20rpx 0; }

/* PC H5 polish */
page { background:#eef3f7; }
.page {
	background:linear-gradient(180deg, #f9fbfd 0%, #eef3f7 390rpx, #eef3f7 100%);
	color:#17212f;
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
.section-head {
	padding:30rpx 30rpx 20rpx;
}
.section-title {
	font-size:35rpx;
	color:#111827;
	letter-spacing:0;
}
.section-sub {
	max-width:58ch;
	color:#5d6b7c;
	font-size:24rpx;
}
.readonly-tag {
	background:#eaf3ff;
	border:1rpx solid #cfe2ff;
}
.time-summary {
	grid-template-columns:repeat(4, minmax(0, 1fr));
	gap:14rpx;
	padding:0 24rpx 20rpx;
}
.time-card {
	min-height:116rpx;
	padding:20rpx 18rpx;
	border-radius:16rpx;
	border-color:#dfe7f0;
	box-shadow:0 10rpx 24rpx rgba(31,41,51,.045);
}
.time-value {
	color:#1769ff;
	font-size:31rpx;
	line-height:1.15;
}
.time-label {
	color:#758197;
	font-size:22rpx;
	line-height:1.35;
}
.checkin-card {
	grid-column:1 / -1;
	min-height:126rpx;
	flex-direction:row;
	align-items:center;
	background:linear-gradient(135deg, #fff 0%, #f4f8ff 100%);
}
.text-action {
	min-height:56rpx;
	padding:0 18rpx;
	display:flex;
	align-items:center;
	justify-content:center;
	border-radius:12rpx;
	background:#eef5ff;
	border:1rpx solid #cfe0ff;
	line-height:1.3;
	text-align:center;
}
.checkin-panel,
.report-panel,
.english-panel {
	margin:0 24rpx 20rpx;
	padding:26rpx;
	border-radius:18rpx;
	border-color:#dfe7f0;
	box-shadow:0 10rpx 24rpx rgba(31,41,51,.04);
}
.panel-title,
.english-title {
	color:#111827;
	font-size:30rpx;
	letter-spacing:0;
}
.panel-note {
	color:#66758a;
	line-height:1.55;
}
.checkin-panel {
	background:#fff;
}
.checkin-row {
	align-items:flex-start;
	padding:20rpx 0;
	border-top:1rpx solid #edf2f7;
}
.checkin-date {
	color:#111827;
	font-size:26rpx;
}
.checkin-course {
	display:inline-flex;
	margin-top:8rpx;
	padding:5rpx 12rpx;
	border-radius:999rpx;
	background:#eef5ff;
	color:#2b5da8;
}
.checkin-content {
	text-align:left;
	color:#405066;
	font-size:24rpx;
	line-height:1.55;
}
.course-report-grid {
	gap:16rpx;
}
.course-report {
	align-items:stretch;
	padding:18rpx;
	border-radius:16rpx;
	border-color:#dfe7f0;
	background:#f9fbfd;
}
.course-name {
	flex:0 0 152rpx;
	min-height:70rpx;
	border-radius:14rpx;
	background:#fff1f3;
	color:#b42335;
}
.course-actions {
	display:grid;
	grid-template-columns:1fr;
	gap:10rpx;
	justify-content:stretch;
}
.outline-btn {
	min-height:58rpx;
	padding:0 16rpx;
	border-radius:12rpx;
	border-color:#cddbea;
	color:#1f2937;
	line-height:1.25;
	text-align:center;
}
.english-grid {
	grid-template-columns:repeat(2, minmax(0, 1fr));
	gap:16rpx;
}
.english-item {
	padding:20rpx;
	border-radius:14rpx;
	background:#f6f9fd;
	border:1rpx solid #edf2f7;
}
.english-item text {
	color:#64748b;
}
.english-item strong {
	color:#111827;
	font-size:31rpx;
}
.english-daily {
	grid-template-columns:repeat(2, minmax(0, 1fr));
	gap:12rpx;
	margin-top:20rpx;
	color:#b42335;
	font-size:24rpx;
	line-height:1.5;
}
.english-daily view {
	min-height:58rpx;
	padding:14rpx 16rpx;
	border-radius:14rpx;
	background:#fff7f8;
	border:1rpx solid #ffd9df;
	box-sizing:border-box;
	word-break:break-word;
}
.empty {
	margin-top:14rpx;
	padding:40rpx 20rpx;
	text-align:center;
	background:#f8fafc;
	border:1rpx dashed #cbd6e2;
	border-radius:16rpx;
	line-height:1.6;
}
@media screen and (max-width: 420px) {
	.time-summary {
		grid-template-columns:repeat(2, minmax(0, 1fr));
	}
	.course-report {
		flex-direction:column;
	}
	.course-name {
		flex:0 0 auto;
		width:100%;
		min-height:62rpx;
	}
	.english-daily {
		grid-template-columns:1fr;
	}
}

/* Refined desktop report layout */
.checkin-card > view:first-child {
	display:flex;
	align-items:baseline;
	gap:8rpx;
	min-width:0;
}
.checkin-card .time-label {
	display:block;
	margin-top:2rpx;
}
.checkin-panel {
	padding:28rpx;
}
.checkin-panel .panel-title {
	margin-bottom:14rpx;
}
.checkin-row {
	display:grid;
	grid-template-columns:180rpx minmax(0, 1fr);
	gap:20rpx;
	padding:20rpx;
	margin-top:14rpx;
	border:1rpx solid #e6edf5;
	border-radius:16rpx;
	background:#f9fbfd;
}
.checkin-row:first-of-type {
	border-top:1rpx solid #e6edf5;
}
.checkin-content {
	display:block;
	-webkit-line-clamp:unset;
	overflow:visible;
	text-align:left;
	word-break:break-word;
}
.report-panel {
	padding:28rpx;
}
.course-report {
	display:grid;
	grid-template-columns:150rpx minmax(0, 1fr);
	align-items:center;
	gap:18rpx;
	min-height:118rpx;
}
.course-name {
	width:100%;
	min-height:74rpx;
	box-sizing:border-box;
	text-align:center;
}
.course-actions {
	display:grid;
	grid-template-columns:repeat(2, minmax(0, 1fr));
	gap:12rpx;
}
.outline-btn {
	width:100%;
	min-height:64rpx;
	padding:0 14rpx;
	box-sizing:border-box;
}
.readonly-note {
	display:flex;
	align-items:center;
	justify-content:center;
	min-height:62rpx;
	border-radius:12rpx;
	background:#f1f5f9;
	color:#64748b;
}
.english-panel {
	padding:28rpx;
}
.english-daily {
	grid-template-columns:repeat(5, minmax(0, 1fr));
}
.english-daily view {
	min-height:86rpx;
	display:flex;
	align-items:center;
}
@media screen and (max-width: 520px) {
	.checkin-row {
		grid-template-columns:1fr;
	}
	.course-report {
		grid-template-columns:1fr;
	}
	.course-actions {
		grid-template-columns:1fr 1fr;
	}
	.english-daily {
		grid-template-columns:repeat(2, minmax(0, 1fr));
	}
}
@media screen and (max-width: 420px) {
	.course-actions,
	.english-daily {
		grid-template-columns:1fr;
	}
}
</style>

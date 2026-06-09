<template>
	<view class="page">
		<view class="nav"><view class="back" @click="goBack">‹</view><view class="nav-title">课程开通</view></view>
		<view class="panel">
			<view class="title">激活课程</view>
			<view class="hint">请选择要开通的课程，并填写激活码和学生信息。验证成功后课程会加入“我的课程”。</view>
			<input class="input" v-model="code" placeholder="输入激活码，例如 a1b2c3d4e" confirm-type="next" />
			<picker mode="selector" :range="coursePickerLabels" :value="coursePickerIndex" @change="onCourseChange">
				<view class="course-picker" :class="{empty: !courseId}">
					<text>{{selectedCourseLabel}}</text>
					<text class="picker-arrow">›</text>
				</view>
			</picker>
			<input class="input" v-model="studentName" placeholder="输入学生名字" confirm-type="next" />
			<view class="gender-field">
				<view class="gender-label">学生性别</view>
				<view class="gender-options">
					<view
						v-for="item in genderOptions"
						:key="item"
						class="gender-option"
						:class="{active: gender === item}"
						@click="gender = item"
					>{{item}}</view>
				</view>
			</view>
			<input class="input" v-model="recentExamScore" placeholder="输入科目最近考试分数" confirm-type="next" />
			<input class="input" v-model="grade" placeholder="输入年级" confirm-type="next" />
			<input class="input" v-model="schoolName" placeholder="输入学校名字" confirm-type="next" />
			<input class="input" v-model="region" placeholder="输入所在地区" confirm-type="done" @confirm="activate" />
			<view class="primary" :class="{disabled: loading}" @click="activate">{{loading ? '验证中...' : '提交激活并开通'}}</view>
			<view class="success" v-if="activatedCourse">
				<view class="success-title">已开通</view>
				<view class="success-text">{{activatedCourse}}</view>
				<view class="success-link" @click="goMyCourses">去我的课程学习</view>
			</view>
		</view>
		<view class="panel">
			<view class="title small">申请授权</view>
			<view class="course">{{selectedCourseLabel}}</view>
			<view class="ghost" @click="showAuth=true">没有激活码，申请人工授权</view>
		</view>
		<view class="auth-mask" v-if="showAuth">
			<view class="auth-modal">
				<view class="auth-title">请联系下方微信申请</view>
				<view class="auth-wechat">微信号：<text>{{wechatId}}</text></view>
				<view class="auth-copy" @click="copyWechat">一键复制微信号</view>
				<view class="auth-close" @click="showAuth=false">关闭</view>
			</view>
		</view>
	</view>
</template>

<script>
import { activateCourse, getCourses, getMyCourses, getProfile } from '@/common/api.js'
export default {
	data() {
		return {
			courseId:'',
			courseOptions:[],
			coursePickerIndex:0,
			code:'',
			studentName:'',
			gender:'',
			genderOptions:['男', '女'],
			recentExamScore:'',
			grade:'',
			schoolName:'',
			region:'',
			wechatId:'DYR7314',
			showAuth:false,
			loading:false,
			activatedCourse:''
		}
	},
	onLoad(opts = {}) {
		this.courseId = opts.courseId || '';
		this.loadCourseOptions();
		this.prefillStudentInfo();
	},
	computed: {
		coursePickerLabels() {
			const labels = this.courseOptions.map(item => this.courseLabel(item));
			return labels.length ? labels : ['暂无可选正式课程'];
		},
		selectedCourseLabel() {
			const course = this.courseOptions.find(item => (item.id || item.courseId) === this.courseId);
			if (course) return this.courseLabel(course);
			return this.courseId || '请选择要开通的正式课程';
		}
	},
	methods: {
		async loadCourseOptions() {
			try {
				const courses = await getCourses({ kind:'full' });
				this.courseOptions = (Array.isArray(courses) ? courses : [])
					.filter(item => item && (item.kind === 'full' || !item.isTry));
				if (this.courseId) {
					const index = this.courseOptions.findIndex(item => (item.id || item.courseId) === this.courseId);
					if (index >= 0) this.coursePickerIndex = index;
				}
				else if (this.courseOptions.length === 1) {
					this.coursePickerIndex = 0;
					this.courseId = this.courseOptions[0].id || this.courseOptions[0].courseId || '';
				}
			} catch (err) {}
		},
		courseLabel(course = {}) {
			const title = course.courseName || course.title || course.full || course.subject || course.id || '未命名课程';
			return String(title).replace(/[《》]/g, '');
		},
		onCourseChange(event) {
			const index = Number(event.detail.value || 0);
			const course = this.courseOptions[index];
			if (!course) return;
			this.coursePickerIndex = index;
			this.courseId = course.id || course.courseId || '';
		},
		async prefillStudentInfo() {
			const cached = uni.getStorageSync('userInfo') || {};
			this.applyStudentInfo(cached);
			try {
				const profile = await getProfile();
				this.applyStudentInfo(profile || {});
			} catch (err) {}
			try {
				const courses = await getMyCourses();
				const list = Array.isArray(courses) ? courses : [];
				const latest = [...list].reverse().find(item => item && (item.studentName || item.gender || item.grade || item.schoolName || item.region));
				if (latest) this.applyStudentInfo(latest);
			} catch (err) {}
		},
		applyStudentInfo(source = {}) {
			if (!this.studentName) this.studentName = this.firstText(source.studentName, source.name);
			if (!this.gender) this.gender = this.normalizeGender(source.gender);
			if (!this.grade) this.grade = this.firstText(source.grade);
			if (!this.schoolName) this.schoolName = this.firstText(source.schoolName, source.school);
			if (!this.region) this.region = this.firstText(source.region, source.area);
		},
		firstText(...values) {
			for (const value of values) {
				const text = String(value || '').trim();
				if (text) return text;
			}
			return '';
		},
		normalizeGender(value) {
			const text = String(value || '').trim();
			if (!text) return '';
			if (text.includes('男') || /^m(ale)?$/i.test(text)) return '男';
			if (text.includes('女') || /^f(emale)?$/i.test(text)) return '女';
			return this.genderOptions.includes(text) ? text : '';
		},
		cacheStudentInfo(payload = {}) {
			const user = uni.getStorageSync('userInfo') || {};
			uni.setStorageSync('userInfo', { ...user, ...payload });
		},
		async activate() {
			const code = this.code.trim().toLowerCase();
			const studentName = this.studentName.trim();
			const gender = this.gender;
			const recentExamScore = this.recentExamScore.trim();
			const grade = this.grade.trim();
			const schoolName = this.schoolName.trim();
			const region = this.region.trim();
			const courseId = String(this.courseId || '').trim();
			if (!courseId) {
				uni.showToast({ title:'请选择要开通的课程', icon:'none' });
				return;
			}
			if (!code || !studentName || !gender || !recentExamScore || !grade || !schoolName || !region) {
				uni.showToast({ title:'请填写全部必填信息', icon:'none' });
				return;
			}
			if (this.loading) return;
			this.loading = true;
			try {
				const result = await activateCourse({ code, studentName, gender, recentExamScore, grade, schoolName, region, courseId });
				this.code = code;
				this.cacheStudentInfo({ studentName, gender, recentExamScore, grade, schoolName, region });
				this.activatedCourse = result.courseTitle || result.courseId || '课程';
				uni.showToast({ title:'开通成功', icon:'success' });
			}
			catch (err) {
				uni.showToast({ title: err.message || '激活码无效', icon:'none' });
			}
			finally {
				this.loading = false;
			}
		},
		copyWechat() {
			uni.setClipboardData({
				data: this.wechatId,
				success: () => uni.showToast({ title:'微信号已复制', icon:'success' })
			});
		},
		goMyCourses() { uni.navigateTo({ url:'/pages/mycourse/mycourse' }); },
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
.panel { margin:24rpx; padding:28rpx; background:#fff; border-radius:16rpx; border:1rpx solid #edf0f4; }
.title { font-size:32rpx; font-weight:800; color:#222; margin-bottom:20rpx; }
.title.small { font-size:30rpx; }
.hint { color:#697386; font-size:26rpx; line-height:1.5; margin-bottom:20rpx; }
.input { height:84rpx; border-radius:12rpx; background:#f3f6fa; padding:0 20rpx; font-size:28rpx; margin-top:16rpx; }
.course-picker { height:84rpx; border-radius:12rpx; background:#f3f6fa; padding:0 20rpx; font-size:28rpx; margin-top:16rpx; display:flex; align-items:center; justify-content:space-between; color:#222; box-sizing:border-box; }
.course-picker.empty { color:#8a94a6; }
.picker-arrow { color:#9aa3b2; font-size:34rpx; transform:rotate(90deg); }
.gender-field { height:84rpx; border-radius:12rpx; background:#f3f6fa; padding:0 12rpx 0 20rpx; margin-top:16rpx; display:flex; align-items:center; justify-content:space-between; box-sizing:border-box; }
.gender-label { color:#697386; font-size:28rpx; }
.gender-options { display:flex; gap:12rpx; }
.gender-option { min-width:96rpx; height:56rpx; line-height:56rpx; border-radius:10rpx; background:#fff; border:1rpx solid #e4e9f0; color:#596272; font-size:26rpx; font-weight:700; text-align:center; box-sizing:border-box; }
.gender-option.active { background:#1677ff; border-color:#1677ff; color:#fff; }
.primary, .ghost { height:78rpx; line-height:78rpx; text-align:center; border-radius:12rpx; margin-top:18rpx; font-size:28rpx; font-weight:700; }
.primary { background:#1677ff; color:#fff; }
.ghost { background:#eef2f7; color:#222; }
.disabled { opacity:.55; }
.course { color:#697386; font-size:28rpx; }
.success { margin-top:22rpx; padding:22rpx; border-radius:14rpx; background:#f0fdf4; border:1rpx solid #bbf7d0; }
.success-title { color:#15803d; font-size:28rpx; font-weight:800; }
.success-text { color:#166534; font-size:26rpx; margin-top:8rpx; }
.success-link { margin-top:16rpx; color:#1677ff; font-size:26rpx; font-weight:700; }
.auth-mask { position:fixed; inset:0; background:rgba(0,0,0,.45); display:flex; align-items:center; justify-content:center; z-index:300; }
.auth-modal { width:560rpx; background:#fff; border-radius:18rpx; overflow:hidden; text-align:center; }
.auth-title { padding:42rpx 28rpx 22rpx; color:#222; font-size:34rpx; font-weight:800; }
.auth-wechat { color:#333; font-size:30rpx; }
.auth-wechat text { color:#39a8d8; text-decoration:underline; font-weight:800; }
.auth-copy, .auth-close { height:88rpx; line-height:88rpx; border-top:1rpx solid #eef0f3; font-size:28rpx; font-weight:700; }
.auth-copy { color:#39a8d8; margin-top:34rpx; }
.auth-close { color:#596272; }
</style>

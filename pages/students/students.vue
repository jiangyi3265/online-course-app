<template>
	<view class="page">
		<view class="nav"><view class="back" @click="goBack">‹</view><view class="nav-title">我的学生</view></view>

		<view class="panel">
			<view class="panel-title">绑定学生账号</view>
			<input class="input" v-model.trim="form.phone" type="number" maxlength="11" placeholder="输入学生注册手机号" />
			<input class="input" v-model="form.password" type="password" placeholder="输入学生登录密码" />
			<view class="code-row">
				<input class="input code-input" v-model.trim="form.smsCode" type="number" maxlength="6" placeholder="或输入短信验证码" />
				<view class="code-btn" @click="getCode">获取验证码</view>
			</view>
			<view class="bind-actions">
				<view class="primary" @click="submitBind">绑定学生</view>
			</view>
		</view>

		<view class="panel">
			<view class="panel-head">
				<view>
					<view class="panel-title">学生绑定记录</view>
					<view class="panel-sub">一名学生只显示一条记录，可查看学情统计，不可代填学习打卡。</view>
				</view>
				<view class="refresh" @click="loadData">{{loading ? '加载中' : '刷新'}}</view>
			</view>
			<view class="empty" v-if="!students.length">{{loadError || '暂无绑定学生'}}</view>
			<view class="student-card" v-for="item in students" :key="item.id + item.name">
				<view class="student-top">
					<view>
						<view class="student-name">{{item.name || '学生'}}</view>
						<view class="student-id">ID：{{item.id || '--'}}</view>
					</view>
					<view class="source-tag" :class="{auto: item.bindingSource !== '账号绑定'}">{{item.bindingSource || '账号绑定'}}</view>
				</view>
				<view class="student-meta">
					<view>年级：{{item.grade || '--'}}</view>
					<view>地区：{{item.region || '--'}}</view>
					<view>绑定时间：{{formatDate(item.bindingCreatedAt || item.createdAt)}}</view>
				</view>
				<view class="course-line">开通课程：{{studentCoursesText(item)}}</view>
				<view class="action-row">
					<view class="link-btn" @click="viewAnalysis(item)">查看【学情统计】</view>
					<view class="link-btn warn" v-if="canUnbind(item)" @click="removeBinding(item)">解除绑定</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
import { bindStudent, getMyStudents, sendSmsCode, unbindStudent } from '@/common/api.js'

export default {
	data() {
		return {
			students: [],
			loading: false,
			loadError: '',
			form: { phone: '', password: '', smsCode: '' }
		}
	},
	onShow() {
		this.loadData();
	},
	methods: {
		async loadData() {
			this.loading = true;
			this.loadError = '';
			try {
				const data = await getMyStudents();
				this.students = this.normalizeStudents(data || []);
			} catch (err) {
				this.students = [];
				this.loadError = err.message || '学生记录加载失败';
				uni.showToast({ title: this.loadError, icon:'none' });
			} finally {
				this.loading = false;
			}
		},
		async getCode() {
			if (!/^1\d{10}$/.test(this.form.phone)) {
				uni.showToast({ title:'请输入正确手机号', icon:'none' });
				return;
			}
			try {
				const res = await sendSmsCode(this.form.phone);
				if (res.code) this.form.smsCode = res.code;
				uni.showToast({ title: res.message || '验证码已发送', icon:'none' });
			} catch (err) {
				uni.showToast({ title: err.message || '发送失败', icon:'none' });
			}
		},
		async submitBind() {
			if (!this.form.phone || (!this.form.password && !this.form.smsCode)) {
				uni.showToast({ title:'请输入手机号和密码或验证码', icon:'none' });
				return;
			}
			try {
				await bindStudent({ ...this.form });
				uni.showToast({ title:'绑定成功', icon:'success' });
				this.form.phone = '';
				this.form.password = '';
				this.form.smsCode = '';
				await this.loadData();
			} catch (err) {
				uni.showToast({ title: err.message || '绑定失败', icon:'none' });
			}
		},
		studentCoursesText(item) {
			const courses = item.courses || item.openCourses || [];
			if (courses.length) return courses.map(course => course.title || course.courseName || course.name).filter(Boolean).join('、');
			if (item.learning && item.learning.courseCount) return `${item.learning.courseCount}门课程`;
			return '--';
		},
		normalizeStudents(list = []) {
			const map = {};
			list.forEach(item => {
				const id = item.id || item.userId || item.studentUserId || '';
				if (!id) return;
				const normalized = {
					...item,
					id,
					bindingSource: item.bindingSource || (item.bindingId ? '账号绑定' : '授权记录'),
					bindingCreatedAt: item.bindingCreatedAt || item.createdAt || ''
				};
				if (!map[id] || normalized.bindingSource === '账号绑定') {
					map[id] = normalized;
				}
			});
			return Object.values(map);
		},
		canUnbind(item = {}) {
			return item.canUnbind !== false && (item.bindingId || item.bindingSource === '账号绑定');
		},
		formatDate(value) {
			if (!value) return '--';
			const raw = String(value);
			const match = raw.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:[T\s](\d{1,2}):(\d{1,2}))?/);
			if (!match) return raw;
			const date = `${match[1]}年${match[2].padStart(2, '0')}月${match[3].padStart(2, '0')}日`;
			return match[4] ? `${date} ${match[4].padStart(2, '0')}:${match[5].padStart(2, '0')}` : date;
		},
		primaryCourseId(item = {}) {
			const courses = item.courses || item.openCourses || [];
			return item.primaryCourseId || (courses[0] && (courses[0].id || courses[0].courseId)) || 'gk-math-full';
		},
		viewAnalysis(item) {
			const url = `/pages/study-analysis/study-analysis?studentId=${encodeURIComponent(item.id || '')}&courseId=${encodeURIComponent(this.primaryCourseId(item))}&readonly=1`;
			uni.navigateTo({ url });
		},
		removeBinding(item) {
			if (!this.canUnbind(item)) {
				uni.showToast({ title:'授权记录不能在这里解除', icon:'none' });
				return;
			}
			uni.showModal({
				title:'解除绑定',
				content:`确认解除与 ${item.name || '该学生'} 的绑定？`,
				success: async res => {
					if (!res.confirm) return;
					try {
						await unbindStudent(item.id);
						this.students = this.students.filter(student => student.id !== item.id);
						uni.showToast({ title:'已解除绑定', icon:'success' });
					} catch (err) {
						uni.showToast({ title: err.message || '解除失败', icon:'none' });
					}
				}
			});
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
.panel { margin:24rpx; padding:26rpx; background:#fff; border-radius:16rpx; border:1rpx solid #edf0f4; }
.panel-title { font-size:30rpx; font-weight:800; color:#222; margin-bottom:18rpx; }
.panel-head { display:flex; align-items:flex-start; justify-content:space-between; gap:18rpx; margin-bottom:18rpx; }
.panel-head .panel-title { margin-bottom:6rpx; }
.panel-sub { color:#8a94a3; font-size:23rpx; line-height:1.45; }
.refresh { flex-shrink:0; min-width:86rpx; height:52rpx; line-height:52rpx; text-align:center; border-radius:10rpx; background:#eef6ff; color:#1677ff; font-size:24rpx; font-weight:800; }
.input { height:78rpx; border-radius:12rpx; background:#f3f6fa; padding:0 18rpx; font-size:27rpx; margin-top:14rpx; box-sizing:border-box; }
.code-row { display:flex; gap:14rpx; align-items:center; }
.code-input { flex:1; min-width:0; }
.code-btn { flex-shrink:0; height:78rpx; line-height:78rpx; margin-top:14rpx; padding:0 18rpx; border-radius:12rpx; background:#eef6ff; color:#1677ff; font-size:25rpx; font-weight:700; }
.bind-actions { display:flex; gap:14rpx; margin-top:18rpx; }
.primary, .secondary { flex:1; height:78rpx; line-height:78rpx; text-align:center; border-radius:12rpx; font-size:27rpx; font-weight:800; }
.primary { background:#1677ff; color:#fff; }
.secondary { background:#ecfdf3; color:#0f9f6e; }
.empty { color:#8a94a3; font-size:26rpx; padding:24rpx 0; }
.student-card { padding:24rpx 0; border-bottom:1rpx solid #eef0f3; }
.student-card:last-child { border-bottom:0; }
.student-top { display:flex; align-items:flex-start; justify-content:space-between; gap:16rpx; }
.student-name { color:#222; font-size:30rpx; font-weight:900; }
.student-id { margin-top:6rpx; color:#697386; font-size:23rpx; }
.source-tag { flex-shrink:0; padding:8rpx 14rpx; border-radius:999rpx; background:#ecfdf3; color:#0f9f6e; font-size:22rpx; font-weight:800; }
.source-tag.auto { background:#eef6ff; color:#1677ff; }
.student-meta { display:grid; grid-template-columns:1fr 1fr; gap:8rpx 16rpx; margin-top:18rpx; color:#596272; font-size:25rpx; line-height:1.5; }
.course-line { margin-top:14rpx; color:#475467; font-size:26rpx; line-height:1.55; }
.action-row { display:flex; flex-wrap:wrap; gap:14rpx; margin-top:12rpx; }
.link-btn { color:#1677ff; background:#eef6ff; border-radius:10rpx; padding:12rpx 16rpx; font-size:25rpx; font-weight:700; }
.link-btn.warn { color:#e5484d; background:#fff1f1; }
.link-btn.full { color:#0f9f6e; background:#ecfdf3; }
</style>

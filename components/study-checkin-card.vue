<template>
	<view class="checkin-wrap">
		<view class="checkin-card">
			<view class="hero-row">
				<view>
					<view class="title">学习打卡</view>
					<view class="sub">每天上传学习内容，有助于规划师了解你的学习情况</view>
				</view>
				<view class="hero-ico">📝</view>
			</view>

			<view class="date-row">
				<text class="date-ico">▣</text>
				<text>{{todayText}}</text>
			</view>

			<view class="form-box">
				<view class="field-label">学习内容</view>
				<textarea
					class="content-input"
					v-model="content"
					maxlength="500"
					placeholder="今日所学科目：&#10;今日所学内容：&#10;今日收获与感想：&#10;不理解的内容："
					placeholder-class="content-ph"
				/>

				<view class="field-label image-label">学习图片 <text>({{images.length}}/3) *</text></view>
				<view class="image-row">
					<view class="image-cell" v-for="(img,index) in images" :key="img">
						<image class="preview" :src="img" mode="aspectFill" />
						<view class="remove" @click="removeImage(index)">×</view>
					</view>
					<view class="upload-cell" v-if="images.length < 3" @click="chooseImages">
						<view class="camera">▢</view>
						<view>上传图片</view>
					</view>
				</view>

				<view class="submit" :class="{done: checkedIn}" @click="submitCheckin">
					<text class="submit-ico">▣</text>
					<text>{{checkedIn ? '更新打卡' : '打卡'}}</text>
				</view>
			</view>
		</view>

		<view class="record-panel">
			<view class="panel-title">历史打卡记录</view>
			<view class="record-empty" v-if="!courseRecords.length">暂无打卡记录</view>
			<view class="record" v-for="item in courseRecords" :key="item.id">
				<view>
					<view class="record-date">{{formatDate(item.createdAt)}}</view>
					<view class="record-text">{{item.content}}</view>
				</view>
				<text class="record-count">{{item.imageCount}}张图片</text>
			</view>
		</view>
	</view>
</template>

<script>
const CHECKIN_KEY = 'studyCheckins';

export default {
	props: {
		courseId: { type: String, default: 'gk-math-full' },
		studentId: { type: String, default: '' }
	},
	data() {
		return {
			checkedIn: false,
			content: '',
			images: [],
			records: []
		}
	},
	computed: {
		todayText() {
			return this.formatDate(this.todayKey());
		},
		courseRecords() {
			return this.records
				.filter(item => this.sameScope(item))
				.sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')))
				.slice(0, 20);
		}
	},
	watch: {
		courseId() { this.loadRecords(); },
		studentId() { this.loadRecords(); }
	},
	mounted() {
		this.loadRecords();
	},
	methods: {
		loadRecords() {
			this.records = uni.getStorageSync(CHECKIN_KEY) || [];
			const todayRecord = this.records.find(item => this.sameScope(item) && item.date === this.todayKey());
			this.checkedIn = !!todayRecord;
			this.content = todayRecord ? (todayRecord.content || '') : '';
			this.images = todayRecord ? (todayRecord.images || []) : [];
		},
		chooseImages() {
			uni.chooseImage({
				count: 3 - this.images.length,
				success: res => {
					this.images = this.images.concat(res.tempFilePaths || []).slice(0, 3);
				}
			});
		},
		removeImage(index) {
			this.images.splice(index, 1);
		},
		submitCheckin() {
			if (!this.content.trim()) {
				uni.showToast({ title:'请填写学习内容', icon:'none' });
				return;
			}
			if (!this.images.length) {
				uni.showToast({ title:'请上传学习图片', icon:'none' });
				return;
			}
			const record = {
				id: `checkin-${Date.now()}`,
				courseId: this.courseId || 'gk-math-full',
				studentId: this.studentId || '',
				content: this.content.trim(),
				images: this.images,
				imageCount: this.images.length,
				date: this.todayKey(),
				createdAt: this.localDateTime()
			};
			const next = (uni.getStorageSync(CHECKIN_KEY) || []).filter(item => !(this.sameScope(item) && item.date === record.date));
			next.unshift(record);
			uni.setStorageSync(CHECKIN_KEY, next);
			this.records = next;
			this.checkedIn = true;
			uni.showToast({ title:'打卡成功', icon:'success' });
		},
		sameScope(item = {}) {
			return (item.courseId || 'gk-math-full') === (this.courseId || 'gk-math-full') && (item.studentId || '') === (this.studentId || '');
		},
		todayKey() {
			const now = new Date();
			return `${now.getFullYear()}-${this.pad(now.getMonth() + 1)}-${this.pad(now.getDate())}`;
		},
		localDateTime() {
			const now = new Date();
			return `${this.todayKey()}T${this.pad(now.getHours())}:${this.pad(now.getMinutes())}:${this.pad(now.getSeconds())}`;
		},
		pad(value) {
			return String(value).padStart(2, '0');
		},
		formatDate(value) {
			const raw = value ? String(value) : this.todayKey();
			const match = raw.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
			if (!match) return raw;
			return `${match[1]}年${match[2].padStart(2, '0')}月${match[3].padStart(2, '0')}日`;
		}
	}
}
</script>

<style lang="scss">
.checkin-wrap { padding:24rpx; background:#f5f7fa; }
.checkin-card { max-width:640rpx; margin:0 auto; padding:28rpx; border-radius:10rpx; background:#d9f3ff; border:1rpx solid #b6e7fb; box-sizing:border-box; }
.hero-row { display:flex; justify-content:space-between; align-items:flex-start; }
.title { color:#111827; font-size:48rpx; font-weight:900; }
.sub { margin-top:14rpx; max-width:460rpx; color:#111827; font-size:26rpx; line-height:1.45; font-weight:700; }
.hero-ico { width:120rpx; height:120rpx; display:flex; align-items:center; justify-content:center; font-size:72rpx; flex-shrink:0; }
.date-row { margin-top:34rpx; min-height:86rpx; display:flex; align-items:center; padding:0 28rpx; border-radius:8rpx 8rpx 0 0; background:#80d9f2; color:#111827; font-size:34rpx; font-weight:900; }
.date-ico { margin-right:18rpx; color:#333; font-size:30rpx; }
.form-box { padding:26rpx 28rpx 30rpx; border-radius:0 0 10rpx 10rpx; background:#fff; }
.field-label { color:#111827; font-size:30rpx; font-weight:900; }
.image-label { margin-top:28rpx; }
.image-label text { color:#8a94a3; font-size:26rpx; font-weight:700; }
.content-input { margin-top:18rpx; width:100%; min-height:260rpx; box-sizing:border-box; padding:28rpx; border-radius:10rpx; border:1rpx solid #edf0f4; background:#fbfdff; color:#222; font-size:28rpx; line-height:1.6; }
.content-ph { color:#555; }
.image-row { display:flex; flex-wrap:wrap; gap:18rpx; margin-top:18rpx; }
.upload-cell, .image-cell { width:150rpx; height:150rpx; border-radius:8rpx; position:relative; overflow:hidden; flex-shrink:0; }
.upload-cell { border:1rpx dashed #cfd6df; background:#f8fafc; color:#8a94a3; display:flex; flex-direction:column; align-items:center; justify-content:center; font-size:24rpx; }
.camera { font-size:38rpx; margin-bottom:10rpx; }
.preview { width:100%; height:100%; display:block; }
.remove { position:absolute; top:6rpx; right:6rpx; width:34rpx; height:34rpx; line-height:32rpx; text-align:center; border-radius:50%; background:rgba(0,0,0,.55); color:#fff; font-size:28rpx; }
.submit { margin-top:44rpx; height:88rpx; border-radius:44rpx; display:flex; align-items:center; justify-content:center; gap:16rpx; background:#458af7; color:#fff; font-size:34rpx; font-weight:900; }
.submit.done { background:#458af7; }
.submit-ico { font-size:34rpx; }
.record-panel { max-width:640rpx; margin:0 auto; padding:26rpx 0 10rpx; background:#fff; border:4rpx solid #111; border-top-width:6rpx; box-sizing:border-box; }
.panel-title { display:inline-block; margin-left:16rpx; padding:4rpx 8rpx; border:2rpx solid #ef4444; color:#222; font-size:30rpx; font-weight:800; }
.record-empty { padding:32rpx 22rpx; color:#8a94a3; font-size:26rpx; }
.record { display:flex; justify-content:space-between; gap:18rpx; padding:22rpx; border-top:1rpx solid #edf0f4; color:#333; }
.record-date { font-size:26rpx; font-weight:800; }
.record-text { margin-top:8rpx; max-width:430rpx; color:#697386; font-size:24rpx; line-height:1.45; overflow:hidden; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; }
.record-count { flex-shrink:0; color:#3aa3f5; font-size:24rpx; font-weight:800; }
</style>

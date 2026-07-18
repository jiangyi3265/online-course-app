<template>
	<view class="checkin-wrap">
		<view class="checkin-card">
			<view class="hero-row">
				<view>
					<view class="title">学习打卡</view>
					<view class="sub">每天上传学习内容，有助于规划师了解你的学习情况</view>
				</view>
				<view class="hero-ico">✓</view>
			</view>

			<view class="date-row">
				<text class="date-ico">□</text>
				<text>{{ todayText }}</text>
			</view>

			<view class="readonly-box" v-if="readOnly">
				<view class="readonly-title">只读查看</view>
				<view class="readonly-text">可查看该学生的打卡历史，不能上传图片、提交打卡或修改已有记录。</view>
			</view>

			<view class="form-box" v-else>
				<view class="field-label">学习内容</view>
				<view class="content-editor">
					<view class="content-line" v-for="field in contentFields" :key="field.key">
						<text class="content-prefix">{{ field.label }}</text>
						<textarea
							class="content-value"
							v-model="checkinForm[field.key]"
							:maxlength="field.maxlength"
							:auto-height="true"
							:placeholder="field.placeholder"
							placeholder-class="content-ph"
						/>
					</view>
				</view>

				<view class="field-label image-label">学习图片 <text>({{ images.length }}/3) *</text></view>
				<view class="image-row">
					<view class="image-cell" v-for="(img,index) in images" :key="img">
						<image class="preview" :src="mediaUrl(img)" mode="aspectFill" @click="previewImages(images, index)" />
						<view class="remove" @click.stop="removeImage(index)">×</view>
					</view>
					<view class="upload-cell" v-if="images.length < 3" @click="chooseImages">
						<view class="camera">＋</view>
						<view>上传图片</view>
					</view>
				</view>

				<view class="submit" :class="{done: checkedIn, locked: isEditLocked}" @click="submitCheckin">
					<text class="submit-ico">□</text>
					<text>{{ submitText }}</text>
				</view>
			</view>
		</view>

		<view class="record-panel">
			<view class="record-head">
				<view>
					<view class="panel-title">打卡历史</view>
					<view class="panel-sub">所有科目共享，每天保留最新一次打卡</view>
				</view>
				<view class="record-total">{{ courseRecords.length }}条</view>
			</view>
			<view class="record-empty" v-if="!courseRecords.length">
				<view class="empty-mark">记</view>
				<view>
					<view class="empty-title">暂无打卡记录</view>
					<view class="empty-sub">完成第一次打卡后，这里会自动生成历史记录。</view>
				</view>
			</view>
			<view class="record-list" v-else>
				<view class="record" v-for="item in courseRecords" :key="item.id || item.date">
					<view class="record-dot"></view>
					<view class="record-main">
						<view class="record-top">
							<view class="record-date">{{ formatDate(item.updatedAt || item.createdAt || item.date) }}</view>
							<text class="record-count" :class="{clickable: recordImages(item).length}" @click="previewRecordImages(item)">
								{{ recordImages(item).length }}张图片
							</text>
						</view>
						<view class="record-text">{{ item.content }}</view>
						<view class="record-images" v-if="recordImages(item).length">
							<image
								v-for="(url, imageIndex) in recordImages(item)"
								:key="`${item.id || item.date}-image-${imageIndex}`"
								class="record-image"
								:src="url"
								mode="aspectFill"
								@click="previewImages(recordImages(item), imageIndex)"
							/>
						</view>
					</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
import { getStudyCheckins, isUsableMediaUrl, resolveMediaList, resolveMediaUrl, saveStudyCheckin, uploadAnswerImage, uploadAnswerImageFile } from '@/common/api.js'

const CHECKIN_KEY = 'studyCheckins';
const EDIT_LIMIT_MS = 12 * 60 * 60 * 1000;
const CONTENT_FIELDS = [
	{ key: 'subjects', label: '今日所学科目：', placeholder: '如：高中数学、物理化学', maxlength: 80 },
	{ key: 'learned', label: '今日所学内容：', placeholder: '如：函数、天体运动', maxlength: 160 },
	{ key: 'reflection', label: '今日收获与感想：', placeholder: '写下今天的收获', maxlength: 160 },
	{ key: 'confusion', label: '不理解的内容：', placeholder: '没有可填写“无”', maxlength: 160 }
];

const emptyCheckinForm = () => CONTENT_FIELDS.reduce((form, field) => {
	form[field.key] = '';
	return form;
}, {});

export default {
	props: {
		courseId: { type: String, default: 'gk-math-full' },
		studentId: { type: String, default: '' },
		readOnly: { type: Boolean, default: false }
	},
	data() {
		return {
			checkedIn: false,
			currentRecord: null,
			checkinForm: emptyCheckinForm(),
			images: [],
			records: []
		}
	},
	computed: {
		contentFields() {
			return CONTENT_FIELDS;
		},
		contentText() {
			return CONTENT_FIELDS
				.map(field => `${field.label}${(this.checkinForm[field.key] || '').trim()}`)
				.join('\n');
		},
		hasContentInput() {
			return CONTENT_FIELDS.some(field => (this.checkinForm[field.key] || '').trim());
		},
		isEditLocked() {
			if (this.readOnly) return true;
			return this.currentRecord ? Date.now() - this.createdTime(this.currentRecord) > EDIT_LIMIT_MS : false;
		},
		submitText() {
			if (this.readOnly) return '只读查看';
			if (this.isEditLocked) return '超过12小时不可修改';
			return this.checkedIn ? '更新打卡' : '打卡';
		},
		todayText() {
			return this.formatDate(this.todayKey());
		},
		courseRecords() {
			return this.sharedRecords()
				.sort((a, b) => this.recordTime(b) - this.recordTime(a))
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
		mediaUrl(url) {
			const media = resolveMediaUrl(url);
			return media && isUsableMediaUrl(media) ? media : '';
		},
		async loadRecords() {
			const stored = uni.getStorageSync(CHECKIN_KEY) || [];
			this.records = Array.isArray(stored) ? stored : [];
			try {
				const remote = await getStudyCheckins({ userId: this.scopeStudentId(), courseId: this.courseId || '' });
				if (Array.isArray(remote)) {
					this.records = this.mergeRecords(remote, this.records);
					uni.setStorageSync(CHECKIN_KEY, this.records);
				}
			} catch (err) {
				console.warn('学习打卡接口不可用，使用本地缓存', err);
			}
			const todayRecord = this.courseRecords.find(item => item.date === this.todayKey());
			this.currentRecord = todayRecord || null;
			this.checkedIn = !!todayRecord;
			this.checkinForm = todayRecord ? this.parseContent(todayRecord.content || '') : emptyCheckinForm();
			this.images = todayRecord ? this.recordImages(todayRecord) : [];
		},
		chooseImages() {
			if (this.readOnly) return;
			uni.chooseImage({
				count: 3 - this.images.length,
				success: async res => {
					uni.showLoading({ title: '上传中' });
					try {
						const uploaded = await this.normalizeChosenImages(res);
						if (!uploaded.length) {
							uni.showToast({ title: '图片上传失败，请重试', icon: 'none' });
							return;
						}
						this.images = this.images.concat(uploaded).slice(0, 3);
					} finally {
						uni.hideLoading();
					}
				}
			});
		},
		async normalizeChosenImages(res = {}) {
			const tempFiles = Array.isArray(res.tempFiles) ? res.tempFiles.slice(0, 3) : [];
			const paths = (res.tempFilePaths || []).filter(Boolean).slice(0, 3);
			const serverImages = [];
			const count = Math.max(tempFiles.length, paths.length);
			for (let i = 0; i < count; i += 1) {
				const file = tempFiles[i];
				const path = paths[i] || (file && (file.path || file.tempFilePath || file.url));
				try {
					const result = file ? await uploadAnswerImageFile(file) : await uploadAnswerImage(path);
					const url = typeof result === 'string' ? result : (result && (result.url || result.fileName));
					const media = resolveMediaUrl(url);
					if (media) serverImages.push(media);
				} catch (err) {
					console.warn('打卡图片上传失败', err);
				}
			}
			return serverImages;
		},
		removeImage(index) {
			if (this.readOnly) return;
			this.images.splice(index, 1);
		},
		recordImages(item = {}) {
			return resolveMediaList([item.images, item.imageUrls, item.photos, item.photoUrls, item.imageUrl]);
		},
		previewRecordImages(item = {}) {
			this.previewImages(this.recordImages(item), 0);
		},
		previewImages(urls = [], current = 0) {
			const list = (Array.isArray(urls) ? urls : [urls])
				.map(url => resolveMediaUrl(String(url || '').trim()))
				.filter(url => url && isUsableMediaUrl(url));
			if (!list.length) {
				uni.showToast({ title: '暂无可查看图片', icon: 'none' });
				return;
			}
			const safeIndex = Math.min(Math.max(Number(current) || 0, 0), list.length - 1);
			uni.previewImage({ urls: list, current: list[safeIndex] });
		},
		async submitCheckin() {
			if (this.readOnly) {
				uni.showToast({ title: '只读查看，不能修改打卡', icon: 'none' });
				return;
			}
			if (this.isEditLocked) {
				uni.showToast({ title: '超过12小时，今日打卡不能修改', icon: 'none' });
				return;
			}
			if (!this.hasContentInput) {
				uni.showToast({ title: '请填写学习内容', icon: 'none' });
				return;
			}
			if (!this.images.length) {
				uni.showToast({ title: '请上传学习图片', icon: 'none' });
				return;
			}
			const stableImages = this.recordImages({ images: this.images });
			if (!stableImages.length) {
				uni.showToast({ title: '图片还未上传成功，请重新上传', icon: 'none' });
				return;
			}
			const existing = this.currentRecord;
			const now = this.localDateTime();
			const record = {
				...(existing || {}),
				id: existing && existing.id ? existing.id : `checkin-${Date.now()}`,
				courseId: this.courseId || '',
				studentId: this.scopeStudentId(),
				content: this.contentText,
				images: stableImages,
				imageCount: stableImages.length,
				date: this.todayKey(),
				createdAt: existing && existing.createdAt ? existing.createdAt : now,
				updatedAt: now
			};
			try {
				const saved = await saveStudyCheckin(record);
				if (saved && saved.id) {
					record.id = saved.id;
					record.createdAt = saved.createdAt || record.createdAt;
					record.updatedAt = saved.updatedAt || record.updatedAt;
					record.images = this.recordImages(saved);
					if (!record.images.length) record.images = stableImages;
					record.imageCount = record.images.length;
				}
			} catch (err) {
				console.warn('学习打卡保存接口不可用，先保存到本地', err);
			}
			const stored = uni.getStorageSync(CHECKIN_KEY) || [];
			const next = (Array.isArray(stored) ? stored : []).filter(item => !(this.sameScope(item) && this.recordDate(item) === record.date));
			next.unshift(record);
			uni.setStorageSync(CHECKIN_KEY, next);
			this.records = next;
			this.currentRecord = record;
			this.checkedIn = true;
			uni.showToast({ title: '打卡成功', icon: 'success' });
		},
		mergeRecords(primary = [], secondary = []) {
			const byKey = {};
			[...(Array.isArray(secondary) ? secondary : []), ...(Array.isArray(primary) ? primary : [])].forEach(item => {
				if (!item || typeof item !== 'object') return;
				const normalized = {
					...item,
					date: this.recordDate(item),
					studentId: this.recordStudentId(item) || this.scopeStudentId(),
					images: this.recordImages(item)
				};
				const key = `${normalized.studentId || ''}:${normalized.courseId || ''}:${normalized.date || ''}:${normalized.id || ''}`;
				if (!key.replace(/:/g, '')) return;
				if (!byKey[key] || this.recordTime(normalized) >= this.recordTime(byKey[key])) {
					byKey[key] = normalized;
				}
			});
			return Object.values(byKey).sort((a, b) => this.recordTime(b) - this.recordTime(a));
		},
		sharedRecords() {
			const byDate = {};
			this.records.filter(item => this.sameScope(item)).forEach(item => {
				const date = this.recordDate(item);
				if (!date) return;
				const normalized = {
					...item,
					date,
					images: this.recordImages(item)
				};
				normalized.imageCount = normalized.images.length;
				if (!byDate[date] || this.recordTime(normalized) >= this.recordTime(byDate[date])) {
					byDate[date] = normalized;
				}
			});
			return Object.values(byDate);
		},
		parseContent(content = '') {
			const form = emptyCheckinForm();
			let currentKey = '';
			String(content).split(/\r?\n/).forEach(line => {
				const matched = CONTENT_FIELDS.find(field => line.trim().startsWith(field.label));
				if (matched) {
					currentKey = matched.key;
					form[currentKey] = line.replace(matched.label, '').trim();
					return;
				}
				if (currentKey && line.trim()) {
					form[currentKey] = form[currentKey] ? `${form[currentKey]}\n${line.trim()}` : line.trim();
				}
			});
			if (!CONTENT_FIELDS.some(field => form[field.key])) {
				form.learned = String(content).trim();
			}
			return form;
		},
		sameScope(item = {}) {
			const recordId = this.recordStudentId(item);
			if (recordId) return recordId === this.scopeStudentId();
			return !this.studentId;
		},
		scopeStudentId() {
			const user = this.storedUserInfo();
			return this.studentId || user.id || user.userId || user.user_id || user.uid || user.phone || '';
		},
		recordStudentId(item = {}) {
			return item.studentId || item.userId || item.user_id || item.uid || '';
		},
		storedUserInfo() {
			return uni.getStorageSync('userInfo') || {};
		},
		recordDate(item = {}) {
			return item.date || this.dateKeyFrom(item.updatedAt || item.createdAt);
		},
		recordTime(item = {}) {
			const raw = item.updatedAt || item.createdAt || '';
			const time = raw ? new Date(String(raw).replace(' ', 'T')).getTime() : 0;
			return Number.isFinite(time) ? time : 0;
		},
		createdTime(item = {}) {
			const raw = item.createdAt || item.updatedAt || '';
			const time = raw ? new Date(String(raw).replace(' ', 'T')).getTime() : 0;
			return Number.isFinite(time) ? time : 0;
		},
		dateKeyFrom(value = '') {
			const match = String(value).match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
			return match ? `${match[1]}-${this.pad(match[2])}-${this.pad(match[3])}` : '';
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
.hero-ico { width:120rpx; height:120rpx; display:flex; align-items:center; justify-content:center; font-size:72rpx; flex-shrink:0; color:#1677ff; }
.date-row { margin-top:34rpx; min-height:86rpx; display:flex; align-items:center; padding:0 28rpx; border-radius:8rpx 8rpx 0 0; background:#80d9f2; color:#111827; font-size:34rpx; font-weight:900; }
.date-ico { margin-right:18rpx; color:#333; font-size:30rpx; }
.readonly-box { padding:26rpx 28rpx 30rpx; border-radius:0 0 10rpx 10rpx; background:#fff; border-top:1rpx solid #eef2f7; }
.readonly-title { color:#111827; font-size:30rpx; font-weight:900; }
.readonly-text { margin-top:10rpx; color:#667085; font-size:24rpx; line-height:1.5; }
.form-box { padding:26rpx 28rpx 30rpx; border-radius:0 0 10rpx 10rpx; background:#fff; }
.field-label { color:#111827; font-size:30rpx; font-weight:900; }
.image-label { margin-top:28rpx; }
.image-label text { color:#8a94a3; font-size:26rpx; font-weight:700; }
.content-editor { margin-top:18rpx; min-height:260rpx; box-sizing:border-box; padding:26rpx 28rpx; border-radius:10rpx; border:1rpx solid #edf0f4; background:#fbfdff; }
.content-line { display:flex; align-items:flex-start; gap:8rpx; margin-bottom:14rpx; color:#334155; font-size:28rpx; line-height:1.55; }
.content-line:last-child { margin-bottom:0; }
.content-prefix { flex-shrink:0; width:214rpx; color:#374151; font-weight:500; line-height:44rpx; white-space:nowrap; }
.content-value { flex:1; min-width:0; width:100%; min-height:44rpx; padding:0; background:transparent; color:#222; font-size:28rpx; line-height:1.55; }
.content-ph { color:#9aa4b2; }
.image-row { display:flex; flex-wrap:wrap; gap:18rpx; margin-top:18rpx; }
.upload-cell, .image-cell { width:150rpx; height:150rpx; border-radius:8rpx; position:relative; overflow:hidden; flex-shrink:0; }
.upload-cell { border:1rpx dashed #cfd6df; background:#f8fafc; color:#8a94a3; display:flex; flex-direction:column; align-items:center; justify-content:center; font-size:24rpx; }
.camera { font-size:38rpx; margin-bottom:10rpx; }
.preview { width:100%; height:100%; display:block; cursor:pointer; }
.remove { position:absolute; top:6rpx; right:6rpx; width:34rpx; height:34rpx; line-height:32rpx; text-align:center; border-radius:50%; background:rgba(0,0,0,.55); color:#fff; font-size:28rpx; }
.submit { margin-top:44rpx; height:88rpx; border-radius:44rpx; display:flex; align-items:center; justify-content:center; gap:16rpx; background:#458af7; color:#fff; font-size:34rpx; font-weight:900; }
.submit.done { background:#458af7; }
.submit.locked { background:#aab4c3; }
.submit-ico { font-size:34rpx; }
.record-panel { max-width:640rpx; margin:18rpx auto 0; padding:24rpx; background:#fff; border:1rpx solid #dfeaf5; border-radius:14rpx; box-sizing:border-box; box-shadow:0 8rpx 20rpx rgba(37,99,235,.06); }
.record-head { display:flex; align-items:flex-start; justify-content:space-between; gap:18rpx; }
.panel-title { color:#111827; font-size:30rpx; font-weight:900; }
.panel-sub { margin-top:8rpx; color:#8a94a3; font-size:23rpx; line-height:1.4; }
.record-total { flex-shrink:0; min-width:74rpx; height:48rpx; line-height:48rpx; text-align:center; border-radius:999rpx; background:#eef6ff; color:#2563eb; font-size:23rpx; font-weight:900; }
.record-empty { display:flex; align-items:center; gap:18rpx; margin-top:22rpx; padding:24rpx; border-radius:12rpx; background:#f8fafc; border:1rpx dashed #d7e1ec; }
.empty-mark { width:54rpx; height:54rpx; border-radius:12rpx; background:#eaf4ff; color:#1677ff; display:flex; align-items:center; justify-content:center; font-size:24rpx; font-weight:900; flex-shrink:0; }
.empty-title { color:#334155; font-size:26rpx; font-weight:900; }
.empty-sub { margin-top:6rpx; color:#8a94a3; font-size:23rpx; line-height:1.45; }
.record-list { margin-top:18rpx; }
.record { display:flex; gap:16rpx; padding:18rpx 0; border-top:1rpx solid #eef2f7; color:#333; }
.record:first-child { border-top:0; padding-top:4rpx; }
.record-dot { width:18rpx; height:18rpx; margin-top:12rpx; border-radius:50%; background:#3aa3f5; box-shadow:0 0 0 8rpx #eaf4ff; flex-shrink:0; }
.record-main { flex:1; min-width:0; }
.record-top { display:flex; align-items:center; justify-content:space-between; gap:14rpx; }
.record-date { color:#1f2933; font-size:26rpx; font-weight:900; }
.record-text { margin-top:10rpx; color:#697386; font-size:24rpx; line-height:1.5; white-space:pre-wrap; overflow:hidden; display:-webkit-box; -webkit-line-clamp:4; -webkit-box-orient:vertical; }
.record-images { display:grid; grid-template-columns:repeat(3, minmax(0, 1fr)); gap:10rpx; margin-top:14rpx; }
.record-image { width:100%; height:112rpx; border-radius:10rpx; background:#eef2f7; border:1rpx solid #e1e8f0; box-sizing:border-box; cursor:pointer; }
.record-count { flex-shrink:0; padding:6rpx 12rpx; border-radius:999rpx; background:#ecfdf5; border:1rpx solid transparent; color:#0f766e; font-size:22rpx; font-weight:900; }
.record-count.clickable { cursor:pointer; border-color:#bbf0dc; box-shadow:0 6rpx 14rpx rgba(15,118,110,.12); }
.record-count.clickable:active { opacity:.78; }
</style>

# Online Course App

## 项目简介

在线课程系统用户端，基于 uni-app/Vue3 构建，面向学员提供课程浏览、登录、我的课程、学习报告、学习计划、视频学习、练习测评、错题本、AI 问答和授权激活等功能。

## 技术栈

- uni-app
- Vue 3
- Vite 5
- Sass
- DCloud uni 组件体系

## 关联仓库

| 子项目 | GitHub 仓库 | 说明 |
| --- | --- | --- |
| 后端服务 | [online-course-backend](https://github.com/jiangyi3265/online-course-backend) | Spring Boot 后端，提供用户端课程学习接口 |
| 管理后台 | [online-course-admin](https://github.com/jiangyi3265/online-course-admin) | Vue3 管理后台，维护课程与运营数据 |
| 用户端 | [online-course-app](https://github.com/jiangyi3265/online-course-app) | 当前仓库，提供学员侧 H5/多端学习入口 |

## 快速启动

```powershell
# 先启动 online-course-backend，默认监听 8080
npm install
npm run dev:h5
```

本地开发默认请求 `http://127.0.0.1:8080/course/app`。如需构建 H5：

```powershell
npm run build:h5
```

## 简历描述示例

基于 uni-app 和 Vue3 开发在线课程用户端，实现课程学习、学习报告、练习测评、错题本与 AI 问答等核心学习链路，并与后端 API 完成多端适配。

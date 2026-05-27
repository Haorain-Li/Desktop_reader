# Desktop Reader

一款基于 Electron + React 的桌面端电子书阅读器，支持 EPUB、PDF、TXT 三种格式。

## 功能特性

- 支持 EPUB、PDF、TXT 格式的电子书阅读
- 书籍管理：导入、删除、收藏、搜索、筛选、排序
- 阅读进度记录与书签功能
- 深色 / 浅色主题切换
- 阅读时长统计
- 拖放导入书籍
- 书籍封面自动提取
- 数据导入导出（JSON 格式）

## 技术栈

- Electron 42
- React 19 + TypeScript
- Vite 8
- Tailwind CSS 4
- epubjs（EPUB 解析）
- react-pdf（PDF 解析）

## 开发

```bash
# 安装依赖
npm install

# 启动开发环境
npm run dev

# 构建
npm run build
```

## 项目结构

```
├── electron/           # Electron 主进程
│   ├── main.ts         # 窗口管理、IPC 通信、数据存储
│   └── preload.ts      # 预加载脚本，安全暴露 API
├── src/
│   ├── components/     # React 组件
│   ├── store/          # 状态管理
│   ├── types/          # TypeScript 类型定义
│   ├── utils/          # 工具函数
│   ├── App.tsx         # 应用入口
│   └── main.tsx        # 渲染进程入口
├── index.html          # HTML 入口
├── vite.config.ts      # Vite 配置
└── package.json
```

## License

MIT

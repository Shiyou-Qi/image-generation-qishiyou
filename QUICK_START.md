# 快速开始指南

## 即时可用功能

你的应用已配置了完整的用户系统！以下是立即可用的功能：

### ✅ 已完成
- [x] Supabase 认证集成
- [x] 邮箱/密码注册和登录
- [x] 用户资料管理
- [x] 创作历史数据库表
- [x] 受保护的仪表板和路由
- [x] API 端点用于获取用户数据
- [x] 历史记录的自动保存
- [x] 中间件保护

### ⚙️ 需要配置的功能

#### 1. Google OAuth 设置（必需）

要启用 Google OAuth 登录：

1. **获取 Google OAuth 凭证**
   - 访问 [Google Cloud Console](https://console.cloud.google.com)
   - 创建新项目或选择现有项目
   - 启用 Google+ API
   - 创建 OAuth 2.0 客户端 ID (Web 应用)
   - 添加授权重定向 URI:
     - 本地: `http://localhost:3000/auth/callback`
     - 生产: `https://你的域名/auth/callback`
   - 复制 Client ID 和 Client Secret

2. **在 Supabase 中配置**
   - 登录 [Supabase 仪表板](https://supabase.com/dashboard)
   - 选择你的项目
   - 进入 **Authentication** → **Providers**
   - 找到 **Google** 提供商
   - 启用它
   - 输入 Client ID 和 Client Secret
   - 点击保存

#### 2. 邮件配置（推荐）

配置邮件以发送确认链接和密码重置：

1. 在 Supabase 中进入 **Authentication** → **Email Templates**
2. 自定义邮件模板（可选）
3. 配置发送者邮箱地址

#### 3. 生产环境部署

1. **推送代码到 GitHub**
   ```bash
   git push origin main
   ```

2. **在 Vercel 中部署**
   - 连接你的 GitHub 仓库
   - 环境变量已自动配置
   - 点击部署

## 应用结构

```
app/
├── page.tsx                    # 主首页（含导航）
├── auth/
│   ├── login/page.tsx         # 登录页面
│   ├── signup/page.tsx        # 注册页面
│   ├── signup-success/page.tsx # 注册成功页
│   ├── callback/route.ts      # OAuth 回调
│   └── error/page.tsx         # 错误页面
├── dashboard/
│   ├── layout.tsx             # 受保护的布局
│   ├── page.tsx               # 仪表板主页
│   ├── history/page.tsx       # 创作历史
│   └── profile/page.tsx       # 个人资料
└── api/
    ├── profile/route.ts       # 获取用户资料
    ├── stats/route.ts         # 获取统计信息
    └── history/
        ├── route.ts           # 获取历史记录
        └── [id]/route.ts      # 删除历史记录

lib/
├── supabase/
│   ├── client.ts              # 客户端配置
│   ├── server.ts              # 服务端配置
│   └── proxy.ts               # 代理配置
├── history.ts                 # 历史记录工具函数
└── anonymous-generations.ts   # 本地历史存储

components/
├── image-combiner/            # 图像生成组件
└── dashboard-nav.tsx          # 导航栏

middleware.ts                  # 认证中间件
```

## 文件大小参考

- `profiles` 表: ~200 字节/用户
- `generation_history` 记录: ~500 字节/记录
- 图像存储: Vercel Blob（自动）

## 环境变量

所有必需的环境变量已配置：

```
NEXT_PUBLIC_SUPABASE_URL          # Supabase URL
NEXT_PUBLIC_SUPABASE_ANON_KEY     # 公开密钥
SUPABASE_SERVICE_ROLE_KEY         # 服务角色密钥
```

## 测试清单

使用以下步骤测试应用：

- [ ] 访问主首页，查看登录/注册链接
- [ ] 注册新账户
- [ ] 确认邮箱链接
- [ ] 登录账户
- [ ] 访问仪表板
- [ ] 查看个人资料
- [ ] 修改显示名称
- [ ] 生成图像
- [ ] 查看历史记录
- [ ] 复制提示词
- [ ] 下载图像
- [ ] 删除历史记录
- [ ] 登出
- [ ] 测试 Google 登录（如配置）

## 数据库操作

### 查看 RLS 状态

在 Supabase SQL 编辑器中运行：

```sql
-- 检查 RLS 是否启用
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('profiles', 'generation_history');

-- 查看所有策略
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('profiles', 'generation_history');
```

### 测试数据

```sql
-- 查看用户创建的记录
SELECT * FROM generation_history WHERE user_id = 'YOUR_USER_ID';

-- 统计用户的生成数
SELECT COUNT(*) FROM generation_history WHERE user_id = 'YOUR_USER_ID';
```

## 常见命令

```bash
# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 运行生产版本
npm start

# 检查 lint
npm run lint
```

## 下一步

1. **Google OAuth 配置** - 按照上面的说明启用
2. **自定义样式** - 修改组件和主题
3. **添加功能** - 扩展历史记录功能（标签、收藏等）
4. **部署** - 推送到 Vercel

## 需要帮助？

- 查看 `USER_SYSTEM_GUIDE.md` 了解完整文档
- 查看 Supabase 文档: https://supabase.com/docs
- 查看 Next.js 文档: https://nextjs.org/docs

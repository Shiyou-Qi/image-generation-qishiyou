# 完整的用户系统指南

本项目实现了一个完整的用户系统，包括认证、授权和创作历史管理。

## 功能概述

### 1. 认证系统
- **邮箱/密码注册和登录** - 用户可以使用邮箱和密码创建账户或登录
- **Google OAuth登录** - 支持一键Google登录
- **邮箱确认** - 新用户需要确认邮箱后才能完全使用服务
- **密码重置** - 用户可以通过邮箱重置密码

### 2. 用户管理
- **个人资料管理** - 用户可以查看和更新显示名称、邮箱等信息
- **个人资料页面** - 完整的个人资料管理界面
- **账户统计** - 显示用户的创作总数和最近活动

### 3. 创作历史记录
- **自动保存** - 完成的图像生成自动保存到用户账户
- **历史查看** - 在仪表板的历史页面查看所有创作
- **历史管理** - 可以删除、复制提示词、下载图像
- **搜索功能** - 可以按提示词搜索历史记录

### 4. 受保护的路由
- `/dashboard` - 用户仪表板（需要登录）
- `/dashboard/history` - 创作历史页面
- `/dashboard/profile` - 个人资料管理页面

## 数据库架构

### profiles 表
```sql
- id (UUID) - 外键引用 auth.users(id)
- email (TEXT) - 用户邮箱
- display_name (TEXT) - 显示名称
- avatar_url (TEXT) - 头像URL
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### generation_history 表
```sql
- id (UUID) - 主键
- user_id (UUID) - 用户ID
- prompt (TEXT) - 生成时使用的提示词
- model (TEXT) - 使用的模型
- image_urls (TEXT[]) - 生成的图像URLs数组
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

所有表都启用了Row Level Security（RLS），确保用户只能访问自己的数据。

## API 端点

### GET /api/profile
获取当前登录用户的个人资料信息。
**响应示例：**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "display_name": "John Doe",
  "avatar_url": null,
  "created_at": "2024-01-01T00:00:00Z"
}
```

### GET /api/stats
获取用户的统计信息。
**响应示例：**
```json
{
  "total": 42,
  "latestDate": "2024-06-29T10:00:00Z"
}
```

### GET /api/history
获取用户的创作历史记录（最多100条）。
**响应示例：**
```json
[
  {
    "id": "uuid",
    "prompt": "A beautiful sunset over the ocean",
    "model": "gemini-2.0-flash",
    "image_urls": ["https://..."],
    "created_at": "2024-06-29T10:00:00Z"
  }
]
```

### DELETE /api/history/[id]
删除指定的历史记录。

## 设置步骤

### 1. 基础设置已完成
- Supabase 数据库已创建
- RLS 策略已配置
- 中间件已设置

### 2. 配置 Google OAuth（重要）

要启用 Google OAuth 登录，你需要在 Supabase 中配置：

1. 登录 [Supabase 仪表板](https://supabase.com/dashboard)
2. 选择你的项目
3. 进入 **Authentication** → **Providers**
4. 启用 **Google** 提供商
5. 添加你的 Google OAuth 凭证：
   - 从 [Google Cloud Console](https://console.cloud.google.com) 获取
   - 创建 OAuth 2.0 客户端 ID
   - 设置重定向 URI: `https://你的域名/auth/callback`
6. 在 Supabase 中输入 Client ID 和 Client Secret

### 3. 部署到 Vercel

```bash
# 推送到 GitHub
git push origin main

# 在 Vercel 中部署
# 环境变量已自动配置
```

## 使用流程

### 新用户流程
1. 用户点击"注册"按钮
2. 填写显示名称、邮箱和密码
3. 点击"注册"按钮
4. 系统发送确认邮件
5. 用户点击邮件中的确认链接
6. 账户激活，用户可以登录
7. 首次登录后，会自动创建用户资料

### 现有用户流程
1. 用户点击"登录"按钮
2. 选择登录方式：
   - 邮箱/密码登录
   - Google 一键登录
3. 成功登录后跳转到仪表板
4. 在仪表板查看统计、历史和个人资料

### 创建图像后
1. 用户在主页输入提示词并生成图像
2. 图像完成后自动保存到数据库
3. 用户可以在 `/dashboard/history` 查看历史记录
4. 可以对历史记录进行管理（删除、复制、下载）

## 安全特性

1. **Row Level Security (RLS)** - 每个用户只能看到自己的数据
2. **认证中间件** - 受保护的路由需要登录
3. **密码加密** - Supabase 自动加密密码
4. **会话管理** - 安全的会话存储在 HTTP-only cookies 中
5. **CSRF 保护** - 使用 Supabase 的内置 CSRF 保护
6. **参数化查询** - 防止 SQL 注入

## 常见问题

### Q: 用户如何重置密码？
A: 用户可以在个人资料页面点击"更改密码"按钮，系统会发送重置邮件。

### Q: Google 登录不工作怎么办？
A: 检查 Supabase 中 Google OAuth 是否已正确配置，并且重定向 URI 与应用配置一致。

### Q: 如何删除用户账户？
A: 目前不支持自助删除。用户需要联系管理员。可以在 Supabase 仪表板的 Authentication 中手动删除用户。

### Q: 历史记录会自动清理吗？
A: 不会。历史记录会永久保存直到用户手动删除。

## 扩展功能建议

1. **头像上传** - 允许用户上传自定义头像
2. **社交分享** - 分享生成的图像到社交媒体
3. **收藏夹** - 标记喜欢的生成结果
4. **导出数据** - 导出所有历史记录
5. **高级搜索** - 按日期、模型等筛选历史
6. **两步验证** - 增强账户安全性

## 故障排除

### 认证问题
- 检查 `.env.development.local` 中的 Supabase 密钥是否正确
- 确保 Supabase 项目中已启用邮箱认证
- 检查邮件配置是否正确

### 数据库问题
- 验证 RLS 策略是否正确应用
- 检查用户是否有正确的权限
- 查看 Supabase 日志以获取详细信息

### OAuth 问题
- 验证 Google OAuth 凭证是否正确输入
- 检查重定向 URI 是否与配置一致
- 确保 OAuth 同意屏幕已在 Google Cloud 中配置

## 支持

如遇到任何问题，请查阅 Supabase 文档或提交 issue。

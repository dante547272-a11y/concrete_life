# 删除 concrete-plant-edge 文件夹指南

由于 node_modules 中的某些文件有权限保护，无法直接通过命令行删除。

## 🗑️ 删除方法

### 方法 1：使用 Finder（推荐，最简单）

1. 打开 **Finder**
2. 按 `Cmd + Shift + G` 打开"前往文件夹"
3. 输入：`/Users/alexzhuang/Downloads/concrete_life`
4. 找到 `concrete-plant-edge` 文件夹
5. 右键点击 → 选择"移到废纸篓"
6. 如果提示需要权限，输入管理员密码
7. 清空废纸篓

### 方法 2：使用终端（需要管理员权限）

```bash
# 在终端中运行
cd /Users/alexzhuang/Downloads/concrete_life
sudo rm -rf concrete-plant-edge
```

输入管理员密码后即可删除。

### 方法 3：修改权限后删除

```bash
cd /Users/alexzhuang/Downloads/concrete_life
chmod -R 777 concrete-plant-edge
rm -rf concrete-plant-edge
```

---

## ✅ 删除后的项目结构

删除后，你将只保留两个项目：

```
concrete_life/
├── concrete-plant-api/      # 后端 API（云端/边缘通用）
├── concrete-plant-web/      # 前端 Web（云端/边缘通用）
└── README.md
```

---

## 💡 为什么要删除？

你提到"云和边都使用一套代码"，这是个很好的决定：

### 优点：
- ✅ **代码统一**：只需维护一套代码
- ✅ **功能一致**：云端和边缘功能完全相同
- ✅ **易于部署**：同一套代码可以部署到不同环境
- ✅ **减少维护成本**：不需要同步两套代码

### 实现方式：

**concrete-plant-api** 可以通过环境变量区分运行模式：

```typescript
// .env
NODE_ENV=production
DEPLOYMENT_MODE=cloud    # 或 edge

# 云端模式
DATABASE_URL=postgresql://...
REDIS_URL=redis://...

# 边缘模式
DATABASE_URL=file:./edge.db
REDIS_URL=redis://localhost:6379
```

**concrete-plant-web** 前端代码完全通用，通过 API 地址配置连接不同的后端：

```typescript
// 云端
API_URL=https://api.concrete-cloud.com

// 边缘
API_URL=http://localhost:3000
```

---

## 🚀 下一步建议

1. **删除 concrete-plant-edge 文件夹**
2. **在 concrete-plant-api 中添加边缘模式支持**
3. **使用环境变量区分云端/边缘部署**
4. **保持一套代码，多种部署方式**

---

## 📝 需要帮助？

如果删除遇到问题，可以：
1. 重启电脑后再尝试删除
2. 使用 Finder 的"显示简介"检查文件权限
3. 使用磁盘工具修复权限

删除成功后，你就可以专注于维护 `concrete-plant-api` 和 `concrete-plant-web` 这两个项目了！

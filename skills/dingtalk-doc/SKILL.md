---
name: dingtalk-doc
description: |
  钉钉文档操作。当用户提到钉钉文档、云文档、知识库时激活。
---

# DingTalk Doc Tool

钉钉文档操作工具 (`dingtalk_doc`)，支持文档的创建、查询、编辑、复制。

## Token 提取

从 URL 提取文档标识：
- `https://alidocs.dingtalk.com/i/spaces/xxx/docs/yyy` → `spaceId=xxx`, `dentryId=yyy`
- `https://alidocs.dingtalk.com/i/docs/xxx` → `docKey=xxx`

## Actions

### 创建文档/文件夹

```json
{
  "action": "create",
  "spaceId": "空间ID",
  "parentDentryId": "父目录ID（可选）",
  "name": "新文档名称",
  "dentryType": "file"
}
```

参数说明：
- `dentryType`：`file`（文档）或 `folder`（文件夹）
- `operatorId`：操作者用户ID

### 获取文件列表

```json
{
  "action": "list",
  "spaceId": "空间ID",
  "parentDentryId": "目录ID（可选）",
  "maxResults": 20
}
```

分页参数：
- `maxResults`：每页数量，默认20
- `nextToken`：下一页标记

### 获取文档信息

```json
{
  "action": "info",
  "spaceId": "空间ID",
  "dentryId": "文档ID"
}
```

返回：文档名称、类型、创建时间、修改时间等。

### 覆写文档内容

```json
{
  "action": "write",
  "docKey": "文档Key",
  "content": "# Markdown 内容\n\n这是文档正文。"
}
```

> **⚠️ 警告**：覆写操作会**完全替换**文档现有内容！

支持的 Markdown 格式：
- 标题 (`#`, `##`, `###`)
- 列表 (`-`, `1.`)
- 加粗/斜体 (`**bold**`, `*italic*`)
- 代码块
- 引用 (`>`)

### 复制文档

```json
{
  "action": "copy",
  "spaceId": "源空间ID",
  "dentryId": "源文档ID",
  "name": "副本名称（可选）",
  "targetSpaceId": "目标空间ID（可选）",
  "targetParentDentryId": "目标目录ID（可选）"
}
```

复制操作可能是**异步**的，返回 `taskId`。

### 获取异步任务状态

```json
{
  "action": "get_task",
  "taskId": "任务ID"
}
```

返回：任务状态（processing/success/failed）。

## 典型使用流程

```
用户：帮我在"项目文档"空间下创建一个新文档
   ↓
1. dingtalk_doc(action="list", spaceId="space123")
   → 确认空间存在
   ↓
2. dingtalk_doc(action="create",
     spaceId="space123",
     name="新文档",
     dentryType="file")
   → 返回: dentryId = "doc456"
   ↓
3. dingtalk_doc(action="write",
     docKey="doc456_key",
     content="# 文档标题\n\n文档内容...")
```

## 注意事项

1. 需要先获取 `spaceId` 才能操作文档
2. 覆写操作支持 Markdown 格式，但**不支持表格**
3. 复制操作可能是异步的，需要用 `get_task` 查询状态
4. `docKey` 和 `dentryId` 是不同的标识，注意区分

## 权限配置

在钉钉开放平台配置以下权限：

| 权限点 | 说明 | 必需 |
|--------|------|------|
| `Yida.Space.Read` | 读取空间信息 | ✅ |
| `Yida.File.Read` | 读取文档信息 | ✅ |
| `Yida.File.Write` | 创建/编辑/删除文档 | 写入时需要 |
| `Yida.File.Copy` | 复制文档 | 复制时需要 |

或使用通用文档权限：
| 权限点 | 说明 |
|--------|------|
| `doc.document.read` | 读取文档 |
| `doc.document.write` | 编辑文档 |

**权限申请路径：** 钉钉开放平台 → 应用管理 → 权限管理 → 文档

> **常见错误：** 
> - "没有调用该接口的权限" → 检查是否已开通文档相关权限
> - "空间不存在" → 确认 spaceId 正确，或用户有访问该空间的权限
> - "文档不存在" → 确认 dentryId/docKey 正确

## 已知限制

- **Markdown 表格不支持**：write 操作不支持 Markdown 表格语法
- **机器人无个人空间**：机器人使用企业凭据，没有"我的空间"概念，只能访问被分享的空间

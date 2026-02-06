---
name: dingtalk-doc
description: 钉钉文档操作。当用户提到钉钉文档、云文档、知识库时激活。
---

# DingTalk Doc Tool

钉钉文档操作工具 (`dingtalk_doc`)，支持以下操作：

## Actions

### 创建文档/文件夹
```json
{
  "action": "create",
  "targetSpaceId": "空间ID",
  "targetFolderId": "父目录ID",
  "name": "新文档名称",
  "type": "FILE 或 FOLDER"
}
```

### 获取文件列表
```json
{
  "action": "list",
  "spaceId": "空间ID",
  "folderId": "目录ID"
}
```

### 获取文档信息
```json
{
  "action": "info",
  "dentryId": "文档ID"
}
```

### 覆写文档内容
```json
{
  "action": "write",
  "docKey": "文档Key",
  "content": "# Markdown 内容"
}
```

> **注意**：覆写操作会完全替换文档现有内容。

### 复制文档
```json
{
  "action": "copy",
  "sourceDentryUuid": "源文档UUID",
  "targetParentDentryUuid": "目标目录UUID"
}
```

### 获取任务状态
```json
{
  "action": "get_task",
  "taskId": "任务ID"
}
```

## 使用场景

- 用户说"帮我创建一个文档"时调用 `create`
- 用户说"查看我的文档列表"时调用 `list`
- 用户说"把这个文档复制到XXX"时调用 `copy`
- 用户说"更新这个文档的内容"时调用 `write`

## 注意事项

1. 需要先获取 spaceId 才能操作文档
2. 覆写操作支持 Markdown 格式
3. 复制操作可能是异步的，需要用 `get_task` 查询状态

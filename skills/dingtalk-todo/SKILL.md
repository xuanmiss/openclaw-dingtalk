---
name: dingtalk-todo
description: 钉钉待办任务操作。当用户提到待办、TODO、任务提醒时激活。
---

# DingTalk Todo Tool

钉钉待办任务工具 (`dingtalk_todo`)，支持以下操作：

## Actions

### 创建待办
```json
{
  "action": "create",
  "userId": "用户ID",
  "title": "待办标题（最多50字符）",
  "url": "点击跳转的URL（可选）",
  "formItems": [
    { "title": "详情", "content": "具体内容" }
  ]
}
```

### 查询待办列表
```json
{
  "action": "list",
  "userId": "用户ID",
  "status": 0
}
```

参数说明：
- `status`: 0=未完成，1=已完成

### 标记待办完成
```json
{
  "action": "complete",
  "userId": "用户ID",
  "recordId": "待办记录ID"
}
```

## 使用场景

- 用户说"帮我创建一个待办"时调用 `create`
- 用户说"查看我的待办"时调用 `list`
- 用户说"这个任务完成了"时调用 `complete`

## 注意事项

1. 待办标题最多50字符，超过会被截断
2. 创建待办后，会出现在钉钉客户端的"待办"页面
3. 需要获取用户的 userId 才能操作待办

---
name: dingtalk-todo
description: |
  钉钉待办任务操作。当用户提到待办、TODO、任务提醒时激活。
---

# DingTalk Todo Tool

钉钉待办任务工具 (`dingtalk_todo`)，支持待办的创建、查询、更新、删除。

## 获取用户 ID

操作待办需要用户的 `unionId`。如果只知道用户姓名，需要先使用 `dingtalk_contact` 工具搜索：
```json
{ "action": "search_user", "queryWord": "张三" }
```

## Actions

### 创建待办

```json
{
  "action": "create",
  "unionId": "用户unionId",
  "subject": "待办主题",
  "description": "待办详情",
  "dueTime": 1707206400000,
  "executorIds": ["executor_union_id1"],
  "participantIds": ["participant_union_id1"],
  "priority": 20
}
```

参数说明：
- `subject`：待办主题（必填，最多1024字符）
- `dueTime`：截止时间，毫秒时间戳
- `executorIds`：执行者 unionId 列表
- `participantIds`：参与者 unionId 列表
- `priority`：优先级（10=低，20=普通，40=紧急，60=非常紧急）

### 查询待办列表

```json
{
  "action": "list",
  "unionId": "用户unionId",
  "isDone": false,
  "nextToken": "",
  "maxResults": 20
}
```

### 获取待办详情

```json
{
  "action": "get",
  "unionId": "用户unionId",
  "taskId": "待办任务ID"
}
```

### 更新待办

```json
{
  "action": "update",
  "unionId": "用户unionId",
  "taskId": "待办任务ID",
  "subject": "更新后的主题",
  "done": true
}
```

### 删除待办

```json
{
  "action": "delete",
  "unionId": "用户unionId",
  "taskId": "待办任务ID"
}
```

## 典型使用流程

```
用户：帮我创建一个待办，下周一前完成，分配给李四
   ↓
1. dingtalk_contact(action="search_user", queryWord="李四")
   → 返回: unionId = "union123"
   ↓
2. dingtalk_todo(action="create",
     unionId="当前用户unionId",
     subject="待办任务",
     executorIds=["union123"],
     dueTime=1707206400000)
```

## 注意事项

1. 待办使用 `unionId` 而非 `userId`
2. `dueTime` 是毫秒时间戳，不是 ISO8601 格式
3. 创建待办后，会出现在钉钉客户端的"待办"页面
4. `executorIds` 和 `participantIds` 都是 unionId 列表

## 权限配置

在钉钉开放平台配置以下权限：

| 权限点 | 说明 | 必需 |
|--------|------|------|
| `Todo.Todo.Read` | 读取待办信息 | ✅ |
| `Todo.Todo.Write` | 创建/修改/删除待办 | ✅ |

**权限申请路径：** 钉钉开放平台 → 应用管理 → 权限管理 → 待办

> **常见错误：** 
> - "没有调用该接口的权限" → 检查是否已开通待办相关权限
> - "unionId 无效" → 注意待办使用 unionId，不是 userId
> - "时间格式错误" → dueTime 需要毫秒时间戳

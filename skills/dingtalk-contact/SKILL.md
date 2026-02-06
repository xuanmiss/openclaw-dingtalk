---
name: dingtalk-contact
description: 钉钉通讯录操作。当需要搜索用户、部门，或将姓名转换为用户ID时激活。
---

# DingTalk Contact Tool

钉钉通讯录工具 (`dingtalk_contact`)，用于将姓名转换为userId，支持以下操作：

## Actions

### 搜索用户
按姓名搜索用户，返回 userId 列表：
```json
{
  "action": "search_user",
  "queryWord": "张三",
  "size": 10
}
```

### 搜索部门
按名称搜索部门，返回部门 ID 列表：
```json
{
  "action": "search_department",
  "queryWord": "财务部",
  "size": 10
}
```

### 获取用户详情
根据 unionId 获取用户详细信息：
```json
{
  "action": "get_user",
  "unionId": "用户的unionId"
}
```

## 使用场景

- 用户说"邀请张三参加会议"时，先调用 `search_user` 获取张三的 userId
- 用户说"把任务分配给李四"时，先调用 `search_user` 获取李四的 userId
- 用户说"查找财务部"时调用 `search_department`

## 与其他工具配合

```mermaid
graph LR
    A[用户: 邀请张三] --> B[search_user]
    B --> C[获得 userId]
    C --> D[create_event with attendeeIds]
```

## 注意事项

1. `search_user` 返回的是 userId 列表，可能有多个同名用户
2. `get_user` 需要 unionId，可从其他接口获取
3. 搜索结果默认返回10条，可通过 `size` 调整

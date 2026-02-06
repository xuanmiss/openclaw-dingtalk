---
name: dingtalk-contact
description: |
  钉钉通讯录操作。当需要搜索用户、部门，或将姓名转换为用户ID时激活。
---

# DingTalk Contact Tool

钉钉通讯录工具 (`dingtalk_contact`)，用于将姓名转换为 userId，支持以下操作。

**重要：** 这是其他工具的前置依赖工具。创建日程邀请他人、分配待办任务等场景都需要先用此工具获取用户 ID。

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

参数说明：
- `queryWord`：搜索关键词（必填）
- `offset`：翻页偏移量，默认 0
- `size`：返回数量，默认 10
- `fullMatchField`：1=精确匹配

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

返回：用户姓名、手机号、邮箱、头像等信息。

## 典型使用流程

```
用户：帮我创建会议邀请张三
   ↓
1. dingtalk_contact(action="search_user", queryWord="张三")
   → 返回: { userId: "user123" }
   ↓
2. dingtalk_calendar(action="create_event", attendeeIds=["user123"], ...)
   → 创建成功
```

## 注意事项

1. `search_user` 可能返回多个同名用户，需用户确认
2. `get_user` 需要 unionId（不是 userId）
3. 搜索是模糊匹配，设置 `fullMatchField=1` 可精确匹配

## 权限配置

在钉钉开放平台配置以下权限：

| 权限点 | 说明 | 必需 |
|--------|------|------|
| `Contact.User.Read` | 读取通讯录用户信息 | ✅ |
| `Contact.User.mobile` | 获取用户手机号 | 可选 |
| `Contact.User.email` | 获取用户邮箱 | 可选 |
| `Contact.Department.Read` | 读取部门信息 | 搜索部门时需要 |

**权限申请路径：** 钉钉开放平台 → 应用管理 → 权限管理 → 通讯录管理

> **常见错误：** 如果返回 "没有调用该接口的权限"，请检查是否已开通上述权限并已发布应用。

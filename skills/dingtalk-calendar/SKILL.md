---
name: dingtalk-calendar
description: |
  钉钉日历操作。当用户提到日历、日程、会议安排时激活。
---

# DingTalk Calendar Tool

钉钉日历工具 (`dingtalk_calendar`)，支持日程的创建、查询、删除。

## 获取用户 ID

操作日历需要用户的 `userId`。如果只知道用户姓名，需要先使用 `dingtalk_contact` 工具搜索：
```json
{ "action": "search_user", "queryWord": "张三" }
```

## Actions

### 查询日历列表

```json
{
  "action": "list_calendars",
  "userId": "用户ID"
}
```

### 查询日程列表

```json
{
  "action": "list_events",
  "userId": "用户ID",
  "calendarId": "primary",
  "timeMin": "2026-02-06T00:00:00+08:00",
  "timeMax": "2026-02-07T00:00:00+08:00"
}
```

参数说明：
- `calendarId`：日历ID，使用 `primary` 表示主日历
- `timeMin` / `timeMax`：时间范围，ISO8601 格式

### 创建日程

```json
{
  "action": "create_event",
  "userId": "用户ID",
  "summary": "日程标题",
  "description": "日程描述",
  "startDateTime": "2026-02-06T10:00:00+08:00",
  "endDateTime": "2026-02-06T11:00:00+08:00",
  "timeZone": "Asia/Shanghai",
  "location": "会议室A",
  "attendeeIds": ["user1", "user2"]
}
```

全天事件使用 date 代替 dateTime：
```json
{
  "action": "create_event",
  "userId": "用户ID",
  "summary": "全天事件",
  "startDate": "2026-02-06",
  "endDate": "2026-02-07",
  "isAllDay": true
}
```

### 获取日程详情

```json
{
  "action": "get_event",
  "userId": "用户ID",
  "calendarId": "primary",
  "eventId": "日程ID"
}
```

### 删除日程

```json
{
  "action": "delete_event",
  "userId": "用户ID",
  "calendarId": "primary",
  "eventId": "日程ID"
}
```

## 典型使用流程

```
用户：帮我创建明天下午3点与张三的会议
   ↓
1. dingtalk_contact(action="search_user", queryWord="张三")
   → 返回: userId = "user123"
   ↓
2. dingtalk_calendar(action="create_event", 
     userId="当前用户ID",
     summary="与张三的会议",
     attendeeIds=["user123"],
     startDateTime="2026-02-07T15:00:00+08:00",
     endDateTime="2026-02-07T16:00:00+08:00")
```

## 注意事项

1. 时间格式使用 ISO8601，**必须带时区**
2. `calendarId` 使用 `primary` 表示主日历
3. 创建日程时，`summary`、`start`、`end` 是必填项
4. `attendeeIds` 是用户 ID 数组，不是姓名

## 权限配置

在钉钉开放平台配置以下权限：

| 权限点 | 说明 | 必需 |
|--------|------|------|
| `Calendar.Calendar.Read` | 读取日历信息 | ✅ |
| `Calendar.Event.Read` | 读取日程信息 | ✅ |
| `Calendar.Event.Write` | 创建/修改/删除日程 | 创建日程时需要 |
| `Calendar.Attendee.Write` | 管理日程参与者 | 邀请他人时需要 |

**权限申请路径：** 钉钉开放平台 → 应用管理 → 权限管理 → 日历

> **常见错误：** 
> - "没有调用该接口的权限" → 检查是否已开通日历相关权限
> - "userId 无效" → 使用 `dingtalk_contact` 搜索正确的 userId

---
name: dingtalk-calendar
description: 钉钉日历操作。当用户提到日历、日程、会议安排时激活。
---

# DingTalk Calendar Tool

钉钉日历工具 (`dingtalk_calendar`)，支持以下操作：

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

## 使用场景

- 用户说"帮我创建一个日程"时调用 `create_event`
- 用户说"查看我今天的日程"时调用 `list_events`
- 用户说"查看我的日历"时调用 `list_calendars`

## 注意事项

1. 时间格式使用 ISO8601，注意带时区
2. `calendarId` 使用 "primary" 表示主日历
3. 创建日程时，`summary`、`start`、`end` 是必填项

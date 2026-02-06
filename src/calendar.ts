import type { OpenClawPluginApi, OpenClawConfig } from "openclaw/plugin-sdk";
import { z } from "zod";
import * as $OpenApi from "@alicloud/openapi-client";
import * as $Util from "@alicloud/tea-util";
import dingtalk = require("@alicloud/dingtalk");
import { resolveDingtalkAccount } from "./config.js";
import { getDingtalkRuntime } from "./runtime.js";
import { getDingtalkAccessToken } from "./send.js";

// 从 SDK 提取模块
const calendar10 = dingtalk.calendar_1_0;

// ============================================================================
// 类型定义
// ============================================================================

export type DingtalkCalendarAction = "list_calendars" | "list_events" | "create_event" | "get_event" | "delete_event";

export type DingtalkCalendarResult = {
    ok: boolean;
    data?: unknown;
    error?: string;
};

// ============================================================================
// SDK Client 工厂
// ============================================================================

function createCalendarClient(): InstanceType<typeof calendar10.default> {
    const config = new $OpenApi.Config({});
    config.protocol = "https";
    config.regionId = "central";
    const client = new calendar10.default(config);
    return client;
}

// ============================================================================
// 日历操作实现
// ============================================================================

/**
 * 查询日历列表
 */
async function listCalendars(
    accessToken: string,
    params: {
        userId: string;
    },
): Promise<DingtalkCalendarResult> {
    try {
        const client = createCalendarClient();
        const headers = new calendar10.ListCalendarsHeaders({});
        headers.xAcsDingtalkAccessToken = accessToken;
        const response = await client.listCalendarsWithOptions(params.userId, headers, new $Util.RuntimeOptions({}));
        return { ok: true, data: response.body };
    } catch (err) {
        return { ok: false, error: String(err) };
    }
}

/**
 * 查询日程列表
 */
async function listEvents(
    accessToken: string,
    params: {
        userId: string;
        calendarId?: string;
        timeMin?: string;
        timeMax?: string;
        maxResults?: number;
        nextToken?: string;
    },
): Promise<DingtalkCalendarResult> {
    try {
        const client = createCalendarClient();
        const calendarId = params.calendarId || "primary";
        const request = new calendar10.ListEventsRequest({
            timeMin: params.timeMin,
            timeMax: params.timeMax,
            maxResults: params.maxResults,
            nextToken: params.nextToken,
        });
        const headers = new calendar10.ListEventsHeaders({});
        headers.xAcsDingtalkAccessToken = accessToken;
        const response = await client.listEventsWithOptions(params.userId, calendarId, request, headers, new $Util.RuntimeOptions({}));
        return { ok: true, data: response.body };
    } catch (err) {
        return { ok: false, error: String(err) };
    }
}

/**
 * 创建日程
 */
async function createEvent(
    accessToken: string,
    params: {
        userId: string;
        calendarId?: string;
        summary: string;
        description?: string;
        startDateTime?: string;
        startDate?: string;
        endDateTime?: string;
        endDate?: string;
        timeZone?: string;
        isAllDay?: boolean;
        location?: string;
        attendeeIds?: string[];
    },
): Promise<DingtalkCalendarResult> {
    try {
        const client = createCalendarClient();
        const calendarId = params.calendarId || "primary";

        const start = new calendar10.CreateEventRequestStart({
            dateTime: params.startDateTime,
            date: params.startDate,
            timeZone: params.timeZone,
        });
        const end = new calendar10.CreateEventRequestEnd({
            dateTime: params.endDateTime,
            date: params.endDate,
            timeZone: params.timeZone,
        });

        const attendees = params.attendeeIds?.map((id) => new calendar10.CreateEventRequestAttendees({ id }));

        const request = new calendar10.CreateEventRequest({
            summary: params.summary,
            description: params.description,
            start,
            end,
            isAllDay: params.isAllDay,
            attendees,
        });

        if (params.location) {
            request.location = new calendar10.CreateEventRequestLocation({ displayName: params.location });
        }

        const headers = new calendar10.CreateEventHeaders({});
        headers.xAcsDingtalkAccessToken = accessToken;
        const response = await client.createEventWithOptions(params.userId, calendarId, request, headers, new $Util.RuntimeOptions({}));
        return { ok: true, data: response.body };
    } catch (err) {
        return { ok: false, error: String(err) };
    }
}

/**
 * 获取日程详情
 */
async function getEvent(
    accessToken: string,
    params: {
        userId: string;
        calendarId?: string;
        eventId: string;
    },
): Promise<DingtalkCalendarResult> {
    try {
        const client = createCalendarClient();
        const calendarId = params.calendarId || "primary";
        const request = new calendar10.GetEventRequest({});
        const headers = new calendar10.GetEventHeaders({});
        headers.xAcsDingtalkAccessToken = accessToken;
        const response = await client.getEventWithOptions(params.userId, calendarId, params.eventId, request, headers, new $Util.RuntimeOptions({}));
        return { ok: true, data: response.body };
    } catch (err) {
        return { ok: false, error: String(err) };
    }
}

/**
 * 删除日程
 */
async function deleteEvent(
    accessToken: string,
    params: {
        userId: string;
        calendarId?: string;
        eventId: string;
    },
): Promise<DingtalkCalendarResult> {
    try {
        const client = createCalendarClient();
        const calendarId = params.calendarId || "primary";
        const request = new calendar10.DeleteEventRequest({});
        const headers = new calendar10.DeleteEventHeaders({});
        headers.xAcsDingtalkAccessToken = accessToken;
        const response = await client.deleteEventWithOptions(params.userId, calendarId, params.eventId, request, headers, new $Util.RuntimeOptions({}));
        return { ok: true, data: response.body };
    } catch (err) {
        return { ok: false, error: String(err) };
    }
}

// ============================================================================
// 工具注册
// ============================================================================

const DingtalkCalendarToolSchema = z.object({
    action: z.enum(["list_calendars", "list_events", "create_event", "get_event", "delete_event"]),
    // 通用参数
    userId: z.string(),
    calendarId: z.string().optional(),
    eventId: z.string().optional(),
    // list_events 参数
    timeMin: z.string().optional(),
    timeMax: z.string().optional(),
    maxResults: z.number().optional(),
    nextToken: z.string().optional(),
    // create_event 参数
    summary: z.string().optional(),
    description: z.string().optional(),
    startDateTime: z.string().optional(),
    startDate: z.string().optional(),
    endDateTime: z.string().optional(),
    endDate: z.string().optional(),
    timeZone: z.string().optional(),
    isAllDay: z.boolean().optional(),
    location: z.string().optional(),
    attendeeIds: z.array(z.string()).optional(),
});

type DingtalkCalendarToolParams = z.infer<typeof DingtalkCalendarToolSchema>;

export function registerDingtalkCalendarTools(api: OpenClawPluginApi) {
    const logger = getDingtalkRuntime().logging.getChildLogger({ subsystem: "dingtalk/calendar" });

    api.registerTool({
        name: "dingtalk_calendar",
        description: `钉钉日历工具 (使用 calendar_1_0 SDK)。支持以下操作：
- list_calendars: 查询用户日历列表 (需要 userId)
- list_events: 查询日程列表 (需要 userId; 可选 calendarId, timeMin, timeMax)
- create_event: 创建日程 (需要 userId, summary, startDateTime/startDate, endDateTime/endDate)
- get_event: 获取日程详情 (需要 userId, eventId)
- delete_event: 删除日程 (需要 userId, eventId)`,
        parameters: DingtalkCalendarToolSchema,
        execute: async (params: DingtalkCalendarToolParams, ctx: { cfg: OpenClawConfig; accountId?: string | null }) => {
            const cfg = ctx.cfg as OpenClawConfig;
            const accountId = ctx.accountId;

            // 解析账户配置
            const account = resolveDingtalkAccount({ cfg, accountId });
            if (!account.clientId || !account.clientSecret) {
                return {
                    content: [{ type: "text", text: "Error: DingTalk credentials not configured" }],
                };
            }

            // 获取 AccessToken
            let accessToken: string;
            try {
                accessToken = await getDingtalkAccessToken(account.clientId, account.clientSecret, accountId ?? undefined);
            } catch (err) {
                return {
                    content: [{ type: "text", text: `Error getting access token: ${String(err)}` }],
                };
            }

            let result: DingtalkCalendarResult;

            switch (params.action) {
                case "list_calendars":
                    result = await listCalendars(accessToken, {
                        userId: params.userId,
                    });
                    break;

                case "list_events":
                    result = await listEvents(accessToken, {
                        userId: params.userId,
                        calendarId: params.calendarId,
                        timeMin: params.timeMin,
                        timeMax: params.timeMax,
                        maxResults: params.maxResults,
                        nextToken: params.nextToken,
                    });
                    break;

                case "create_event":
                    if (!params.summary) {
                        return {
                            content: [{ type: "text", text: "Error: summary is required for create_event action" }],
                        };
                    }
                    if (!params.startDateTime && !params.startDate) {
                        return {
                            content: [{ type: "text", text: "Error: startDateTime or startDate is required for create_event action" }],
                        };
                    }
                    if (!params.endDateTime && !params.endDate) {
                        return {
                            content: [{ type: "text", text: "Error: endDateTime or endDate is required for create_event action" }],
                        };
                    }
                    result = await createEvent(accessToken, {
                        userId: params.userId,
                        calendarId: params.calendarId,
                        summary: params.summary,
                        description: params.description,
                        startDateTime: params.startDateTime,
                        startDate: params.startDate,
                        endDateTime: params.endDateTime,
                        endDate: params.endDate,
                        timeZone: params.timeZone,
                        isAllDay: params.isAllDay,
                        location: params.location,
                        attendeeIds: params.attendeeIds,
                    });
                    break;

                case "get_event":
                    if (!params.eventId) {
                        return {
                            content: [{ type: "text", text: "Error: eventId is required for get_event action" }],
                        };
                    }
                    result = await getEvent(accessToken, {
                        userId: params.userId,
                        calendarId: params.calendarId,
                        eventId: params.eventId,
                    });
                    break;

                case "delete_event":
                    if (!params.eventId) {
                        return {
                            content: [{ type: "text", text: "Error: eventId is required for delete_event action" }],
                        };
                    }
                    result = await deleteEvent(accessToken, {
                        userId: params.userId,
                        calendarId: params.calendarId,
                        eventId: params.eventId,
                    });
                    break;

                default:
                    return {
                        content: [{ type: "text", text: `Error: Unknown action: ${params.action}` }],
                    };
            }

            logger.debug(`dingtalk_calendar ${params.action}: ${JSON.stringify(result)}`);

            return {
                content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
            };
        },
    });

    logger.info("Registered dingtalk_calendar tool (using @alicloud/dingtalk SDK)");
}

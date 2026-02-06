import type { OpenClawPluginApi, OpenClawConfig } from "openclaw/plugin-sdk";
import { z } from "zod";
import * as $OpenApi from "@alicloud/openapi-client";
import * as $Util from "@alicloud/tea-util";
import dingtalk = require("@alicloud/dingtalk");
import { resolveDingtalkAccount } from "./config.js";
import { getDingtalkRuntime } from "./runtime.js";
import { getDingtalkAccessToken } from "./send.js";

// 从 SDK 提取模块
const todo10 = dingtalk.todo_1_0;

// ============================================================================
// 类型定义
// ============================================================================

export type DingtalkTodoAction = "create" | "list" | "get" | "update" | "delete";

export type DingtalkTodoResult = {
    ok: boolean;
    data?: unknown;
    error?: string;
};

// ============================================================================
// SDK Client 工厂
// ============================================================================

function createTodoClient(): InstanceType<typeof todo10.default> {
    const config = new $OpenApi.Config({});
    config.protocol = "https";
    config.regionId = "central";
    const client = new todo10.default(config);
    return client;
}

// ============================================================================
// 待办操作实现
// ============================================================================

/**
 * 创建待办任务
 */
async function createTodo(
    accessToken: string,
    params: {
        unionId: string;
        subject: string;
        description?: string;
        dueTime?: number;
        executorIds?: string[];
        participantIds?: string[];
        priority?: number;
    },
): Promise<DingtalkTodoResult> {
    try {
        const client = createTodoClient();
        const request = new todo10.CreateTodoTaskRequest({
            subject: params.subject,
            description: params.description,
            dueTime: params.dueTime,
            executorIds: params.executorIds,
            participantIds: params.participantIds,
            priority: params.priority,
        });
        const headers = new todo10.CreateTodoTaskHeaders({});
        headers.xAcsDingtalkAccessToken = accessToken;
        const response = await client.createTodoTaskWithOptions(params.unionId, request, headers, new $Util.RuntimeOptions({}));
        return { ok: true, data: response.body };
    } catch (err) {
        return { ok: false, error: String(err) };
    }
}

/**
 * 查询待办任务列表
 */
async function listTodos(
    accessToken: string,
    params: {
        unionId: string;
        isDone?: boolean;
        nextToken?: string;
    },
): Promise<DingtalkTodoResult> {
    try {
        const client = createTodoClient();
        const request = new todo10.QueryTodoTasksRequest({
            isDone: params.isDone,
            nextToken: params.nextToken,
        });
        const headers = new todo10.QueryTodoTasksHeaders({});
        headers.xAcsDingtalkAccessToken = accessToken;
        const response = await client.queryTodoTasksWithOptions(params.unionId, request, headers, new $Util.RuntimeOptions({}));
        return { ok: true, data: response.body };
    } catch (err) {
        return { ok: false, error: String(err) };
    }
}

/**
 * 获取待办任务详情
 */
async function getTodo(
    accessToken: string,
    params: {
        unionId: string;
        taskId: string;
    },
): Promise<DingtalkTodoResult> {
    try {
        const client = createTodoClient();
        const headers = new todo10.GetTodoTaskHeaders({});
        headers.xAcsDingtalkAccessToken = accessToken;
        const response = await client.getTodoTaskWithOptions(params.unionId, params.taskId, headers, new $Util.RuntimeOptions({}));
        return { ok: true, data: response.body };
    } catch (err) {
        return { ok: false, error: String(err) };
    }
}

/**
 * 更新待办任务状态
 */
async function updateTodo(
    accessToken: string,
    params: {
        unionId: string;
        taskId: string;
        done?: boolean;
        subject?: string;
        description?: string;
        dueTime?: number;
        executorIds?: string[];
    },
): Promise<DingtalkTodoResult> {
    try {
        const client = createTodoClient();
        const request = new todo10.UpdateTodoTaskRequest({
            done: params.done,
            subject: params.subject,
            description: params.description,
            dueTime: params.dueTime,
            executorIds: params.executorIds,
        });
        const headers = new todo10.UpdateTodoTaskHeaders({});
        headers.xAcsDingtalkAccessToken = accessToken;
        const response = await client.updateTodoTaskWithOptions(params.unionId, params.taskId, request, headers, new $Util.RuntimeOptions({}));
        return { ok: true, data: response.body };
    } catch (err) {
        return { ok: false, error: String(err) };
    }
}

/**
 * 删除待办任务
 */
async function deleteTodo(
    accessToken: string,
    params: {
        unionId: string;
        taskId: string;
    },
): Promise<DingtalkTodoResult> {
    try {
        const client = createTodoClient();
        const request = new todo10.DeleteTodoTaskRequest({});
        const headers = new todo10.DeleteTodoTaskHeaders({});
        headers.xAcsDingtalkAccessToken = accessToken;
        const response = await client.deleteTodoTaskWithOptions(params.unionId, params.taskId, request, headers, new $Util.RuntimeOptions({}));
        return { ok: true, data: response.body };
    } catch (err) {
        return { ok: false, error: String(err) };
    }
}

// ============================================================================
// 工具注册
// ============================================================================

const DingtalkTodoToolSchema = z.object({
    action: z.enum(["create", "list", "get", "update", "delete"]),
    // 通用参数
    unionId: z.string(),
    taskId: z.string().optional(),
    // create/update 参数
    subject: z.string().optional(),
    description: z.string().optional(),
    dueTime: z.number().optional(),
    executorIds: z.array(z.string()).optional(),
    participantIds: z.array(z.string()).optional(),
    priority: z.number().optional(),
    // update 参数
    done: z.boolean().optional(),
    // list 参数
    isDone: z.boolean().optional(),
    nextToken: z.string().optional(),
});

type DingtalkTodoToolParams = z.infer<typeof DingtalkTodoToolSchema>;

export function registerDingtalkTodoTools(api: OpenClawPluginApi) {
    const logger = getDingtalkRuntime().logging.getChildLogger({ subsystem: "dingtalk/todo" });

    api.registerTool({
        name: "dingtalk_todo",
        description: `钉钉待办任务工具 (使用 todo_1_0 SDK)。支持以下操作：
- create: 创建待办任务 (需要 unionId, subject)
- list: 查询待办列表 (需要 unionId; 可选 isDone)
- get: 获取待办详情 (需要 unionId, taskId)
- update: 更新待办 (需要 unionId, taskId; 可选 done, subject 等)
- delete: 删除待办 (需要 unionId, taskId)`,
        parameters: DingtalkTodoToolSchema,
        execute: async (params: DingtalkTodoToolParams, ctx: { cfg: OpenClawConfig; accountId?: string | null }) => {
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

            let result: DingtalkTodoResult;

            switch (params.action) {
                case "create":
                    if (!params.subject) {
                        return {
                            content: [{ type: "text", text: "Error: subject is required for create action" }],
                        };
                    }
                    result = await createTodo(accessToken, {
                        unionId: params.unionId,
                        subject: params.subject,
                        description: params.description,
                        dueTime: params.dueTime,
                        executorIds: params.executorIds,
                        participantIds: params.participantIds,
                        priority: params.priority,
                    });
                    break;

                case "list":
                    result = await listTodos(accessToken, {
                        unionId: params.unionId,
                        isDone: params.isDone,
                        nextToken: params.nextToken,
                    });
                    break;

                case "get":
                    if (!params.taskId) {
                        return {
                            content: [{ type: "text", text: "Error: taskId is required for get action" }],
                        };
                    }
                    result = await getTodo(accessToken, {
                        unionId: params.unionId,
                        taskId: params.taskId,
                    });
                    break;

                case "update":
                    if (!params.taskId) {
                        return {
                            content: [{ type: "text", text: "Error: taskId is required for update action" }],
                        };
                    }
                    result = await updateTodo(accessToken, {
                        unionId: params.unionId,
                        taskId: params.taskId,
                        done: params.done,
                        subject: params.subject,
                        description: params.description,
                        dueTime: params.dueTime,
                        executorIds: params.executorIds,
                    });
                    break;

                case "delete":
                    if (!params.taskId) {
                        return {
                            content: [{ type: "text", text: "Error: taskId is required for delete action" }],
                        };
                    }
                    result = await deleteTodo(accessToken, {
                        unionId: params.unionId,
                        taskId: params.taskId,
                    });
                    break;

                default:
                    return {
                        content: [{ type: "text", text: `Error: Unknown action: ${params.action}` }],
                    };
            }

            logger.debug(`dingtalk_todo ${params.action}: ${JSON.stringify(result)}`);

            return {
                content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
            };
        },
    });

    logger.info("Registered dingtalk_todo tool (using @alicloud/dingtalk SDK)");
}

import type { OpenClawPluginApi, OpenClawConfig } from "openclaw/plugin-sdk";
import { z } from "zod";
import * as $OpenApi from "@alicloud/openapi-client";
import * as $Util from "@alicloud/tea-util";
import dingtalk = require("@alicloud/dingtalk");
import { resolveDingtalkAccount } from "./config.js";
import { getDingtalkRuntime } from "./runtime.js";
import { getDingtalkAccessToken } from "./send.js";

// 从 SDK 提取模块
const doc20 = dingtalk.doc_2_0;

// ============================================================================
// 类型定义
// ============================================================================

export type DingtalkDocAction =
    | "create"
    | "list"
    | "info"
    | "write"
    | "copy"
    | "get_task";

export type DingtalkDocResult = {
    ok: boolean;
    data?: unknown;
    error?: string;
};

// ============================================================================
// SDK Client 工厂
// ============================================================================

function createDocClient(): InstanceType<typeof doc20.default> {
    const config = new $OpenApi.Config({});
    config.protocol = "https";
    config.regionId = "central";
    const client = new doc20.default(config);
    return client;
}

// ============================================================================
// 文档操作实现
// ============================================================================

/**
 * 创建文档/文件夹
 */
async function createDoc(
    accessToken: string,
    params: {
        spaceId: string;
        parentDentryId?: string;
        name: string;
        dentryType: string; // "file" | "folder"
        operatorId?: string;
    },
): Promise<DingtalkDocResult> {
    try {
        const client = createDocClient();
        const request = new doc20.CreateDentryRequest({
            parentDentryId: params.parentDentryId,
            name: params.name,
            dentryType: params.dentryType,
            operatorId: params.operatorId,
        });
        const headers = new doc20.CreateDentryHeaders({});
        headers.xAcsDingtalkAccessToken = accessToken;
        const response = await client.createDentryWithOptions(params.spaceId, request, headers, new $Util.RuntimeOptions({}));
        return { ok: true, data: response.body };
    } catch (err) {
        return { ok: false, error: String(err) };
    }
}

/**
 * 获取文件/文件夹列表 (使用 getDirectories)
 */
async function listDocs(
    accessToken: string,
    params: {
        spaceId: string;
        parentDentryId?: string;
        maxResults?: number;
        nextToken?: string;
        operatorId?: string;
    },
): Promise<DingtalkDocResult> {
    try {
        const client = createDocClient();
        const request = new doc20.GetSpaceDirectoriesRequest({
            dentryId: params.parentDentryId,
            maxResults: params.maxResults || 20,
            nextToken: params.nextToken,
            operatorId: params.operatorId,
        });
        const headers = new doc20.GetSpaceDirectoriesHeaders({});
        headers.xAcsDingtalkAccessToken = accessToken;
        const response = await client.getSpaceDirectoriesWithOptions(params.spaceId, request, headers, new $Util.RuntimeOptions({}));
        return { ok: true, data: response.body };
    } catch (err) {
        return { ok: false, error: String(err) };
    }
}

/**
 * 获取文档信息 (使用 queryDentry)
 */
async function getDocInfo(
    accessToken: string,
    params: {
        spaceId: string;
        dentryId: string;
        operatorId?: string;
    },
): Promise<DingtalkDocResult> {
    try {
        const client = createDocClient();
        const request = new doc20.QueryDentryRequest({
            operatorId: params.operatorId,
        });
        const headers = new doc20.QueryDentryHeaders({});
        headers.xAcsDingtalkAccessToken = accessToken;
        const response = await client.queryDentryWithOptions(params.spaceId, params.dentryId, request, headers, new $Util.RuntimeOptions({}));
        return { ok: true, data: response.body };
    } catch (err) {
        return { ok: false, error: String(err) };
    }
}

/**
 * 覆写文档内容 (Markdown) - 使用 HTTP 直接调用，SDK 可能未包含此方法
 */
async function writeDoc(
    accessToken: string,
    params: {
        docKey: string;
        content: string;
    },
): Promise<DingtalkDocResult> {
    try {
        // 由于 SDK 可能没有 overwriteDocContent 方法，使用直接 HTTP 调用
        const response = await fetch(
            `https://api.dingtalk.com/v2.0/doc/me/suites/documents/${params.docKey}/overwriteContent`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-acs-dingtalk-access-token": accessToken,
                },
                body: JSON.stringify({
                    dataType: "markdown",
                    content: params.content,
                }),
            }
        );
        const data = await response.json();
        if (!response.ok) {
            return { ok: false, error: JSON.stringify(data) };
        }
        return { ok: true, data };
    } catch (err) {
        return { ok: false, error: String(err) };
    }
}

/**
 * 复制文档
 */
async function copyDoc(
    accessToken: string,
    params: {
        spaceId: string;
        dentryId: string;
        name?: string;
        targetSpaceId?: string;
        targetParentDentryId?: string;
        operatorId?: string;
    },
): Promise<DingtalkDocResult> {
    try {
        const client = createDocClient();
        const request = new doc20.CopyDentryRequest({
            name: params.name,
            targetSpaceId: params.targetSpaceId,
            targetParentDentryId: params.targetParentDentryId,
            operatorId: params.operatorId,
        });
        const headers = new doc20.CopyDentryHeaders({});
        headers.xAcsDingtalkAccessToken = accessToken;
        const response = await client.copyDentryWithOptions(params.spaceId, params.dentryId, request, headers, new $Util.RuntimeOptions({}));
        return { ok: true, data: response.body };
    } catch (err) {
        return { ok: false, error: String(err) };
    }
}

/**
 * 获取异步任务状态 (使用 getTaskInfo)
 */
async function getTaskInfo(
    accessToken: string,
    params: {
        taskId: string;
    },
): Promise<DingtalkDocResult> {
    try {
        const client = createDocClient();
        const headers = new doc20.GetTaskInfoHeaders({});
        headers.xAcsDingtalkAccessToken = accessToken;
        const response = await client.getTaskInfoWithOptions(params.taskId, headers, new $Util.RuntimeOptions({}));
        return { ok: true, data: response.body };
    } catch (err) {
        return { ok: false, error: String(err) };
    }
}

// ============================================================================
// 工具注册
// ============================================================================

const DingtalkDocToolSchema = z.object({
    action: z.enum(["create", "list", "info", "write", "copy", "get_task"]),
    // create 参数
    spaceId: z.string().optional(),
    parentDentryId: z.string().optional(),
    name: z.string().optional(),
    dentryType: z.enum(["file", "folder"]).optional(),
    // list 参数
    maxResults: z.number().optional(),
    nextToken: z.string().optional(),
    // info/copy 参数
    dentryId: z.string().optional(),
    // write 参数
    docKey: z.string().optional(),
    content: z.string().optional(),
    // copy 参数
    targetSpaceId: z.string().optional(),
    targetParentDentryId: z.string().optional(),
    operatorId: z.string().optional(),
    // get_task 参数
    taskId: z.string().optional(),
});

type DingtalkDocToolParams = z.infer<typeof DingtalkDocToolSchema>;

export function registerDingtalkDocTools(api: OpenClawPluginApi) {
    const logger = getDingtalkRuntime().logging.getChildLogger({ subsystem: "dingtalk/doc" });

    api.registerTool({
        name: "dingtalk_doc",
        description: `钉钉文档操作工具 (使用 doc_2_0 SDK)。支持以下操作：
- create: 创建文档/文件夹 (需要 spaceId, name, dentryType)
- list: 获取文件列表 (需要 spaceId; 可选 parentDentryId)
- info: 获取文档信息 (需要 spaceId, dentryId)
- write: 覆写文档内容 (需要 docKey, content)
- copy: 复制文档 (需要 spaceId, dentryId)
- get_task: 获取异步任务状态 (需要 taskId)`,
        parameters: DingtalkDocToolSchema,
        execute: async (params: DingtalkDocToolParams, ctx: { cfg: OpenClawConfig; accountId?: string | null }) => {
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

            let result: DingtalkDocResult;

            switch (params.action) {
                case "create":
                    if (!params.spaceId || !params.name || !params.dentryType) {
                        return {
                            content: [{ type: "text", text: "Error: spaceId, name, and dentryType are required for create action" }],
                        };
                    }
                    result = await createDoc(accessToken, {
                        spaceId: params.spaceId,
                        parentDentryId: params.parentDentryId,
                        name: params.name,
                        dentryType: params.dentryType,
                        operatorId: params.operatorId,
                    });
                    break;

                case "list":
                    if (!params.spaceId) {
                        return {
                            content: [{ type: "text", text: "Error: spaceId is required for list action" }],
                        };
                    }
                    result = await listDocs(accessToken, {
                        spaceId: params.spaceId,
                        parentDentryId: params.parentDentryId,
                        maxResults: params.maxResults,
                        nextToken: params.nextToken,
                        operatorId: params.operatorId,
                    });
                    break;

                case "info":
                    if (!params.spaceId || !params.dentryId) {
                        return {
                            content: [{ type: "text", text: "Error: spaceId and dentryId are required for info action" }],
                        };
                    }
                    result = await getDocInfo(accessToken, {
                        spaceId: params.spaceId,
                        dentryId: params.dentryId,
                        operatorId: params.operatorId,
                    });
                    break;

                case "write":
                    if (!params.docKey || !params.content) {
                        return {
                            content: [{ type: "text", text: "Error: docKey and content are required for write action" }],
                        };
                    }
                    result = await writeDoc(accessToken, {
                        docKey: params.docKey,
                        content: params.content,
                    });
                    break;

                case "copy":
                    if (!params.spaceId || !params.dentryId) {
                        return {
                            content: [{ type: "text", text: "Error: spaceId and dentryId are required for copy action" }],
                        };
                    }
                    result = await copyDoc(accessToken, {
                        spaceId: params.spaceId,
                        dentryId: params.dentryId,
                        name: params.name,
                        targetSpaceId: params.targetSpaceId,
                        targetParentDentryId: params.targetParentDentryId,
                        operatorId: params.operatorId,
                    });
                    break;

                case "get_task":
                    if (!params.taskId) {
                        return {
                            content: [{ type: "text", text: "Error: taskId is required for get_task action" }],
                        };
                    }
                    result = await getTaskInfo(accessToken, {
                        taskId: params.taskId,
                    });
                    break;

                default:
                    return {
                        content: [{ type: "text", text: `Error: Unknown action: ${params.action}` }],
                    };
            }

            logger.debug(`dingtalk_doc ${params.action}: ${JSON.stringify(result)}`);

            return {
                content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
            };
        },
    });

    logger.info("Registered dingtalk_doc tool (using @alicloud/dingtalk SDK)");
}

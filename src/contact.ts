import type { OpenClawPluginApi, OpenClawConfig } from "openclaw/plugin-sdk";
import { z } from "zod";
import * as $OpenApi from "@alicloud/openapi-client";
import * as $Util from "@alicloud/tea-util";
import dingtalk = require("@alicloud/dingtalk");
import { resolveDingtalkAccount } from "./config.js";
import { getDingtalkRuntime } from "./runtime.js";
import { getDingtalkAccessToken } from "./send.js";

// 从 SDK 提取模块
const contact10 = dingtalk.contact_1_0;

// ============================================================================
// 类型定义
// ============================================================================

export type DingtalkContactAction = "search_user" | "search_department" | "get_user";

export type DingtalkContactResult = {
    ok: boolean;
    data?: unknown;
    error?: string;
};

// ============================================================================
// SDK Client 工厂
// ============================================================================

function createContactClient(): InstanceType<typeof contact10.default> {
    const config = new $OpenApi.Config({});
    config.protocol = "https";
    config.regionId = "central";
    const client = new contact10.default(config);
    return client;
}

// ============================================================================
// 通讯录操作实现
// ============================================================================

/**
 * 搜索用户 - 按姓名搜索，返回 userId 列表
 */
async function searchUser(
    accessToken: string,
    params: {
        queryWord: string;
        offset?: number;
        size?: number;
        fullMatchField?: number;
    },
): Promise<DingtalkContactResult> {
    try {
        const client = createContactClient();
        const request = new contact10.SearchUserRequest({
            queryWord: params.queryWord,
            offset: params.offset || 0,
            size: params.size || 10,
            fullMatchField: params.fullMatchField,
        });
        const headers = new contact10.SearchUserHeaders({});
        headers.xAcsDingtalkAccessToken = accessToken;
        const response = await client.searchUserWithOptions(request, headers, new $Util.RuntimeOptions({}));
        return { ok: true, data: response.body };
    } catch (err) {
        return { ok: false, error: String(err) };
    }
}

/**
 * 搜索部门 - 按名称搜索，返回部门 ID 列表
 */
async function searchDepartment(
    accessToken: string,
    params: {
        queryWord: string;
        offset?: number;
        size?: number;
    },
): Promise<DingtalkContactResult> {
    try {
        const client = createContactClient();
        const request = new contact10.SearchDepartmentRequest({
            queryWord: params.queryWord,
            offset: params.offset || 0,
            size: params.size || 10,
        });
        const headers = new contact10.SearchDepartmentHeaders({});
        headers.xAcsDingtalkAccessToken = accessToken;
        const response = await client.searchDepartmentWithOptions(request, headers, new $Util.RuntimeOptions({}));
        return { ok: true, data: response.body };
    } catch (err) {
        return { ok: false, error: String(err) };
    }
}

/**
 * 获取用户详情 - 根据 unionId 获取用户信息
 */
async function getUser(
    accessToken: string,
    params: {
        unionId: string;
    },
): Promise<DingtalkContactResult> {
    try {
        const client = createContactClient();
        const headers = new contact10.GetUserHeaders({});
        headers.xAcsDingtalkAccessToken = accessToken;
        const response = await client.getUserWithOptions(params.unionId, headers, new $Util.RuntimeOptions({}));
        return { ok: true, data: response.body };
    } catch (err) {
        return { ok: false, error: String(err) };
    }
}

// ============================================================================
// 工具注册
// ============================================================================

const DingtalkContactToolSchema = z.object({
    action: z.enum(["search_user", "search_department", "get_user"]),
    // search_user / search_department 参数
    queryWord: z.string().optional(),
    offset: z.number().optional(),
    size: z.number().optional(),
    fullMatchField: z.number().optional(),
    // get_user 参数
    unionId: z.string().optional(),
});

type DingtalkContactToolParams = z.infer<typeof DingtalkContactToolSchema>;

export function registerDingtalkContactTools(api: OpenClawPluginApi) {
    const logger = getDingtalkRuntime().logging.getChildLogger({ subsystem: "dingtalk/contact" });

    api.registerTool({
        name: "dingtalk_contact",
        description: `钉钉通讯录工具 (使用 contact_1_0 SDK)。用于将姓名转换为 userId，支持以下操作：
- search_user: 按姓名搜索用户 (需要 queryWord; 返回 userId 列表)
- search_department: 按名称搜索部门 (需要 queryWord; 返回 deptId 列表)
- get_user: 获取用户详情 (需要 unionId; 返回姓名、手机、邮箱等)

典型用法：先用 search_user 搜索姓名获取 userId，再将 userId 传给 calendar/todo 等工具。`,
        parameters: DingtalkContactToolSchema,
        execute: async (params: DingtalkContactToolParams, ctx: { cfg: OpenClawConfig; accountId?: string | null }) => {
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

            let result: DingtalkContactResult;

            switch (params.action) {
                case "search_user":
                    if (!params.queryWord) {
                        return {
                            content: [{ type: "text", text: "Error: queryWord is required for search_user action" }],
                        };
                    }
                    result = await searchUser(accessToken, {
                        queryWord: params.queryWord,
                        offset: params.offset,
                        size: params.size,
                        fullMatchField: params.fullMatchField,
                    });
                    break;

                case "search_department":
                    if (!params.queryWord) {
                        return {
                            content: [{ type: "text", text: "Error: queryWord is required for search_department action" }],
                        };
                    }
                    result = await searchDepartment(accessToken, {
                        queryWord: params.queryWord,
                        offset: params.offset,
                        size: params.size,
                    });
                    break;

                case "get_user":
                    if (!params.unionId) {
                        return {
                            content: [{ type: "text", text: "Error: unionId is required for get_user action" }],
                        };
                    }
                    result = await getUser(accessToken, {
                        unionId: params.unionId,
                    });
                    break;

                default:
                    return {
                        content: [{ type: "text", text: `Error: Unknown action: ${params.action}` }],
                    };
            }

            logger.debug(`dingtalk_contact ${params.action}: ${JSON.stringify(result)}`);

            return {
                content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
            };
        },
    });

    logger.info("Registered dingtalk_contact tool (using @alicloud/dingtalk SDK)");
}

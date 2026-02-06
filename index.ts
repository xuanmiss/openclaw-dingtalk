import type { OpenClawPluginApi } from "openclaw/plugin-sdk";
import { emptyPluginConfigSchema } from "openclaw/plugin-sdk";
import { dingtalkPlugin } from "./src/channel.js";
import { setDingtalkRuntime } from "./src/runtime.js";
import { registerDingtalkDocTools } from "./src/doc.js";
import { registerDingtalkTodoTools } from "./src/todo.js";
import { registerDingtalkCalendarTools } from "./src/calendar.js";
import { registerDingtalkContactTools } from "./src/contact.js";

const plugin = {
    id: "dingtalk",
    name: "DingTalk",
    description: "DingTalk (钉钉) channel plugin - Stream mode",
    configSchema: emptyPluginConfigSchema(),
    register(api: OpenClawPluginApi) {
        setDingtalkRuntime(api.runtime);
        api.registerChannel({ plugin: dingtalkPlugin });
        registerDingtalkDocTools(api);
        registerDingtalkTodoTools(api);
        registerDingtalkCalendarTools(api);
        registerDingtalkContactTools(api);
    },
};

export default plugin;

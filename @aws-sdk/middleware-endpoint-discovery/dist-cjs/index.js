"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  NODE_ENDPOINT_DISCOVERY_CONFIG_OPTIONS: () => NODE_ENDPOINT_DISCOVERY_CONFIG_OPTIONS,
  endpointDiscoveryMiddlewareOptions: () => endpointDiscoveryMiddlewareOptions,
  getEndpointDiscoveryOptionalPlugin: () => getEndpointDiscoveryOptionalPlugin,
  getEndpointDiscoveryPlugin: () => getEndpointDiscoveryPlugin,
  getEndpointDiscoveryRequiredPlugin: () => getEndpointDiscoveryRequiredPlugin,
  resolveEndpointDiscoveryConfig: () => resolveEndpointDiscoveryConfig
});
module.exports = __toCommonJS(index_exports);

// src/configurations.ts
var ENV_ENDPOINT_DISCOVERY = ["AWS_ENABLE_ENDPOINT_DISCOVERY", "AWS_ENDPOINT_DISCOVERY_ENABLED"];
var CONFIG_ENDPOINT_DISCOVERY = "endpoint_discovery_enabled";
var isFalsy = /* @__PURE__ */ __name((value) => ["false", "0"].indexOf(value) >= 0, "isFalsy");
var NODE_ENDPOINT_DISCOVERY_CONFIG_OPTIONS = {
  environmentVariableSelector: /* @__PURE__ */ __name((env) => {
    for (let i = 0; i < ENV_ENDPOINT_DISCOVERY.length; i++) {
      const envKey = ENV_ENDPOINT_DISCOVERY[i];
      if (envKey in env) {
        const value = env[envKey];
        if (value === "") {
          throw Error(`Environment variable ${envKey} can't be empty of undefined, got "${value}"`);
        }
        return !isFalsy(value);
      }
    }
  }, "environmentVariableSelector"),
  configFileSelector: /* @__PURE__ */ __name((profile) => {
    if (CONFIG_ENDPOINT_DISCOVERY in profile) {
      const value = profile[CONFIG_ENDPOINT_DISCOVERY];
      if (value === void 0) {
        throw Error(`Shared config entry ${CONFIG_ENDPOINT_DISCOVERY} can't be undefined, got "${value}"`);
      }
      return !isFalsy(value);
    }
  }, "configFileSelector"),
  default: void 0
};

// src/endpointDiscoveryMiddleware.ts
var import_protocol_http = require("@smithy/protocol-http");

// src/getCacheKey.ts
var getCacheKey = /* @__PURE__ */ __name(async (commandName, config, options) => {
  const { accessKeyId } = await config.credentials();
  const { identifiers } = options;
  return JSON.stringify({
    ...accessKeyId && { accessKeyId },
    ...identifiers && {
      commandName,
      identifiers: Object.entries(identifiers).sort().reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {})
    }
  });
}, "getCacheKey");

// src/updateDiscoveredEndpointInCache.ts
var requestQueue = {};
var updateDiscoveredEndpointInCache = /* @__PURE__ */ __name(async (config, options) => new Promise((resolve, reject) => {
  const { endpointCache } = config;
  const { cacheKey, commandName, identifiers } = options;
  const endpoints = endpointCache.get(cacheKey);
  if (endpoints && endpoints.length === 1 && endpoints[0].Address === "") {
    if (options.isDiscoveredEndpointRequired) {
      if (!requestQueue[cacheKey]) requestQueue[cacheKey] = [];
      requestQueue[cacheKey].push({ resolve, reject });
    } else {
      resolve();
    }
  } else if (endpoints && endpoints.length > 0) {
    resolve();
  } else {
    const placeholderEndpoints = [{ Address: "", CachePeriodInMinutes: 1 }];
    endpointCache.set(cacheKey, placeholderEndpoints);
    const command = new options.endpointDiscoveryCommandCtor({
      Operation: commandName.slice(0, -7),
      // strip "Command"
      Identifiers: identifiers
    });
    const handler = command.resolveMiddleware(options.clientStack, config, options.options);
    handler(command).then((result) => {
      endpointCache.set(cacheKey, result.output.Endpoints);
      if (requestQueue[cacheKey]) {
        requestQueue[cacheKey].forEach(({ resolve: resolve2 }) => {
          resolve2();
        });
        delete requestQueue[cacheKey];
      }
      resolve();
    }).catch((error) => {
      endpointCache.delete(cacheKey);
      const errorToThrow = Object.assign(
        new Error(
          `The operation to discover endpoint failed. Please retry, or provide a custom endpoint and disable endpoint discovery to proceed.`
        ),
        { reason: error }
      );
      if (requestQueue[cacheKey]) {
        requestQueue[cacheKey].forEach(({ reject: reject2 }) => {
          reject2(errorToThrow);
        });
        delete requestQueue[cacheKey];
      }
      if (options.isDiscoveredEndpointRequired) {
        reject(errorToThrow);
      } else {
        endpointCache.set(cacheKey, placeholderEndpoints);
        resolve();
      }
    });
  }
}), "updateDiscoveredEndpointInCache");

// src/endpointDiscoveryMiddleware.ts
var endpointDiscoveryMiddleware = /* @__PURE__ */ __name((config, middlewareConfig) => (next, context) => async (args) => {
  if (config.isCustomEndpoint) {
    if (config.isClientEndpointDiscoveryEnabled) {
      throw new Error(`Custom endpoint is supplied; endpointDiscoveryEnabled must not be true.`);
    }
    return next(args);
  }
  const { endpointDiscoveryCommandCtor } = config;
  const { isDiscoveredEndpointRequired, identifiers } = middlewareConfig;
  const clientName = context.clientName;
  const commandName = context.commandName;
  const isEndpointDiscoveryEnabled = await config.endpointDiscoveryEnabled();
  const cacheKey = await getCacheKey(commandName, config, { identifiers });
  if (isDiscoveredEndpointRequired) {
    if (isEndpointDiscoveryEnabled === false) {
      throw new Error(
        `Endpoint Discovery is disabled but ${commandName} on ${clientName} requires it. Please check your configurations.`
      );
    }
    await updateDiscoveredEndpointInCache(config, {
      ...middlewareConfig,
      commandName,
      cacheKey,
      endpointDiscoveryCommandCtor
    });
  } else if (isEndpointDiscoveryEnabled) {
    updateDiscoveredEndpointInCache(config, {
      ...middlewareConfig,
      commandName,
      cacheKey,
      endpointDiscoveryCommandCtor
    });
  }
  const { request } = args;
  if (cacheKey && import_protocol_http.HttpRequest.isInstance(request)) {
    const endpoint = config.endpointCache.getEndpoint(cacheKey);
    if (endpoint) {
      request.hostname = endpoint;
    }
  }
  return next(args);
}, "endpointDiscoveryMiddleware");

// src/getEndpointDiscoveryPlugin.ts
var endpointDiscoveryMiddlewareOptions = {
  name: "endpointDiscoveryMiddleware",
  step: "build",
  tags: ["ENDPOINT_DISCOVERY"],
  override: true
};
var getEndpointDiscoveryPlugin = /* @__PURE__ */ __name((pluginConfig, middlewareConfig) => ({
  applyToStack: /* @__PURE__ */ __name((commandStack) => {
    commandStack.add(endpointDiscoveryMiddleware(pluginConfig, middlewareConfig), endpointDiscoveryMiddlewareOptions);
  }, "applyToStack")
}), "getEndpointDiscoveryPlugin");
var getEndpointDiscoveryRequiredPlugin = /* @__PURE__ */ __name((pluginConfig, middlewareConfig) => ({
  applyToStack: /* @__PURE__ */ __name((commandStack) => {
    commandStack.add(
      endpointDiscoveryMiddleware(pluginConfig, { ...middlewareConfig, isDiscoveredEndpointRequired: true }),
      endpointDiscoveryMiddlewareOptions
    );
  }, "applyToStack")
}), "getEndpointDiscoveryRequiredPlugin");
var getEndpointDiscoveryOptionalPlugin = /* @__PURE__ */ __name((pluginConfig, middlewareConfig) => ({
  applyToStack: /* @__PURE__ */ __name((commandStack) => {
    commandStack.add(
      endpointDiscoveryMiddleware(pluginConfig, { ...middlewareConfig, isDiscoveredEndpointRequired: false }),
      endpointDiscoveryMiddlewareOptions
    );
  }, "applyToStack")
}), "getEndpointDiscoveryOptionalPlugin");

// src/resolveEndpointDiscoveryConfig.ts
var import_endpoint_cache = require("@aws-sdk/endpoint-cache");
var resolveEndpointDiscoveryConfig = /* @__PURE__ */ __name((input, { endpointDiscoveryCommandCtor }) => {
  const { endpointCacheSize, endpointDiscoveryEnabled, endpointDiscoveryEnabledProvider } = input;
  return Object.assign(input, {
    endpointDiscoveryCommandCtor,
    endpointCache: new import_endpoint_cache.EndpointCache(endpointCacheSize ?? 1e3),
    endpointDiscoveryEnabled: endpointDiscoveryEnabled !== void 0 ? () => Promise.resolve(endpointDiscoveryEnabled) : endpointDiscoveryEnabledProvider,
    isClientEndpointDiscoveryEnabled: endpointDiscoveryEnabled !== void 0
  });
}, "resolveEndpointDiscoveryConfig");
// Annotate the CommonJS export names for ESM import in node:

0 && (module.exports = {
  NODE_ENDPOINT_DISCOVERY_CONFIG_OPTIONS,
  endpointDiscoveryMiddlewareOptions,
  getEndpointDiscoveryPlugin,
  getEndpointDiscoveryRequiredPlugin,
  getEndpointDiscoveryOptionalPlugin,
  resolveEndpointDiscoveryConfig
});


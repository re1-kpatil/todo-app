import { DynamoDBExtensionConfiguration } from "./extensionConfiguration";
/**
 * @public
 */
export interface RuntimeExtension {
    configure(extensionConfiguration: DynamoDBExtensionConfiguration): void;
}
/**
 * @public
 */
export interface RuntimeExtensionsConfig {
    extensions: RuntimeExtension[];
}
/**
 * @internal
 */
export declare const resolveRuntimeExtensions: (runtimeConfig: any, extensions: RuntimeExtension[]) => any;

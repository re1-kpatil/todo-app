import { getEndpointPlugin } from "@smithy/middleware-endpoint";
import { getSerdePlugin } from "@smithy/middleware-serde";
import { Command as $Command } from "@smithy/smithy-client";
import { commonParams } from "../endpoint/EndpointParameters";
import { de_DescribeBackupCommand, se_DescribeBackupCommand } from "../protocols/Aws_json1_0";
export { $Command };
export class DescribeBackupCommand extends $Command
    .classBuilder()
    .ep({
    ...commonParams,
    ResourceArn: { type: "contextParams", name: "BackupArn" },
})
    .m(function (Command, cs, config, o) {
    return [
        getSerdePlugin(config, this.serialize, this.deserialize),
        getEndpointPlugin(config, Command.getEndpointParameterInstructions()),
    ];
})
    .s("DynamoDB_20120810", "DescribeBackup", {})
    .n("DynamoDBClient", "DescribeBackupCommand")
    .f(void 0, void 0)
    .ser(se_DescribeBackupCommand)
    .de(de_DescribeBackupCommand)
    .build() {
}

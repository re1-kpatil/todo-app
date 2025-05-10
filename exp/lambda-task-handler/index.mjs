// index.mjs
import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { v4 as uuidv4 } from "uuid";
import AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

// Create DynamoDB client
const client = new DynamoDBClient({ region: "us-east-1" });

export const handler = async (event) => {
  try {
    const data = JSON.parse(event.body);
    const task = data.task;

    const taskId = uuidv4(); // Generate unique ID

    // Prepare parameters for DynamoDB
    const params = {
      TableName: "Tasks",
      Item: {
        taskId: { S: taskId },
        task: { S: task },
      },
    };

    // Write to DynamoDB
    await client.send(new PutItemCommand(params));

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        message: "Task stored successfully",
        taskId: taskId,
        task: task,
      }),
    };
  } catch (error) {
    console.error("Error storing task:", error);

    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        message: "Internal server error",
      }),
    };
  }
};

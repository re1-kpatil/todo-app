const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

const s3 = new AWS.S3();

exports.handler = async (event) => {
  try {
    const { fileContent, fileName } = JSON.parse(event.body);
    const buffer = Buffer.from(fileContent, 'base64');

    const uploadParams = {
      Bucket: 'todolistfinal',  // Replace with your actual bucket name
      Key: `${uuidv4()}-${fileName}`,
      Body: buffer,
      ContentType: "application/octet-stream",
    };

    await s3.putObject(uploadParams).promise();

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'File uploaded successfully!' }),
    };
  } catch (error) {
    console.error("Upload error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Upload failed', error: error.message }),
    };
  }
};

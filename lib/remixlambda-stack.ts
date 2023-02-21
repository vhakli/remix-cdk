import * as cdk from "aws-cdk-lib";
import path from "path";
import type { Construct } from "constructs";
import * as apigw from "@aws-cdk/aws-apigatewayv2-alpha";
import {
  HttpUrlIntegration,
  HttpLambdaIntegration,
} from "@aws-cdk/aws-apigatewayv2-integrations-alpha";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import type * as cloudfront from "aws-cdk-lib/aws-cloudfront";

interface RemixlambdaStackProps extends cdk.StackProps {
  distribution: cloudfront.Distribution;
}

export class RemixlambdaStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: RemixlambdaStackProps) {
    super(scope, id, props);

    const { distribution } = props;

    const testhandler = new NodejsFunction(this, "RemixLambdaTestHandler2", {
      entry: path.join(__dirname, "..", "server", "index.js"),
      memorySize: 1152,
      runtime: lambda.Runtime.NODEJS_18_X,
      timeout: cdk.Duration.seconds(5),
    });

    const api = new apigw.HttpApi(this, "RemixLambdaTestApiGw");

    api.addRoutes({
      path: "/{proxy+}",
      methods: [apigw.HttpMethod.ANY],
      integration: new HttpLambdaIntegration("Test2", testhandler),
    });
    api.addRoutes({
      path: "/_static/{proxy+}",
      methods: [apigw.HttpMethod.GET],
      integration: new HttpUrlIntegration(
        "Test",
        `https://${distribution.domainName}/{proxy}`,
        {
          method: apigw.HttpMethod.GET,
        },
      ),
    });
  }
}

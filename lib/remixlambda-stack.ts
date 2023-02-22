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
import * as acm from "aws-cdk-lib/aws-certificatemanager";
import type * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import type * as route53 from "aws-cdk-lib/aws-route53";

interface RemixlambdaStackProps extends cdk.StackProps {
  distribution: cloudfront.Distribution;
  hostedZone: route53.HostedZone;
}

export class RemixlambdaStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: RemixlambdaStackProps) {
    super(scope, id, props);

    const { distribution, hostedZone } = props;

    const testhandler = new NodejsFunction(this, "RemixLambdaTestHandler2", {
      entry: path.join(__dirname, "..", "server", "index.js"),
      memorySize: 1152,
      runtime: lambda.Runtime.NODEJS_18_X,
      timeout: cdk.Duration.seconds(5),
    });

    const api = new apigw.HttpApi(this, "RemixLambdaTestApiGw", {
      disableExecuteApiEndpoint: true,
    });

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
        }
      ),
    });

    const certificate = new acm.Certificate(
      this,
      "RemixLambdaTestCertificate",
      {
        domainName: "",
        validation: acm.CertificateValidation.fromDns(hostedZone),
      }
    );

    // const domainName = new apigw.DomainName(this, "RemixLambdaTestDomainName", {
    //   domainName: "",
    //   certificate:
    // })

    // const apiMapping = new apigw.ApiMapping(this, "RemixLambdaTestApiMapping", {
    //   api: apitest,
    //   domainName,
    // })
  }
}

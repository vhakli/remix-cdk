import * as cdk from "aws-cdk-lib";
import path from "path";
import type { Construct } from "constructs";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as apigw from "@aws-cdk/aws-apigatewayv2-alpha";
import {
  HttpUrlIntegration,
  HttpLambdaIntegration,
} from "@aws-cdk/aws-apigatewayv2-integrations-alpha";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as iam from "aws-cdk-lib/aws-iam";

export class RemixlambdaStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const bucket = new s3.Bucket(this, "RemixLambdaTestBucket", {
      versioned: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      accessControl: s3.BucketAccessControl.PRIVATE,
      objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_ENFORCED,
      encryption: s3.BucketEncryption.S3_MANAGED,
    });

    const distribution = new cloudfront.Distribution(
      this,
      "RemixLambdaTestDistribution",
      {
        defaultBehavior: {
          origin: new origins.S3Origin(bucket),
          cachePolicy: new cloudfront.CachePolicy(
            this,
            "RemixLambdaTestCachePolicy",
            {
              enableAcceptEncodingBrotli: true,
              enableAcceptEncodingGzip: true,
            }
          ),
          viewerProtocolPolicy:
            cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        },
        priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
      }
    );

    const policyStatement = new iam.PolicyStatement({
      actions: ["s3:GetObject"],
      resources: [bucket.arnForObjects("*")],
      sid: "AllowCloudFrontServicePrincipalReadOnly",
      principals: [
        new iam.PrincipalWithConditions(
          new iam.ServicePrincipal("cloudfront.amazonaws.com"),
          {
            StringEquals: {
              "AWS:SourceArn":
                `arn:aws:cloudfront::${this.account}:` +
                `distribution/${distribution.distributionId}}`,
            },
          }
        ),
      ],
    });

    bucket.addToResourcePolicy(policyStatement);

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
        // distribution.domainName.toString(),
        // bucket.bucketWebsiteUrl.toString(),
        "https://jsonplaceholder.typicode.com/posts",
        {
          method: apigw.HttpMethod.GET,
        }
      ),
    });
  }
}

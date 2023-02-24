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
import * as route53 from "aws-cdk-lib/aws-route53";

interface FrontendStackProps extends cdk.StackProps {
    projectName: string;
    domain: string;
    distribution: cloudfront.Distribution;
    hostedZone: route53.HostedZone;
}

export class FrontendStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props: FrontendStackProps) {
        super(scope, id, props);
        const { distribution, hostedZone, projectName, domain } = props;

        const remixHandler = new NodejsFunction(
            this,
            `${projectName}-Handler`,
            {
                entry: path.join(__dirname, "..", "server", "index.js"),
                memorySize: 1152,
                runtime: lambda.Runtime.NODEJS_18_X,
                timeout: cdk.Duration.seconds(5),
            }
        );

        const api = new apigw.HttpApi(this, `${projectName}-ApiGw`, {
            disableExecuteApiEndpoint: true,
        });

        api.addRoutes({
            path: "/{proxy+}",
            methods: [apigw.HttpMethod.ANY],
            integration: new HttpLambdaIntegration("remix", remixHandler),
        });
        api.addRoutes({
            path: "/_static/{proxy+}",
            methods: [apigw.HttpMethod.GET],
            integration: new HttpUrlIntegration(
                "assets",
                `https://${distribution.domainName}/{proxy}`,
                {
                    method: apigw.HttpMethod.GET,
                }
            ),
        });

        const certificate = new acm.Certificate(
            this,
            `${projectName}-Certificate`,
            {
                domainName: domain,
                validation: acm.CertificateValidation.fromDns(hostedZone),
            }
        );

        const domainName = new apigw.DomainName(
            this,
            `${projectName}-DomainName`,
            {
                domainName: domain,
                certificate,
            }
        );

        new apigw.ApiMapping(this, `${projectName}-ApiMapping`, {
            api,
            domainName,
        });

        new route53.CfnRecordSet(this, `${projectName}-ARecord`, {
            name: domain,
            type: "A",
            hostedZoneId: hostedZone.hostedZoneId,
            setIdentifier: `${this.region}-api`,
            aliasTarget: {
                dnsName: domainName.regionalDomainName,
                hostedZoneId: domainName.regionalHostedZoneId,
            },
            region: this.region,
        });
    }
}

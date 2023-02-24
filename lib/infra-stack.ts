import * as cdk from "aws-cdk-lib";
import path from "path";
import type { Construct } from "constructs";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as iam from "aws-cdk-lib/aws-iam";
import * as route53 from "aws-cdk-lib/aws-route53";

interface InfraStackProps extends cdk.StackProps {
    projectName: string;
    domain: string;
}

export class InfraStack extends cdk.Stack {
    public readonly distribution: cloudfront.Distribution;
    public readonly hostedZone: route53.HostedZone;

    constructor(scope: Construct, id: string, props: InfraStackProps) {
        super(scope, id, props);

        const { domain, projectName } = props;

        const bucket = new s3.Bucket(this, `${projectName}-Assets`, {
            versioned: true,
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
            removalPolicy: cdk.RemovalPolicy.RETAIN,
            accessControl: s3.BucketAccessControl.PRIVATE,
            objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_ENFORCED,
            encryption: s3.BucketEncryption.S3_MANAGED,
        });

        new s3deploy.BucketDeployment(this, "DeployFrontendAssets", {
            sources: [
                s3deploy.Source.asset(path.join(__dirname, "..", "public")),
            ],
            destinationBucket: bucket,
        });

        this.distribution = new cloudfront.Distribution(this, projectName, {
            comment: `${projectName} distribution`,
            defaultBehavior: {
                origin: new origins.S3Origin(bucket),
                cachePolicy: new cloudfront.CachePolicy(this, "CachePolicy", {
                    enableAcceptEncodingBrotli: true,
                    enableAcceptEncodingGzip: true,
                }),
                viewerProtocolPolicy:
                    cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
            },
            priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
        });

        const policyStatement = new iam.PolicyStatement({
            actions: ["s3:GetObject"],
            resources: [bucket.arnForObjects("*")],
            principals: [
                new iam.PrincipalWithConditions(
                    new iam.ServicePrincipal("cloudfront.amazonaws.com"),
                    {
                        StringEquals: {
                            "AWS:SourceArn":
                                `arn:aws:cloudfront::${this.account}:` +
                                `distribution/${this.distribution.distributionId}}`,
                        },
                    }
                ),
            ],
        });

        bucket.addToResourcePolicy(policyStatement);

        this.hostedZone = new route53.HostedZone(this, "HostedZone", {
            zoneName: domain,
        });
    }
}

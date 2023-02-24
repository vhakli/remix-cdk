#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { FrontendStack } from "../lib/frontend-stack";
import { InfraStack } from "../lib/infra-stack";

const PROJECT_NAME = "";
const DOMAIN = "";
const AWS_REGION_EU = "eu-north-1";
const AWS_REGION_US = "us-east-1";

const app = new cdk.App();

const infra = new InfraStack(app, "InfraStack", {
    stackName: `${PROJECT_NAME}-InfraStack`,
    domain: DOMAIN,
    projectName: PROJECT_NAME,
    env: { region: AWS_REGION_EU },
});

new FrontendStack(app, "FrontendStackEu", {
    stackName: `${PROJECT_NAME}-FrontendStack`,
    projectName: PROJECT_NAME,
    domain: DOMAIN,
    distribution: infra.distribution,
    hostedZone: infra.hostedZone,
    env: { region: AWS_REGION_EU },
});

// new FrontendStack(app, "FrontendStackUs", {
//     stackName: `${PROJECT_NAME}-FrontendStack`,
//     projectName: PROJECT_NAME,
//     domain: DOMAIN,
//     distribution: infra.distribution,
//     hostedZone: infra.hostedZone,
//     crossRegionReferences: true,
//     env: { region: AWS_REGION_US },
// });

#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { RemixlambdaStack } from "../lib/remixlambda-stack";
import { GlobalStack } from "../lib/global-stack";

const app = new cdk.App();

const infra = new GlobalStack(app, "GlobalStack", {
  env: { region: "eu-north-1" },
});

new RemixlambdaStack(app, "RemixlambdaStack", {
  distribution: infra.distribution,
  env: { region: "eu-north-1" },
});
new RemixlambdaStack(app, "RemixlambdaStackUs", {
  distribution: infra.distribution,
  crossRegionReferences: true,
  env: { region: "us-east-1" },
});

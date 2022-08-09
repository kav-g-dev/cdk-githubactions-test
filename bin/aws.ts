#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { SimpleAppStack } from "../lib/aws-stack";
import { HostedZone } from "../lib/rout52-stack";

const dnsName = "kav-dev.store";
const AWS_REGION = "us-east-1";
enum Env {
  DEV = "dev",
  PROD = "prod",
}

const app = new cdk.App();
const { hostedZone, certificate } = new HostedZone(
  app,
  `SimpleAppHostedZone-${Env.DEV}`,
  {
    env: { region: AWS_REGION },
    dnsName,
    envName: Env.DEV,
  }
);
new SimpleAppStack(app, `SimpleAppTest-${Env.DEV}`, {
  env: { region: AWS_REGION },
  envName: Env.DEV,
  hostedZone,
  certificate,
  dnsName,
  /* If you don't specify 'env', this stack will be environment-agnostic.
   * Account/Region-dependent features and context lookups will not work,
   * but a single synthesized template can be deployed anywhere. */

  /* Uncomment the next line to specialize this stack for the AWS Account
   * and Region that are implied by the current CLI configuration. */
  // env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },

  /* Uncomment the next line if you know exactly what Account and Region you
   * want to deploy the stack to. */
  // env: { account: '123456789012', region: 'us-east-1' },

  /* For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html */
});

// new SimpleAppStack(app, `SimpleAppTest-${Env.PROD}`,{
//   env: { region: 'us-east-2' },
//   envName: Env.PROD
// })

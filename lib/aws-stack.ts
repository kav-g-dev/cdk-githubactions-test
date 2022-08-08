import { CfnOutput, Stack, StackProps } from "aws-cdk-lib";
import { PolicyStatement } from "aws-cdk-lib/aws-iam";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import * as lambda from "aws-cdk-lib/aws-lambda-nodejs";
import { Bucket, BucketEncryption } from "aws-cdk-lib/aws-s3";
import { BucketDeployment, Source } from "aws-cdk-lib/aws-s3-deployment";
import { Construct } from "constructs";
import * as path from "path";
import {
  HttpApi,
  CorsHttpMethod,
  HttpMethod,
} from "@aws-cdk/aws-apigatewayv2-alpha";
import { HttpLambdaIntegration } from "@aws-cdk/aws-apigatewayv2-integrations-alpha";
import { Distribution } from "aws-cdk-lib/aws-cloudfront";
import {
  ARecord,
  IPublicHostedZone,
  RecordTarget,
} from "aws-cdk-lib/aws-route53";
import { ICertificate } from "aws-cdk-lib/aws-certificatemanager";
import { S3Origin } from "aws-cdk-lib/aws-cloudfront-origins";
import { CloudFrontTarget } from "aws-cdk-lib/aws-route53-targets";

interface SimpleAppStackProps extends StackProps {
  envName: string;
  hostedZone: IPublicHostedZone;
  certificate: ICertificate;
  dnsName: string;
}
export class SimpleAppStack extends Stack {
  constructor(scope: Construct, id: string, props: SimpleAppStackProps) {
    super(scope, id, props);

    // S3 Bucket
    const bucket = new Bucket(this, `MyCdkBucket-${props.envName}`, {
      encryption: BucketEncryption.S3_MANAGED,
    });

    new BucketDeployment(this, `MySimplePhotosAssets-${props.envName}`, {
      sources: [Source.asset(path.join(__dirname, "..", "photos"))],
      destinationBucket: bucket,
    });

    const websiteBucket = new Bucket(
      this,
      `MySimpleAppWebsiteBucket-${props.envName}`,
      {
        websiteIndexDocument: "index.html",
        publicReadAccess: true,
      }
    );

    // Cloudfront
    const cloudfront = new Distribution(
      this,
      `MySimpleAppCloudfrontDistribution-${props.envName}`,
      {
        defaultBehavior: { origin: new S3Origin(websiteBucket) },
        domainNames: [props.dnsName],
        certificate: props.certificate,
      }
    );

    new ARecord(this, `SimpleAppARecord-${props.envName}`, {
      zone: props.hostedZone,
      target: RecordTarget.fromAlias(new CloudFrontTarget(cloudfront)),
    });

    new BucketDeployment(
      this,
      `MySimpleAppWebsiteDeployment-${props.envName}`,
      {
        sources: [
          Source.asset(path.join(__dirname, "..", "frontend", "build")),
        ],
        destinationBucket: websiteBucket,
        distribution: cloudfront, // to clear Cloudfront cache
      }
    );

    // Lambda definition
    const getPhotos = new lambda.NodejsFunction(
      this,
      `MySimpleAppLambda-${props.envName}`,
      {
        runtime: Runtime.NODEJS_16_X,
        entry: path.join(__dirname, "..", "api", "get-photos", "index.ts"),
        handler: "getPhotos",
        environment: {
          PHOTO_BUCKET_NAME: bucket.bucketName,
        },
      }
    );

    // AMI Policies
    const bucketContainerPermissions = new PolicyStatement();
    bucketContainerPermissions.addResources(bucket.bucketArn);
    bucketContainerPermissions.addActions("s3:ListBucket");

    const bucketPermissions = new PolicyStatement();
    bucketPermissions.addResources(`${bucket.bucketArn}/*`);
    bucketPermissions.addActions("s3:GetObject", "s3:PutObject");

    getPhotos.addToRolePolicy(bucketContainerPermissions);
    getPhotos.addToRolePolicy(bucketPermissions);

    // REST with API Gateway
    const httpApi = new HttpApi(this, `MySimpleAppHttpApi-${props.envName}`, {
      description: "HTTP API example",
      corsPreflight: {
        allowHeaders: [
          "Content-type",
          "X-Amz-Date",
          "Authorization",
          "X-Api-Key",
        ],
        allowOrigins: ["*"],
        allowMethods: [CorsHttpMethod.GET],
      },
    });

    httpApi.addRoutes({
      path: "/getallphotos",
      methods: [HttpMethod.GET],
      integration: new HttpLambdaIntegration("get-all-photos", getPhotos),
    });

    new CfnOutput(this, `MySimpleAppBucketNameExport-${props?.envName}`, {
      value: bucket.bucketName,
      exportName: "MySimpleAppBucketName",
    });

    new CfnOutput(this, `MySimpleAppApiGateway-${props?.envName}`, {
      value: httpApi.url!,
      exportName: "MySimpleAppApiGatewayName",
    });

    new CfnOutput(this, `MySimpleAppReactWebsiteOutput-${props?.envName}`, {
      value: websiteBucket.bucketName,
      exportName: "MySimpleAppReactWebsiteName",
    });

    new CfnOutput(this, `MySimpleAppCloudfront-${props?.envName}`, {
      value: cloudfront.distributionDomainName,
      exportName: "MySimpleAppCloudfrontName",
    });
  }
}

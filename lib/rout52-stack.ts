import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { IPublicHostedZone, PublicHostedZone } from "aws-cdk-lib/aws-route53";
import {
  Certificate,
  CertificateValidation,
  ICertificate,
} from "aws-cdk-lib/aws-certificatemanager";

interface HostedZoneStackProps extends StackProps {
  dnsName: string;
  envName: string;
}
export class HostedZone extends Stack {
  public readonly hostedZone: IPublicHostedZone;
  public readonly certificate: ICertificate;

  constructor(scope: Construct, id: string, props: HostedZoneStackProps) {
    super(scope, id, props);
    this.hostedZone = new PublicHostedZone(
      this,
      `MySimpleAppHostedZone-${props.envName}`,
      {
        zoneName: props.dnsName,
      }
    );

    this.certificate = new Certificate(
      this,
      `SimpleAppCertificateManager-${props.envName}`,
      {
        domainName: props.dnsName,
        validation: CertificateValidation.fromDns(this.hostedZone),
      }
    );
  }
}

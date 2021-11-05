import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as random from "@pulumi/random";

export interface ScaryDatabaseArgs{

    vpcId: pulumi.Input<string>;
    dbName?: pulumi.Input<string>;
    instanceClass?: pulumi.Input<string>;
    
}

export class ScaryDatabase extends pulumi.ComponentResource {

    password: random.RandomPassword;
    securityGroup: aws.ec2.SecurityGroup;
    database: aws.rds.Instance;

    private readonly name: string

    constructor(name: string, args: ScaryDatabaseArgs, opts?: pulumi.ResourceOptions) {
        super("rds:index:ScaryDatabase", name, {}, opts);

        this.name = name;

        this.securityGroup = new aws.ec2.SecurityGroup(`${name}-sg`, {
            vpcId: args.vpcId,
            description: "Allows access to connect to database from the public internet",
            ingress: [{
                protocol: "tcp",
                fromPort: 3306,
                toPort: 3306,
                cidrBlocks: [ "0.0.0.0/0" ],
            }]
        }, { parent: this })

        this.password = new random.RandomPassword(`${name}-password`, {
            length: 14,
            special: false,
        }, { parent: this })

        this.database = new aws.rds.Instance(`${name}-db`, {
            name: args.dbName || "wordpress",
            engine: "mysql",
            instanceClass: args.instanceClass || "db.t2.micro",
            allocatedStorage: 5,
            skipFinalSnapshot: true,
            password: this.password.result!,
            username: "wordpress",
            vpcSecurityGroupIds: [ this.securityGroup.id ],
            publiclyAccessible: true,
        }, { parent: this })

        this.registerOutputs({});

    }

}
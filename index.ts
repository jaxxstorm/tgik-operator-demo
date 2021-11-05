import * as rds from "./rds";
import * as awsx from "@pulumi/awsx";
import * as wp from "./wordpress";
import * as k8s from "@pulumi/kubernetes";

const ns = new k8s.core.v1.Namespace("wordpress", {
    metadata: {
        name: "wordpress"
    }
})

const vpc = awsx.ec2.Vpc.getDefault();

const db = new rds.ScaryDatabase("wordpress", {
    vpcId: vpc.id,
})

const wordpress = new wp.Wordpress("wordpress", {
    dbPassword: db.password.result,
    dbHost: db.database.address,
    namespace: ns.metadata.name,
})

export const address = wordpress.svc.status.loadBalancer.ingress[0].ip


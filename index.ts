import * as rds from "./database";
import * as wp from "./wordpress";
import * as awsx from "@pulumi/awsx";
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
    dbHost: db.database.address,
    dbPassword: db.password.result,
    namespace: ns.metadata.name,
}, { parent: ns })

export const address = wordpress.svc.status.loadBalancer.ingress[0].ip


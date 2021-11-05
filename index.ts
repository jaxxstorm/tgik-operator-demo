import * as database from "./k8sdb";
import * as wp from "./wordpress";
import * as k8s from "@pulumi/kubernetes";

const ns = new k8s.core.v1.Namespace("wordpress", {
    metadata: {
        name: "wordpress"
    }
})

const db = new database.KubeDb("wordpress", {
    namespace: ns.metadata.name
})

const wordpress = new wp.Wordpress("wordpress", {
    dbName: "wordpress",
    dbPassword: db.password.result,
    dbHost: db.svc.metadata.name,
    namespace: ns.metadata.name,
})



export const address = wordpress.svc.status.loadBalancer.ingress[0].ip


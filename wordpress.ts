import * as pulumi from "@pulumi/pulumi";
import * as k8s from "@pulumi/kubernetes";
import { secret } from "@pulumi/pulumi";
import { password } from "@pulumi/mysql/config";

export interface WordpressArgs{
    dbUser?: pulumi.Input<string>;
    dbName?: pulumi.Input<string>;
    dbPassword?: pulumi.Input<string>;
    dbHost: pulumi.Input<string>;
    serviceType?: pulumi.Input<string>;
    namespace: pulumi.Input<string>;
}

export class Wordpress extends pulumi.ComponentResource {

    svc: k8s.core.v1.Service;
    secret: k8s.core.v1.Secret;
    deployment: k8s.apps.v1.Deployment;

    private readonly name: string

    constructor(name: string, args: WordpressArgs, opts?: pulumi.ResourceOptions) {
        super("jaxxstorm:index:Wordpress", name, {}, opts);

        this.name = name;

        this.secret = new k8s.core.v1.Secret(`${name}-wp-password`, {
            metadata: {
                namespace: args.namespace,
            },
            stringData: {
                password: args.dbPassword!
            },
        }, { parent: this })

        this.deployment = new k8s.apps.v1.Deployment("wordpress", {
            metadata: {
                namespace: args.namespace,
                labels: {
                    app: `${name}-wordpress`,
                },
            },
            spec: {
                selector: {
                    matchLabels: {
                        app: `${name}-wordpress`,
                    },
                },
                strategy: {
                    type: "Recreate",
                },
                template: {
                    metadata: {
                        labels: {
                            app: `${name}-wordpress`,
                        },
                    },
                    spec: {
                        containers: [{
                            image: "wordpress:5.8.1-apache",
                            name: "wordpress",
                            env: [
                                {
                                    name: "WORDPRESS_DB_HOST",
                                    value: args.dbHost,
                                },
                                {
                                    name: "WORDPRESS_DB_USER",
                                    value: args.dbUser || "wordpress",
                                },
                                {
                                    name: "WORDPRESS_DB_PASSWORD",
                                    valueFrom: {
                                        secretKeyRef: {
                                            name: this.secret.metadata.name,
                                            key: "password",
                                        }
                                    }
                                },
                                {
                                    name: "WORDPRESS_DB_NAME",
                                    value: args.dbName || "wordpress"
                                }
                            ],
                            ports: [{
                                containerPort: 80,
                                name: "wordpress",
                            }],
                        }],
                    },
                },
            },
        }, { parent: this });

        this.svc = new k8s.core.v1.Service(`${name}-wordpress`, {
            metadata: {
                namespace: args.namespace,
                labels: {
                    app: `${name}-wordpress`,
                },
            },
            spec: {
                ports: [{
                    port: 80,
                }],
                selector: {
                    app: `${name}-wordpress`,
                },
                type: args.serviceType || "LoadBalancer",
            },
        }, { parent: this, dependsOn: [ this.deployment ] });

        


        this.registerOutputs({});

    }

}
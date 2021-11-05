import * as pulumi from "@pulumi/pulumi";
import * as random from "@pulumi/random";
import * as k8s from "@pulumi/kubernetes";

export interface KubeDbArgs{
    dbName?: pulumi.Input<string>;
    namespace: pulumi.Input<string>;

}

export class KubeDb extends pulumi.ComponentResource {

    password: random.RandomPassword;
    svc: k8s.core.v1.Service;
    secret: k8s.core.v1.Secret;
    deployment: k8s.apps.v1.Deployment;

    private readonly name: string

    constructor(name: string, args: KubeDbArgs, opts?: pulumi.ResourceOptions) {
        super("jaxxstorm:index:KubeDatabase", name, {}, opts);

        this.name = name;

        this.password = new random.RandomPassword(`${name}-password`, {
            length: 14,
            special: false,
        }, { parent: this })

        this.svc = new k8s.core.v1.Service(`${name}-svc`, {
            metadata: {
                namespace: args.namespace,
                labels: {
                    app: `${name}-mysql`,
                },
            },
            spec: {
                ports: [{
                    port: 3306,
                }],
                selector: {
                    app: `${name}-mysql`,
                    tier: "mysql",
                },
            },
        }, { parent: this });

        this.secret = new k8s.core.v1.Secret(`${name}-wp-password`, {
            metadata: {
                namespace: args.namespace,
            },
            stringData: {
                password: this.password.result!
            },
        }, { parent: this })

        this.deployment = new k8s.apps.v1.Deployment(`${name}-mysql`, {
            metadata: {
                namespace: args.namespace,
                labels: {
                    app: `${name}-mysql`,
                },
            },
            spec: {
                selector: {
                    matchLabels: {
                        app: `${name}-mysql`,
                        tier: "mysql",
                    },
                },
                strategy: {
                    type: "Recreate",
                },
                template: {
                    metadata: {
                        labels: {
                            app: `${name}-mysql`,
                            tier: "mysql",
                        },
                    },
                    spec: {
                        containers: [{
                            image: "mysql:5.6",
                            name: "mysql",
                            env: [{
                                name: "MYSQL_ROOT_PASSWORD",
                                valueFrom: {
                                    secretKeyRef: {
                                        name: this.secret.metadata.name,
                                        key: "password",
                                    },
                                },
                            }, {
                                name: "MYSQL_DATABASE",
                                value: args.dbName || "wordpress",
                            }, {
                                name: "MYSQL_USER",
                                value: "wordpress"
                            }, {
                                name: "MYSQL_PASSWORD",
                                valueFrom: {
                                    secretKeyRef: {
                                        name: this.secret.metadata.name,
                                        key: "password",
                                    },
                                },
                            }],
                            ports: [{
                                containerPort: 3306,
                                name: "mysql",
                            }],
                        }],
                    },
                },
            },
        }, { parent: this });


        this.registerOutputs({});

    }

}
# Pulumi Kubernetes Operator Demo

This repository will show you a real world example of deploying a an application with the Pulumi Kubernetes Operator

## Step 0: Login

You'll need somewhere to store your Pulumi state. We recommend a free account with the [Pulumi SaaS](https://app.pulumi.com/) but you can also store your state in an [object store](https://www.pulumi.com/docs/intro/concepts/state/#logging-in).

## Step 1: Get a Kubernetes Cluster

Before you start anything, you'll need a Kubernetes cluster to deploy the operator to. You can use a local cluster, like [KIND](https://kind.sigs.k8s.io/) or deploy a managed cluster, like [Amazon EKS](https://www.pulumi.com/docs/guides/crosswalk/aws/eks/) with Pulumi.

Once you've got your cluster up and running, make sure your `KUBECONFIG` is set correctly, and you can access your cluster with `kubectl cluster-info`.

## Step 2: Deploy the Operator

Once you have a cluster up and running, you can deploy the Pulumi Kubernetes Operator. We have instructions on how to do that [here](https://www.pulumi.com/docs/guides/continuous-delivery/pulumi-kubernetes-operator/).

If you decide to use Pulumi to deploy the operator, we recommend creating a distinct, unique project outside of this repository to do so.

## Step 3: Create a Stack Custom Resource

Install the Pulumi Kubernetes Operator only installed the operator itself, we now need something for the operator to reconcile! The Pulumi Kubernetes Operator reconciles Pulumi programs.

This repository contains a Pulumi program you can test out, so let's point the operator at this repo with a Stack Resource.

You can create a `Stack` `CustomResource` with Pulumi, or use YAML to do so. The YAML looks a little bit like this:

```
apiVersion: pulumi.com/v1
kind: Stack
metadata:
  name: tgik-demo
spec:
  backend: "<backend>"
  stack: "dev"
  projectRepo: https://github.com/jaxxstorm/tgik-operator-demo
  branch: refs/heads/main
  destroyOnFinalize: true
```

Make sure you modify your `backend` to point at your login step from step 0.

Once the stack resource has been created, look at the logs for your operator. You'll notice the operator is creating resources inside your cluster, provisioning a wordpress instance with a local MySQL.

You can verify everything is working by accessing your wordpress endpoint, you may need to use `kubectl port-forward` depending on your cluster.

## Step 4: Use an RDS database

Once you've provisioned your cluster, you might realize this database is very flimsy inside your Kubernetes cluster. It has no persistent storage and will reset any time the pod dies.

To rectify this, we'll use a cloud database by AWS, an RDS MySQL database.

The code for this lives in the `production` branch. Before you do this though, you'll need remove your old deployment. 

Delete the original stack resource with `kubectl delete stack tgik-demo`

Once that's complete, make sure you have valid AWS credentials, then create a secret with them inside your cluster:

```bash
bubectl create secret aws-creds-secret --from-literal=AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID --from-literal=AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY --from-literal=AWS_SESSION_TOKEN=$AWS_SESSION_TOKEN
```

then, recreate your stack like so:

```
apiVersion: pulumi.com/v1
kind: Stack
metadata:
  name: tgik-demo
spec:
  backend: "<backend>"
  envRefs:
    AWS_ACCESS_KEY_ID:
      type: Secret
      secret:
        name: aws-creds-secret
        key: AWS_ACCESS_KEY_ID
    AWS_SECRET_ACCESS_KEY:
      type: Secret
      secret:
        name: aws-creds-secret
        key: AWS_SECRET_ACCESS_KEY
    AWS_SESSION_TOKEN:
      type: Secret
      secret:
        name: aws-creds-secret
        key: AWS_SESSION_TOKEN
    AWS_DEFAULT_REGION:
      type: Literal
      literal:
        value: "us-west-2"
  stack: "production"
  projectRepo: https://github.com/jaxxstorm/tgik-operator-demo
  branch: refs/heads/production
  destroyOnFinalize: true
```

Watch as your new wordpress, with RDS backend is created!



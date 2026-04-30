**DevOps Take-Home Assignment** 

**Overview** 

This assignment evaluates your ability to design, provision, deploy, and observe a production-like Kubernetes workload using modern DevOps practices. You will use Infrastructure as Code to provision a Kubernetes cluster, deploy a microservice, and configure monitoring for both the application and the platform. 

**Objective** 

You have to create a project that can do the following: 

1\. Set up AKS/EKS cluster using Terraform. 

2\. Deploy a Hello World microservice on it. 

a. The service must expose an HTTP endpoint returning “Hello World” 

b. Any language is acceptable (Node.js, Python, Go preferred) 

3\. Create a Helm chart for deploying the above application to the Kubernetes Cluster. 4\. Setup Prometheus and Grafana to monitor the service and the Kubernetes cluster. 5\. (Optional but adds value) Deploy the application using a pipeline like Gitlab Runner/Github Actions, etc. 

**Submission Instructions** 

● Share a GitHub repository link (public or private with access provided) 

○ Your repository must include a README with details including any notes about partial implementations or known limitations. 

● Ensure the project can be run end-to-end using your documentation.
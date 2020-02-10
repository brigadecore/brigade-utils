ARG GO_VERSION

FROM lachlanevenson/k8s-kubectl:v1.17.2 as kubectl

FROM golang:${GO_VERSION}-alpine3.11 as golang

FROM docker:stable-dind

COPY --from=kubectl /usr/local/bin/kubectl /usr/local/bin/kubectl
COPY --from=golang /usr/local/go /usr/local/go

ARG KIND_VERSION
ENV KIND_VERSION=${KIND_VERSION}

ENV GOPATH /go
ENV PATH $GOPATH/bin:/usr/local/go/bin:$PATH

# Install a few convenience utilities
RUN apk add --no-cache bash curl make

RUN wget https://github.com/kubernetes-sigs/kind/releases/download/${KIND_VERSION}/kind-linux-amd64 && \
    chmod +x kind-linux-amd64 && \
    mv kind-linux-amd64 /usr/bin/kind

WORKDIR $GOPATH
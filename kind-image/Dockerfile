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

# Golang utils currently coupled with the build system
# used by brigadecore/brigade
ENV DEP_VERSION=v0.5.4
ENV GOLANGCI_LINT_VERSION=v1.23.3
ENV GO_TOOLS_VERSION=release-branch.go1.13

# Add various utilities, both for general usability (bash, make, git)
# as well as golang build-time deps (gcc, musl-dev)
RUN apk add --no-cache bash curl make gcc git musl-dev \
  && curl -sSL \
    -o /usr/local/bin/dep \
    https://github.com/golang/dep/releases/download/$DEP_VERSION/dep-linux-amd64 \
  && chmod 755 /usr/local/bin/dep \
  && curl -sfL \
    https://install.goreleaser.com/github.com/golangci/golangci-lint.sh | sh \
    -s -- -b $GOPATH/bin $GOLANGCI_LINT_VERSION \
  && go get -u golang.org/x/tools/cmd/goimports \
  && cd $GOPATH/src/golang.org/x/tools/cmd/goimports \
  && git checkout $GO_TOOLS_VERSION \
  && go install

RUN wget https://github.com/kubernetes-sigs/kind/releases/download/${KIND_VERSION}/kind-linux-amd64 && \
    chmod +x kind-linux-amd64 && \
    mv kind-linux-amd64 /go/bin/kind

WORKDIR $GOPATH
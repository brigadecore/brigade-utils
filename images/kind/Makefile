# This Makefile was created to build and push the golang-kind image
# which is the default image for the KindJob class

BASE_IMAGE_NAME = golang-kind
GO_VERSION     ?= 1.15.8
KIND_VERSION   ?= v0.10.0
VERSION        ?= $(GO_VERSION)-$(KIND_VERSION)

.PHONY: build
build:
	docker build \
		--build-arg GO_VERSION=$(GO_VERSION) \
		--build-arg KIND_VERSION=$(KIND_VERSION) \
		-t $(DOCKER_IMAGE_PREFIX)$(BASE_IMAGE_NAME):$(VERSION) .

.PHONY: push
push: build
	docker push $(DOCKER_IMAGE_PREFIX)$(BASE_IMAGE_NAME):$(VERSION)


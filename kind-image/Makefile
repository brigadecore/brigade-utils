# This Makefile was created to build and push the golang-kind image
# which is the default image for the KindJob class

BASE_IMAGE_NAME = golang-kind
DOCKER_ORG ?= brigadecore/
GO_VERSION ?= 1.13.7
KIND_VERSION ?= v0.7.0

ifdef DOCKER_REGISTRY
	DOCKER_REGISTRY ?= $(DOCKER_REGISTRY)/
endif

DOCKER_IMAGE_PREFIX := $(DOCKER_REGISTRY)$(DOCKER_ORG)

VERSION ?= $(GO_VERSION)-$(KIND_VERSION)

.PHONY: build
build:
	docker build \
		--build-arg GO_VERSION=$(GO_VERSION) \
		--build-arg KIND_VERSION=$(KIND_VERSION) \
		-t $(DOCKER_IMAGE_PREFIX)$(BASE_IMAGE_NAME):$(VERSION) .

.PHONY: push
push: build
	docker push $(DOCKER_IMAGE_PREFIX)$(BASE_IMAGE_NAME):$(VERSION)


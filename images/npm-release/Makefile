# This Makefile was created to build and push the npm-release image
# which is the default image for the NPMRelease class

BASE_IMAGE_NAME = npm-release
VERSION         = edge

.PHONY: build
build:
	docker build -t $(DOCKER_IMAGE_PREFIX)$(BASE_IMAGE_NAME):$(VERSION) .

.PHONY: push
push: build
	docker push $(DOCKER_IMAGE_PREFIX)$(BASE_IMAGE_NAME):$(VERSION)

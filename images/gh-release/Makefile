# This Makefile was created to build and push the gh-release image
# which is the default image for the GitHubRelease class

BASE_IMAGE_NAME = gh-release
VERSION         = edge

.PHONY: build
build:
	docker build -t $(DOCKER_IMAGE_PREFIX)$(BASE_IMAGE_NAME):$(VERSION) .

.PHONY: push
push: build
	docker push $(DOCKER_IMAGE_PREFIX)$(BASE_IMAGE_NAME):$(VERSION)


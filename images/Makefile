# This Makefile was created to build and push all sub-directory images

# --no-print-directory avoids verbose logging when invoking targets that utilize sub-makes
MAKE_OPTS ?= --no-print-directory

DOCKER_ORG 				 ?= brigadecore
DOCKER_IMAGE_PREFIX = $(DOCKER_ORG)/
ifdef DOCKER_REGISTRY
	DOCKER_IMAGE_PREFIX := $(DOCKER_REGISTRY)/$(DOCKER_IMAGE_PREFIX)
endif

# all-images loops through all sub-directories and if they
# contain a Dockerfile, it will run the make target(s) provided
# by the first argument
define all-images
	@for dir in $$(ls -1 .); do \
		if [[ -e "$$dir/Dockerfile" ]]; then \
			IMAGE=$$dir make $(MAKE_OPTS) $(1) || exit $$? ; \
		fi ; \
	done
endef

default: build-image push-image

.PHONY: build-image
build-image:
ifndef IMAGE
	$(call all-images,build-image)
else
	cd $(IMAGE) && \
		DOCKER_IMAGE_PREFIX=$(DOCKER_IMAGE_PREFIX) make build
endif

.PHONY: push-image
push-image:
ifndef IMAGE
	$(call all-images,push-image)
else
	cd $(IMAGE) && \
		DOCKER_IMAGE_PREFIX=$(DOCKER_IMAGE_PREFIX) make push
endif

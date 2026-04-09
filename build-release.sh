#!/bin/bash
# Usage:
#   ./build-release.sh        → full build (all 4 ABIs) + install
#   ./build-release.sh fast   → fast build (arm64-v8a only) + install

cd frontend/android

if [ "$1" = "fast" ]; then
  echo "⚡ Fast build: arm64-v8a only"
  ./gradlew assembleRelease -Pfast -PreactNativeArchitectures=arm64-v8a && \
    adb install -r app/build/outputs/apk/release/app-release.apk
else
  echo "🏗  Full build: all ABIs"
  ./gradlew assembleRelease && \
    adb install -r app/build/outputs/apk/release/app-release.apk
fi

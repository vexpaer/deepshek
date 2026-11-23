#!/usr/bin/env bash
set -euo pipefail
apk=android/app/build/outputs/apk/debug/app-debug.apk
trap 'adb logcat -d -s Capacitor/Console chromium AndroidRuntime | tail -80' ERR
adb install -r "$apk"
adb shell am start -W -n com.vexpaer.deepshek/.MainActivity
for attempt in $(seq 1 12); do
  adb shell uiautomator dump /sdcard/window.xml >/dev/null
  adb shell cat /sdcard/window.xml > /tmp/deepshek-ui.xml
  if grep -Eq '深度思考|DeepThink|Deep Think' /tmp/deepshek-ui.xml; then
    mkdir -p scratch
    adb exec-out screencap -p > scratch/android-home.png
    exit 0
  fi
  sleep 1
done
adb shell dumpsys webviewupdate | head -15
adb logcat -d -s Capacitor/Console chromium AndroidRuntime | tail -80
cat /tmp/deepshek-ui.xml
exit 1

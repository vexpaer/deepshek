#!/usr/bin/env bash
set -euo pipefail
umask 077
work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT
tag="v$(node -p 'require("./package.json").version')"
mkdir -p release-assets
if [[ -n "${DEEPSHEK_SIGNING:-}" ]]; then
  printf '%s' "$DEEPSHEK_SIGNING" > "$work/signing.json"
  jq -er .keystore "$work/signing.json" | base64 -d > "$work/release.p12"
  SIGN_PASS=$(jq -er .password "$work/signing.json")
  export SIGN_PASS
else
  # One-time transition from disposable debug certificates. Never replace an issued signer.
  test "$tag" = v0.1.2
  status=$(curl -sS -o /dev/null -w '%{http_code}' "https://api.github.com/repos/$GITHUB_REPOSITORY/releases/tags/$tag")
  test "$status" = 404
  SIGN_PASS=$(openssl rand -hex 32)
  export SIGN_PASS
  keytool -genkeypair -noprompt -keystore "$work/release.p12" -storetype PKCS12 \
    -storepass:env SIGN_PASS -keypass:env SIGN_PASS -alias release -keyalg RSA -keysize 3072 \
    -validity 12000 -dname "CN=Deepshek Android Release"
  node -e 'const fs=require("node:fs"); console.log(JSON.stringify({keystore:fs.readFileSync(process.argv[1]).toString("base64"),password:process.env.SIGN_PASS}))' \
    "$work/release.p12" > "$work/signing.json"
  mkdir -p signing-backup
  openssl cms -encrypt -binary -aes256 -outform DER -in "$work/signing.json" \
    -out signing-backup/keystore.cms .github/signing/bootstrap-recipient.pem
fi
signer="$ANDROID_HOME/build-tools/34.0.0/apksigner"
out="release-assets/deepshek-$tag-android.apk"
"$signer" sign --ks "$work/release.p12" --ks-pass env:SIGN_PASS --out "$out" \
  android/app/build/outputs/apk/release/app-release-unsigned.apk
"$signer" verify --verbose --print-certs "$out"

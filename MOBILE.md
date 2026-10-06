# XRPet Mobile Packaging

XRPet uses Capacitor 8 to wrap the same web app for Android and iOS.

## Android
1. Install Android Studio and a supported Android SDK.
2. Run `npm install`.
3. Run `npm run build`.
4. Run `npx cap add android` once.
5. Run `npm run android`.

## iOS
1. Use macOS with Xcode.
2. Run `npm install`.
3. Run `npm run build`.
4. Run `npx cap add ios` once.
5. Run `npm run ios`.

The app ID is `com.xrpet.companion`.

The current mobile shell packages the PWA assets. Live Ripple/XRP/XRPL data still comes from the XRPet backend service. Store signing, screenshots, privacy disclosures, developer accounts, and final submission remain store-account steps.

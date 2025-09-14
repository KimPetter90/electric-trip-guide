# ElRoute - Mobilapp Byggeveiledning

## Oversikt
ElRoute er en gratis offline ruteplanlegger for elbiler som kan bygges som en ekte mobilapp.

## Funksjoner
- ✅ 100% offline funksjonalitet
- ✅ Lagring av favorittbiler og ruter
- ✅ GPS-posisjonering
- ✅ 25+ elbilmodeller inkludert
- ✅ Eksport/backup av data
- ✅ Norsk språk

## Byggeveiledning

### Forutsetninger
- Node.js (versjon 16+)
- For Android: Android Studio
- For iOS: Mac med Xcode

### Steg 1: Klon prosjektet
```bash
# Eksporter fra Lovable til GitHub først
git clone [din-github-repo-url]
cd [prosjekt-navn]
```

### Steg 2: Installer avhengigheter
```bash
npm install
```

### Steg 3: Bygg web-versjon
```bash
npm run build
```

### Steg 4: Legg til mobilplattformer

For Android:
```bash
npx cap add android
npx cap update android
```

For iOS:
```bash
npx cap add ios
npx cap update ios
```

### Steg 5: Sync og bygg
```bash
npx cap sync
```

### Steg 6: Åpne i native IDE

For Android:
```bash
npx cap run android
```

For iOS:
```bash
npx cap run ios
```

## App-informasjon
- **App ID**: app.lovable.9a7124bc51c642209c3ea9b0a99b385b
- **App Navn**: ElRoute
- **Versjon**: 1.0.0
- **Plattformer**: Android 7.0+, iOS 12.0+

## Distribusjon

### Android (Google Play Store)
1. Signer APK/AAB med production keystore
2. Upload til Google Play Console
3. Fyll ut app-informasjon og screenshots
4. Submit for review

### iOS (App Store)
1. Konfigurer App Store Connect
2. Archive i Xcode
3. Upload til TestFlight
4. Submit for App Store review

### Direkte distribusjon (APK)
- Bygg signed APK for direkte nedlasting
- Krev "Ukjente kilder" aktivert på Android

## Sikkerhet og personvern
- All data lagres lokalt på enheten
- Ingen data sendes til eksterne servere
- Ingen brukerregistrering påkrevd
- Full GDPR-kompatibel

## Teknisk stack
- React + TypeScript
- Tailwind CSS
- Capacitor (native capabilities)
- Local Storage (offline data)

## Kontakt
For support eller spørsmål om appen.
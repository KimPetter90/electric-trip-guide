# ElRoute - App Release Checklist

## Pre-Release Checklist (Til gjennomgang)

### ✅ Funksjonalitet testet
- [ ] Alle elbilmodeller lastes riktig
- [ ] Ruteplanlegging fungerer
- [ ] Offline lagring av favoritter
- [ ] GPS-posisjonering
- [ ] Eksport av data
- [ ] App innstillinger

### ✅ Design og UX
- [ ] Responsiv design på alle skjermstørrelser
- [ ] Mørk/lys tema fungerer
- [ ] Animasjoner kjører smooth
- [ ] Tekst er leselig på alle enheter
- [ ] Ikoner og bilder ser bra ut

### ✅ Teknisk
- [ ] Bygger uten feil på Android
- [ ] Bygger uten feil på iOS
- [ ] Ingen console errors
- [ ] PWA manifest er korrekt
- [ ] Capacitor plugins fungerer

### ✅ Innhold og språk
- [ ] All tekst er på norsk
- [ ] Ingen stavefeil
- [ ] Appen beskrivelse er korrekt
- [ ] Instruksjoner er tydelige

### ✅ Store-klargjøring
- [ ] App ikoner (alle størrelser)
- [ ] Screenshots for Play Store/App Store
- [ ] App beskrivelse og funksjoner
- [ ] Personvernserklæring
- [ ] Bruksvilkår

## Når du er klar for publisering:

1. **Sett versjonsnummer**: Oppdater til 1.0.0 i capacitor.config.ts
2. **Generer signerte builds**: For produksjonsdistribusjon
3. **Test på ekte enheter**: Installer APK/IPA og test grundig
4. **Forbered store-assets**: Ikoner, screenshots, beskrivelse
5. **Submit til stores**: Google Play og/eller App Store

## Potensielle problemer å sjekke:
- [ ] App permissions (GPS, storage)
- [ ] Offline funksjonalitet uten nett
- [ ] Battery usage optimization
- [ ] Large screen support (tablets)
- [ ] Accessibility (tekststørrelse, kontrast)

## Neste steg:
1. Gå gjennom hele appen manuelt
2. Test på ulike enheter hvis mulig
3. Gi feedback på hva som må endres
4. Deretter kan vi publisere!
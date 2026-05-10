# my-banks

## Start the App

Install dependencies first:

```bash
npm install
```

Start Expo with tunnel:

```bash
npm run tunnel
```

Then scan the QR code shown in the terminal using Expo Go on your phone.

If tunnel fails with `failed to start tunnel` or `remote gone away`, try clearing Expo's cache:

```bash
npm run tunnel -- --clear
npx expo start --lan
```

If it still fails, use LAN mode while your phone and computer are on the same Wi-Fi:

```bash
npm run lan
```

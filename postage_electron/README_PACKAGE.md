## To package PgManage with Electron
1. You need to compile pgmanage.
2. Run `update.bat` (Windows) or `update.sh` (macOS/Linux)
3. run these commands:
```
npm install
cd app
npm install
cd ..
npm run dist     # macOS/Linux
npm run dist-win # Windows
```

On windows, you will get a .exe in dist/

On Linux you will get a .rpm and a .deb in your host arch in dist/

On macOS you will get a .dmg in dist/

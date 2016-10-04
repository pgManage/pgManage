del /S /Q postage
mkdir postage
mkdir postage\web_root
mkdir postage\config
xcopy ..\visualstudio\Release\postage.exe postage\
xcopy ..\visualstudio\lib\x86\* postage\
xcopy ..\postage\web_root postage\web_root /E
xcopy ..\postage\config postage\config /E

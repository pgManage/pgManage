del /S /Q app\postage
mkdir app\postage
mkdir app\postage\web_root
mkdir app\postage\config
xcopy ..\visualstudio\Release\postage.exe app\postage\
xcopy ..\visualstudio\lib\x86\* app\postage\
xcopy ..\postage\web_root app\postage\web_root /E
xcopy ..\postage\config app\postage\config /E

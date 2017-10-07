del /S /Q app\pgmanage
mkdir app\pgmanage
mkdir app\pgmanage\web_root
mkdir app\pgmanage\config
xcopy ..\visualstudio\Release\pgmanage.exe app\pgmanage\
xcopy ..\visualstudio\lib\x86\* app\pgmanage\
xcopy ..\src\web_root app\pgmanage\web_root /E
xcopy ..\src\config app\pgmanage\config /E

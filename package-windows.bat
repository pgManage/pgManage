C:\Users\nunzio\AppData\Local\Programs\Git\bin\git.exe pull

msbuild visualstudio\postage.sln /target:"postage:Clean" /verbosity:normal /p:Configuration=Release
msbuild visualstudio\postage.sln /target:postage /verbosity:normal /p:Configuration=Release
cd postage_electron

del /S /Q app\postage
mkdir app\postage
mkdir app\postage\web_root
mkdir app\postage\config
xcopy ..\visualstudio\Release\postage.exe app\postage\
xcopy ..\visualstudio\lib\x86\* app\postage\
xcopy ..\src\web_root app\postage\web_root /E
xcopy ..\src\config app\postage\config /E

npm run dist-win

cd ..

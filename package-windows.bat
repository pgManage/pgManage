C:\Users\nunzio\AppData\Local\Programs\Git\bin\git.exe pull

msbuild visualstudio\pgmanage.sln /target:"pgmanage:Clean" /verbosity:normal /p:Configuration=Release
msbuild visualstudio\pgmanage.sln /target:pgmanage /verbosity:normal /p:Configuration=Release
cd pgmanage_electron

del /S /Q app\pgmanage
mkdir app\pgmanage
mkdir app\pgmanage\web_root
mkdir app\pgmanage\config
xcopy ..\visualstudio\Release\pgmanage.exe app\pgmanage\
xcopy ..\visualstudio\lib\x86\* app\pgmanage\
xcopy ..\src\web_root app\pgmanage\web_root /E
xcopy ..\src\config app\pgmanage\config /E
rename app\pgmanage\config\pgmanage.conf.win32 pgmanage.conf

npm run dist-win

cd ..

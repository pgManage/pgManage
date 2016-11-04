rmdir /S /Q app\envelope
mkdir app\envelope
mkdir app\envelope\config
mkdir app\envelope\web_root
mkdir app\envelope\postgresql
xcopy ..\visualstudio\Release\envelope.exe app\envelope\
xcopy ..\visualstudio\lib\x86\* app\envelope\
xcopy .\web_root app\envelope\web_root /E
xcopy ..\envelope\config\envelope.conf app\envelope\config\envelope.conf /E
xcopy .\postgresql-portable-windows app\envelope\postgresql /E

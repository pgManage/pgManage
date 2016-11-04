rmdir /S /Q app\postcard
mkdir app\postcard
mkdir app\postcard\web_root
mkdir app\postcard\postgresql
xcopy .\web_root app\postcard\web_root /E
xcopy ..\postcard\config\postcard.conf app\postcard\config\postcard.conf /E
xcopy .\postgresql-portable-windows app\postcard\postgresql /E

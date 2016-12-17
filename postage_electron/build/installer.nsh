!macro customInit
IfFileExists /Windows/System/ucrtbase.dll done done1
done1:
	IfFileExists /Windows/System32/ucrtbase.dll done done2
done2:
	IfFileExists /Windows/SysWOW64/ucrtbase.dll done quit
quit:
	MessageBox MB_OK|MB_ICONSTOP "To install Postage, you need to install the Universal CRT.$\nPress OK to open the download page."
	ExecShell "open" "https://support.microsoft.com/en-us/kb/2999226"
	Abort
done:
!macroend

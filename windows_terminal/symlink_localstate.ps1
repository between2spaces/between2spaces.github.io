Remove-Item -Path $Env:LocalAppData\Packages\Microsoft.WindowsTerminalPreview_8wekyb3d8bbwe\LocalState -Force -Recurse
New-Item -ItemType SymbolicLink -Path "$Env:LocalAppData\Packages\Microsoft.WindowsTerminalPreview_8wekyb3d8bbwe\LocalState" -Target "\\wsl$\Ubuntu-20.04\home\scarmody\between2spaces.github.io\windows_terminal"
 

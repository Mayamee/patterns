# Текущая папка в которой лежит текущий скрипт powershell
$CurrentPath = Split-Path -Parent $MyInvocation.MyCommand.Definition
$AutoLinks = Join-Path -Path $CurrentPath -ChildPath "autolaunch"
$Links = Join-Path -Path $CurrentPath -ChildPath "links"
# Запуск всех файлов .lnk в папке autolaunch
Get-ChildItem $AutoLinks -Filter *.lnk | ForEach-Object { Start-Process $_.FullName }
# Открытие фронтовой репы
code $env:AWR_FRONTEND --profile Ymm
# Коннект в VPN
Start-Process -FilePath $(Join-Path -Path $Links -ChildPath "openvpnAstral.lnk")
param (
    [string]$appName
)

$app = Get-StartApps | Where-Object { $_.Name -match $appName } | Select-Object -First 1

if ($app) {
    explorer "shell:AppsFolder\$($app.AppID)"
    exit 0
}

$lnk = Get-ChildItem -Path "$env:ProgramData\Microsoft\Windows\Start Menu\Programs", "$env:APPDATA\Microsoft\Windows\Start Menu\Programs", "$env:USERPROFILE\Desktop" -Filter "*$appName*.lnk" -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1

if ($lnk) {
    Invoke-Item $lnk.FullName
    exit 0
}

start $appName

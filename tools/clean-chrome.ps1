$procs = Get-CimInstance Win32_Process -Filter "Name='chrome.exe'"
$headless = @(); $other = @()
foreach ($p in $procs) {
  $cl = $p.CommandLine
  if ($cl -match 'swiftshader|no-sandbox|headless|remote-debugging') { $headless += $p.ProcessId }
  else { $other += "{0} :: {1}" -f $p.ProcessId, $cl.Substring(0, [Math]::Min(100, $cl.Length)) }
}
Write-Output ("HEADLESS_COUNT=" + $headless.Count)
Write-Output ("OTHER_COUNT=" + $other.Count)
foreach ($o in $other) { Write-Output ("OTHER: " + $o) }
if ($other.Count -eq 0 -and $headless.Count -gt 0 -and $env:KILL -eq '1') {
  foreach ($id in $headless) { Stop-Process -Id $id -Force -ErrorAction SilentlyContinue }
  Write-Output "KILLED=" + $headless.Count
}

"""Build the Windows package without secrets or downloads; preserve old bundles."""
import argparse
import hashlib
import json
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile

ROOT = Path(__file__).resolve().parents[1]
START = r'''@echo off
setlocal
cd /d "%~dp0"
if /I not "%COMPUTERNAME%"=="DESKTOP-BNPIVK2" goto wronghost
if not "%OS%"=="Windows_NT" goto wronghost
for %%F in (disable_obsidian_autosync.ps1 diagnose_remote_desktop_commander.ps1 obsidian-recovery.mjs) do (
  if not exist "%~dp0scripts\%%F" goto incomplete
)
if not defined LOCALAPPDATA goto incomplete
if not exist "%LOCALAPPDATA%\MagicMetalObsidianSync" mkdir "%LOCALAPPDATA%\MagicMetalObsidianSync"
echo Disabling note-sync timers and login shortcuts. Keeping Remote access.
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\disable_obsidian_autosync.ps1" -Apply > "%LOCALAPPDATA%\MagicMetalObsidianSync\manual-sync-disable.log" 2>&1
set "SYNC_EXIT=%ERRORLEVEL%"
type "%LOCALAPPDATA%\MagicMetalObsidianSync\manual-sync-disable.log"
echo.
echo Checking existing Obsidian and Remote. An existing Remote will not restart.
echo If a new Remote window needs authorization, use its NEW link only.
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\diagnose_remote_desktop_commander.ps1" -Action Recover
set "RECOVERY_EXIT=%ERRORLEVEL%"
echo.
echo Disable-sync result: %SYNC_EXIT% ; Local diagnosis result: %RECOVERY_EXIT%
echo A nonzero result needs review. No ChatGPT connection is claimed by this program.
echo Logs: %LOCALAPPDATA%\MagicMetalObsidianSync
echo Remote process and local API do not prove ChatGPT tool availability.
echo Work-stage notes must be saved by the working AI chat, then read back.
pause
if not "%SYNC_EXIT%"=="0" exit /b %SYNC_EXIT%
exit /b %RECOVERY_EXIT%
:wronghost
echo This package is for Windows DESKTOP-BNPIVK2 only. Nothing changed.
pause
exit /b 5
:incomplete
echo Extract the entire ZIP first. Required files or LOCALAPPDATA are missing.
pause
exit /b 4
'''

README = '''Magic Metal — проверка Obsidian и отмена фоновой синхронизации

1. Распакуйте ВЕСЬ архив в отдельную папку на DESKTOP-BNPIVK2.
2. Дважды нажмите START.cmd. Права администратора обычно не нужны.
3. Дождитесь результата. Если программа запустила отсутствующий Remote,
   оставьте его окно работающим; оно может ожидать штатную авторизацию.

Программа отключает только MagicMetal Catalog Sync и переносит ярлыки
MagicMetal Catalog Sync.lnk / MagicMetal Obsidian Sync.lnk из автозагрузки
в резервную папку. Содержимое резервных ярлыков проверяется по SHA-256.
Задание MagicMetal Remote Connection и ярлык Desktop Commander сохраняются.
Уже запущенная синхронизация не прерывается во время записи.
Это отключение известных настроек текущего пользователя, не аудит всех
возможных системных заданий/служб и не удаление файлов Obsidian.

Затем проверяется существующий Node.js, запускается установленный Obsidian,
если он закрыт, и проверяется локальный защищённый REST API.
Работающий Remote не перезапускается и не дублируется. Если Remote отсутствует,
используется официальный клиент, закреплённый в проверенном сценарии.
Сохранённая сессия и ключи не удаляются; старая ссылка подтверждения не открывается.

Отчёты: %LOCALAPPDATA%\\MagicMetalObsidianSync\\manual-sync-disable.log
и recovery-report.json. JSON создаётся только если смог запуститься Node;
сверяйте checkedAt, старый отчёт не является результатом нового запуска.
Ненулевой код не означает, что ничего не изменилось: часть отключений могла
завершиться до ошибки; журнал показывает выполненные шаги.
Для отката задания: включить MagicMetal Catalog Sync в Планировщике.
Для отката ярлыков: переместить нужные .lnk из disabled-startup обратно
в папку shell:startup. Автоматический откат по новому правилу не выполняется.

После каждого этапа работающий ИИ-чат должен записать результат в Obsidian
и прочитать его обратно. Эта программа не определяет границы этапов,
не пишет заметки и не добавляет плагины в ChatGPT.
Локальный успех не доказывает доступ данного чата или работоспособность всех связок.

Секреты из чата не используются: ключ REST читается только из локального
плагина в памяти процесса. Содержимое заметок и ключи не выводятся.
Реальное исполнение этого пакета на вашем Windows пока не подтверждено.
'''

def build(output):
    names = [
        'scripts/disable_obsidian_autosync.ps1',
        'scripts/diagnose_remote_desktop_commander.ps1',
        'scripts/obsidian-recovery.mjs',
    ]
    payload = {name: (ROOT / name).read_bytes() for name in names}
    payload['START.cmd'] = START.replace('\n', '\r\n').encode('ascii')
    payload['ПРОЧИТАЙТЕ.txt'] = README.replace('\n', '\r\n').encode('utf-8-sig')
    manifest = {
        'purpose': 'Disable known note-sync triggers and diagnose existing local access',
        'realWindowsVerified': False,
        'chatgptConnectionVerified': False,
        'files': {name: hashlib.sha256(data).hexdigest() for name, data in payload.items()},
    }
    payload['manifest.json'] = json.dumps(manifest, indent=2, ensure_ascii=False).encode('utf-8')
    output.parent.mkdir(parents=True, exist_ok=True)
    with ZipFile(output, 'w', ZIP_DEFLATED) as archive:
        for name, data in payload.items():
            archive.writestr(name, data)
    with ZipFile(output) as archive:
        assert archive.testzip() is None
        for name, digest in manifest['files'].items():
            assert hashlib.sha256(archive.read(name)).hexdigest() == digest
    print(json.dumps({'file': str(output), 'files': len(payload), 'sha256': hashlib.sha256(output.read_bytes()).hexdigest()}))

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--out', type=Path, required=True)
    build(parser.parse_args().out)

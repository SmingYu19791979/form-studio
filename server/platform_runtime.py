"""Resolve the target computer's Codex installation without copying credentials."""
import functools,os,shutil,signal,subprocess,sys
from pathlib import Path

def codex_home():
    return Path(os.environ.get('CODEX_HOME',str(Path.home()/'.codex'))).expanduser()

def resolve_codex(environ=None,system=None,which=None):
    environ=os.environ if environ is None else environ
    system=sys.platform if system is None else system
    which=shutil.which if which is None else which
    home=Path(environ.get('HOME') or environ.get('USERPROFILE') or str(Path.home()))
    candidates=[]
    if environ.get('FORM_CODEX_PATH'):candidates.append(Path(environ['FORM_CODEX_PATH']).expanduser())
    found=which('codex')
    if found:candidates.append(Path(found))
    if system=='darwin':
        for base in [Path('/Applications'),home/'Applications']:
            candidates.extend([base/'ChatGPT.app/Contents/Resources/codex-cli/CodexCLI.app/Contents/MacOS/codex',base/'Codex.app/Contents/Resources/codex'])
    if system=='win32':
        local=Path(environ.get('LOCALAPPDATA',str(home/'AppData/Local')))
        candidates.extend([local/'Programs/OpenAI/Codex/bin/codex.exe',home/'.local/bin/codex.exe'])
    else:candidates.extend([home/'.local/bin/codex',home/'.cargo/bin/codex',Path('/opt/homebrew/bin/codex'),Path('/usr/local/bin/codex')])
    for path in candidates:
        if not path.is_file():continue
        if system=='win32' and path.suffix.lower() in {'.cmd','.bat','.ps1'}:
            # Avoid cmd.exe interpolation. npm's wrapper can be launched safely through node.exe.
            script=path.parent/'node_modules/@openai/codex/bin/codex.js'
            node=which('node')
            if script.is_file() and node:return [node,str(script)]
            continue
        return [str(path)]
    return []

def worker_environment(config):
    allowed={'PATH','HOME','USERPROFILE','SYSTEMROOT','WINDIR','COMSPEC','PATHEXT','APPDATA','LOCALAPPDATA','TEMP','TMP','TMPDIR','LANG','LC_ALL','SSL_CERT_FILE','SSL_CERT_DIR','HTTPS_PROXY','HTTP_PROXY','ALL_PROXY','NO_PROXY','CODEX_HOME'}
    env={k:v for k,v in os.environ.items() if k.upper() in allowed}
    provider=config.get('model_providers',{}).get(config.get('model_provider','openai'),{})
    key_name=provider.get('env_key')
    if key_name and key_name in os.environ:env[key_name]=os.environ[key_name]
    env.update(NO_COLOR='1',PYTHONUTF8='1')
    return env

def stop_worker(proc):
    """Stop only the isolated process tree created for this modeling job."""
    if proc.poll() is not None:return
    if os.name=='nt':
        taskkill=Path(os.environ.get('SystemRoot','C:/Windows'))/'System32/taskkill.exe'
        try:subprocess.run([str(taskkill),'/PID',str(proc.pid),'/T','/F'],capture_output=True,timeout=10)
        except (OSError,subprocess.SubprocessError):proc.terminate()
    else:
        try:os.killpg(proc.pid,signal.SIGTERM)
        except ProcessLookupError:pass
        except OSError:proc.terminate()

@functools.lru_cache(maxsize=4)
def codex_capabilities(command):
    def run(*args):
        return subprocess.run([*command,*args],capture_output=True,text=True,encoding='utf-8',errors='replace',timeout=15)
    root=run('--help');execute=run('exec','--help');features=run('features','list')
    required=['--output-schema','--output-last-message','--image','--json','--ephemeral','--sandbox','--skip-git-repo-check']
    missing=[flag for flag in required if flag not in execute.stdout]
    if '--search' not in root.stdout:missing.append('--search')
    return {'compatible':not missing and root.returncode==0 and execute.returncode==0,'missing':missing,'noDaemon':'--no-daemon' in root.stdout,'features':{line.split()[0] for line in features.stdout.splitlines() if line.split()} if features.returncode==0 else set()}

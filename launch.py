#!/usr/bin/env python3
"""Portable FORM launcher. Standard library only, Python 3.11 or newer."""
import argparse,json,os,socket,subprocess,sys,signal,time,urllib.error,urllib.request,webbrowser
from pathlib import Path
ROOT=Path(__file__).resolve().parent

def local_health(url,timeout=3):
    # Health checks are loopback-only; never forward them to a system HTTP proxy.
    opener=urllib.request.build_opener(urllib.request.ProxyHandler({}))
    with opener.open(url+'api/health',timeout=timeout) as response:return json.load(response)

def main():
    if hasattr(sys.stdout,'reconfigure'):sys.stdout.reconfigure(encoding='utf-8',errors='replace')
    if sys.version_info<(3,11):print('需要 Python 3.11 或更新版本：https://www.python.org/downloads/');return 1
    try:default_port=int(json.loads((ROOT/'dist/studio-config.json').read_text(encoding='utf-8')).get('port',8765))
    except (OSError,ValueError,TypeError):default_port=8765
    parser=argparse.ArgumentParser(description='FORM 产品布景工作台 · 便携启动器')
    parser.add_argument('--port',type=int,default=default_port);parser.add_argument('--check',action='store_true');parser.add_argument('--no-browser',action='store_true');args=parser.parse_args()
    if not 1024<=args.port<=65535:parser.error('端口范围 1024–65535')
    os.chdir(ROOT)
    if sys.platform=='darwin':os.environ['PATH']=os.pathsep.join([str(Path.home()/'.local/bin'),'/opt/homebrew/bin','/usr/local/bin',os.environ.get('PATH','')])
    sys.path.insert(0,str(ROOT/'server'))
    from platform_runtime import resolve_codex,codex_capabilities
    print('FORM 产品布景工作台 1.2.1\nPython:',sys.version.split()[0])
    codex=resolve_codex();compatible=False
    if codex:
        print('Codex: 已找到')
        try:
            capabilities=codex_capabilities(tuple(codex));compatible=capabilities['compatible']
            print('建模能力检查:', '通过' if compatible else '请更新 Codex CLI（缺少 '+', '.join(capabilities['missing'])+'）')
            result=subprocess.run([*codex,'login','status'],capture_output=True,text=True,encoding='utf-8',errors='replace',timeout=15)
            print('Codex 登录:', '已登录' if result.returncode==0 else '未确认，请先在终端运行 codex 并完成登录')
        except (OSError,subprocess.SubprocessError):print('Codex 检查未完成，请在终端运行 codex 确认安装。')
    else:print('Codex: 未安装或未找到。已有模型可编辑；生成新品需要安装并登录。')
    print('安装与登录说明：https://learn.chatgpt.com/docs/codex/cli')
    missing=[name for name in ['dist/index.html','dist/assets/three.js','server/recipe-schema.json','server/modeling-prompt.txt'] if not (ROOT/name).is_file()]
    if missing:print('应用包不完整，请完整解压后启动：'+', '.join(missing));return 1
    # Fail early on read-only media, which cannot hold scene backups or generation jobs.
    try:
        runtime=ROOT/'runtime';runtime.mkdir(exist_ok=True);probe=runtime/'.write-test';probe.write_text('ok',encoding='utf-8');probe.unlink()
    except OSError:print('应用文件夹不可写。请先解压到当前账户的文档文件夹，不要直接在ZIP内运行。');return 1
    print('文件与保存目录检查: 通过')
    if args.check:return 0
    port=args.port;url=f'http://localhost:{port}/'
    try:
        with socket.socket() as probe:probe.bind(('127.0.0.1',port))
    except OSError:
        try:
            health=local_health(url)
            if health.get('service')=='form-modeling':
                if 'product-text-input' not in health.get('capabilities',[]):
                    print('此端口仍在运行旧版工作台。请在原启动窗口按 Ctrl+C 后重新启动，或指定其他端口。');return 1
                print('此端口已有工作台运行。继续使用现有工作台；若要运行本文件夹，请关闭旧窗口或使用 --port 8766。')
                if not args.no_browser:webbrowser.open(url)
                return 0
        except (OSError,ValueError):pass
        print(f'端口{port}被其他应用占用。请关闭占用程序，或运行 python launch.py --port 8766。');return 1
    server=subprocess.Popen([sys.executable,'-X','utf8',str(ROOT/'server/studio_server.py'),'--port',str(port)],cwd=ROOT,start_new_session=os.name!='nt',creationflags=getattr(subprocess,'CREATE_NEW_PROCESS_GROUP',0) if os.name=='nt' else 0)
    try:
        for _ in range(50):
            if server.poll() is not None:return server.returncode or 1
            try:
                if local_health(url,timeout=.5).get('service')=='form-modeling':break
            except (OSError,ValueError):time.sleep(.1)
        else:print('本机服务启动未完成，请检查上方错误。');return 1
        print('\n工作台：'+url+'\n请保持这个窗口开启；停止服务请按 Ctrl+C。')
        if not args.no_browser:webbrowser.open(url)
        return server.wait()
    except KeyboardInterrupt:return 0
    finally:
        if server.poll() is None:
            if os.name=='nt':server.send_signal(signal.CTRL_BREAK_EVENT)
            else:server.terminate()
            try:server.wait(timeout=8)
            except subprocess.TimeoutExpired:
                from platform_runtime import stop_worker
                stop_worker(server);server.wait(timeout=5)

if __name__=='__main__':raise SystemExit(main())

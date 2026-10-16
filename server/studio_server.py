"""Loopback-only product studio with an asynchronous, data-only Codex modeling worker."""
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from urllib.parse import urlparse
import argparse, base64, copy, hashlib, json, math, os, queue, re, shutil, subprocess, threading, time, uuid, tomllib, signal
from recipe_schema import SCHEMA
from platform_runtime import resolve_codex,codex_home,worker_environment,codex_capabilities,stop_worker
os.umask(0o077)
ROOT=Path(__file__).resolve().parents[1]
DIST=ROOT/'dist'; JOBS=ROOT/'runtime/jobs'; JOBS.mkdir(parents=True,exist_ok=True)
CODEX_COMMAND=resolve_codex()
PROJECT=ROOT/'runtime/current-project.json'
PROMPT=(ROOT/'server/modeling-prompt.txt').read_text(encoding='utf-8')
LOCK=threading.RLock(); JOB_MAP={}; PROCESSES={}; TASKS=queue.Queue(); STOP=threading.Event()
TERMINAL={'complete','failed','cancelled'}

def validate(value,schema,path='$'):
    if 'anyOf' in schema:
        for child in schema['anyOf']:
            try: validate(value,child,path);return
            except ValueError: pass
        raise ValueError(path+' does not match a supported geometry')
    types=schema.get('type');types=types if isinstance(types,list) else [types]
    kind='null' if value is None else 'boolean' if isinstance(value,bool) else 'integer' if isinstance(value,int) else 'number' if isinstance(value,float) else 'string' if isinstance(value,str) else 'array' if isinstance(value,list) else 'object' if isinstance(value,dict) else 'unknown'
    if kind not in types and not(kind=='integer' and 'number' in types): raise ValueError(path+' invalid type')
    if 'enum' in schema and value not in schema['enum']:raise ValueError(path+' invalid option')
    if kind in {'number','integer'}:
        if not math.isfinite(value) or value<schema.get('minimum',-math.inf) or value>schema.get('maximum',math.inf):raise ValueError(path+' invalid number')
    if kind=='string':
        if len(value)>schema.get('maxLength',100000):raise ValueError(path+' string too long')
        if schema.get('pattern') and not re.match(schema['pattern'],value):raise ValueError(path+' invalid format')
    if kind=='array':
        if not schema.get('minItems',0)<=len(value)<=schema.get('maxItems',100000):raise ValueError(path+' invalid array size')
        for i,child in enumerate(value):validate(child,schema['items'],f'{path}[{i}]')
    if kind=='object':
        props=schema['properties']
        if any(k not in value for k in schema.get('required',[])) or (schema.get('additionalProperties') is False and any(k not in props for k in value)):raise ValueError(path+' invalid fields')
        for k,child in value.items():
            if k in props:validate(child,props[k],path+'.'+k)

def validate_recipe(recipe,web_used=True):
    validate(recipe,SCHEMA)
    if recipe['status']!='ready':raise ValueError('未找到足够的同版资料，无法可靠建模：'+recipe['research']['summary'][:180])
    if not web_used:raise ValueError('建模代理没有完成实际联网检索，未接受生成结果。')
    if not recipe['research']['sources']:raise ValueError('模型缺少实际参考来源。')
    for source in recipe['research']['sources']:
        parsed=urlparse(source['url'])
        if parsed.scheme not in {'https','http'} or not parsed.hostname:raise ValueError('参考来源不是有效网页。')
    url=recipe['dimensions']['sourceUrl']
    if url and (urlparse(url).scheme not in {'http','https'} or not urlparse(url).hostname):raise ValueError('尺寸参考链接无效。')
    ids=[m['id'] for m in recipe['materials']]
    if len(set(ids))!=len(ids) or any(p['materialId'] not in ids for p in recipe['parts']):raise ValueError('材质分区不完整。')
    for part in recipe['parts']:
        g=part['geometry']
        if g['kind']=='rounded_box' and (min(g['size'])<=0 or g['bevel']>=min(g['size'])/2):raise ValueError('圆角部件尺寸无效。')
        if g['kind'] in {'lathe','loft'}:
            rings=g.get('points',g.get('rings'))
            if max(r['y'] for r in rings)-min(r['y'] for r in rings)<=0:raise ValueError('部件轮廓没有高度。')
            if g['kind']=='loft' and any(b['y']<a['y'] for a,b in zip(rings,rings[1:])):raise ValueError('截面顺序无效。')
    for label in recipe['labels']:
        x,y,w,h=label['sourceRect']
        if label['mode']=='source_ink' and (w<=0 or h<=0 or x+w>1.001 or y+h>1.001):raise ValueError('原图印刷范围无效。')
        if label['surface']=='cylinder' and label['radius']<=0:raise ValueError('曲面印刷半径无效。')

def normalize_recipe(recipe):
    # Match Three.js' existing bevel limit. A thin nozzle insert must not invalidate the entire product.
    # Check the full data schema before touching values; malformed or unsupported data still fails closed.
    validate(recipe,SCHEMA)
    recipe=copy.deepcopy(recipe);adjustments=[]
    for part in recipe['parts']:
        g=part['geometry']
        if g['kind']=='rounded_box':
            if min(g['size'])<=0:raise ValueError('圆角部件尺寸必须大于零。')
            limit=min(g['size'])*.49
            if g['bevel']>limit:
                adjustments.append({'part':part['name'],'parameter':'bevel','requested':g['bevel'],'applied':limit,'reason':'按部件最小厚度限制圆角，和 Three.js 构建器保持一致。'})
                g['bevel']=limit
    return recipe,adjustments

def complete_recipe(job,recipe,web_used):
    recipe,adjustments=normalize_recipe(recipe);validate_recipe(recipe,web_used)
    path=JOBS/job['id'];target=path/'result.json'
    if adjustments and target.exists() and not (path/'agent-result.json').exists():shutil.copyfile(target,path/'agent-result.json')
    temp=path/'result.tmp';temp.write_text(json.dumps(recipe,ensure_ascii=False),encoding='utf-8');temp.replace(target)
    update(job,status='complete',phase='complete',message='专属模型方案已完成，即将加入场景。',productName=recipe['identity']['name'],sources=recipe['research']['sources'],dimensions=recipe['dimensions'],webVerified=web_used,geometryAdjustments=adjustments)

def recover_researched_result(job):
    # Used only after an explicit import/retry of the same image. Reuse completed research instead of repeating it.
    path=JOBS/job['id']
    try:
        web_used=False
        with (path/'events.jsonl').open(encoding='utf-8') as trace:
            for line in trace:
                try:event=json.loads(line)
                except ValueError:continue
                if event.get('type')=='item.completed' and 'web_search' in event.get('item',{}).get('type',''):web_used=True
        recipe=json.loads((path/'result.json').read_text(encoding='utf-8'))
        complete_recipe(job,recipe,web_used)
        return True
    except (OSError,ValueError,KeyError,TypeError):return False

def public(job):return {k:v for k,v in job.items() if k not in {'source','recipe','raw_error'}}
def validate_project(project):
    if not isinstance(project,dict) or project.get('format')!='form-product-studio' or project.get('version')!=1:raise ValueError('布景格式不受支持。')
    root=project.get('objects',{}).get('object',{})
    if not isinstance(root,dict) or len(root.get('children',[]))>30:raise ValueError('布景对象无效或超过30个。')
    for image in project.get('objects',{}).get('images',[]):
        urls=image.get('url',[]);urls=urls if isinstance(urls,list) else [urls]
        if any(not isinstance(url,str) or not url.startswith('data:image/') for url in urls):raise ValueError('布景必须内嵌图片，不能依赖其他电脑的外部路径。')

def save_project(project):
    validate_project(project);PROJECT.parent.mkdir(parents=True,exist_ok=True)
    with LOCK:
        temp=PROJECT.with_suffix('.tmp');temp.write_text(json.dumps(project,ensure_ascii=False),encoding='utf-8');temp.replace(PROJECT)
def persist(job):
    path=JOBS/job['id'];path.mkdir(exist_ok=True)
    temp=path/'state.tmp';temp.write_text(json.dumps(public(job),ensure_ascii=False),encoding='utf-8');temp.replace(path/'state.json')
def update(job,**fields):
    with LOCK:job.update(fields,updatedAt=time.time());persist(job)

def load_jobs():
    for path in JOBS.glob('*/state.json'):
        try:
            job=json.loads(path.read_text(encoding='utf-8'));jobid=job['id']
            if not re.fullmatch('[a-f0-9]{32}',jobid):continue
            if job['status'] not in TERMINAL:job.update(status='failed',phase='failed',message='本机服务已重启，可重试此任务。')
            JOB_MAP[jobid]=job
        except (OSError,ValueError,KeyError):continue

def worker():
    while not STOP.is_set():
        jobid=TASKS.get()
        if jobid is None:return
        job=JOB_MAP[jobid]
        if job['status']=='cancelled':TASKS.task_done();continue
        path=JOBS/jobid;result=path/'result.json'
        update(job,status='running',phase='identifying',message='Codex 正在识别图片中的产品、版本与容量。')
        # The worker can search and return a recipe. It cannot execute shell commands, edit app files or start other agents.
        proc=None;raw_error='';timer=None
        try:
            if not CODEX_COMMAND:raise RuntimeError('未找到本机 Codex，请先运行环境检查并安装登录。')
            capabilities=codex_capabilities(tuple(CODEX_COMMAND))
            if not capabilities['compatible']:raise RuntimeError('本机 Codex CLI 版本缺少所需能力，请运行环境检查并更新 Codex。')
            command=[*CODEX_COMMAND]
            if capabilities['noDaemon']:command.append('--no-daemon')
            command+=['--search','-a','never','exec','--sandbox','read-only','--ephemeral','--skip-git-repo-check']
            for feature in ['shell_tool','multi_agent','apps','plugins','hooks','browser_use','computer_use']:
                if feature in capabilities['features']:command+=['--disable',feature]
            command+=['--json','--output-schema',str(ROOT/'server/recipe-schema.json'),'--output-last-message',str(result),'--image',str(path/'input.png'),'-']
            config_path=codex_home()/'config.toml'
            try: config=tomllib.loads(config_path.read_text(encoding='utf-8'))
            except (OSError,ValueError):config={}
            for server_name in config.get('mcp_servers',{}):
                if not re.fullmatch(r'[A-Za-z0-9_-]+',server_name):raise RuntimeError('Codex 外部工具配置名称无效，请检查本机设置。')
                command[len(CODEX_COMMAND):len(CODEX_COMMAND)]=['-c','mcp_servers.'+server_name+'.enabled=false']
            env=worker_environment(config);web_used=False;raw_error='';proc=None
            with (path/'events.jsonl').open('w',encoding='utf-8') as trace, (path/'stderr.log').open('w',encoding='utf-8') as err:
                if job['status']=='cancelled':continue
                proc=subprocess.Popen(command,cwd=path,stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=err,text=True,encoding='utf-8',errors='replace',env=env,bufsize=1,start_new_session=os.name!='nt',creationflags=getattr(subprocess,'CREATE_NEW_PROCESS_GROUP',0) if os.name=='nt' else 0)
                PROCESSES[jobid]=proc
                if job['status']=='cancelled':stop_worker(proc);continue
                def timeout():
                    if proc.poll() is None:job['timedOut']=True;stop_worker(proc)
                timer=threading.Timer(1200,timeout);timer.start()
                proc.stdin.write(PROMPT+json.dumps(job['name'],ensure_ascii=False)+'\n');proc.stdin.close()
                for line in proc.stdout:
                    trace.write(line);trace.flush()
                    try:event=json.loads(line)
                    except ValueError:continue
                    item=event.get('item',{});kind=item.get('type','')
                    if 'web_search' in kind:
                        web_used=True;query=item.get('query') or item.get('action',{}).get('query') or ''
                        update(job,phase='researching',message='正在检索同版官方与多角度资料'+('：'+str(query)[:100] if query else '。'),webSearches=job.get('webSearches',0)+(event.get('type')=='item.started'))
                    elif kind=='agent_message' and event.get('type')=='item.completed':
                        text=item.get('text','')
                        if text.startswith('{'):update(job,phase='modeling',message='已返回专属结构与材质方案，正在校验毫米尺寸。')
                    if event.get('type') in {'error','turn.failed'}:raw_error=str(event.get('message') or event.get('error') or '建模代理运行失败')
                code=proc.wait();timer.cancel()
            if job['status']=='cancelled':continue
            if code or not result.exists():
                raw_error=raw_error or (path/'stderr.log').read_text(encoding='utf-8')[-1800:]
                if job.get('timedOut'):raise RuntimeError('本次建模超过20分钟，可取消后重试。')
                if re.search('auth|unauthor|401|login',raw_error,re.I):raise RuntimeError('Codex 登录或授权已失效，请在本机 Codex 登录后重试。')
                if re.search('quota|rate.limit|429|usage.limit',raw_error,re.I):raise RuntimeError('Codex 当前用量或速率受限，请稍后重试。')
                raise RuntimeError('本机 Codex 未能完成任务。可重试；诊断记录保存在本机任务目录。')
            update(job,phase='validating',message='正在检查结构、材质、文字层和尺寸数据。')
            recipe=json.loads(result.read_text(encoding='utf-8'));complete_recipe(job,recipe,web_used)
        except Exception as e:
            if job['status']!='cancelled':update(job,status='failed',phase='failed',message=str(e)[:500],raw_error=raw_error)
        finally:
            if timer:timer.cancel()
            if proc and proc.poll() is None:stop_worker(proc)
            PROCESSES.pop(jobid,None);TASKS.task_done()

class Handler(SimpleHTTPRequestHandler):
    def __init__(self,*args,**kwargs):super().__init__(*args,directory=str(DIST),**kwargs)
    def log_message(self,fmt,*args):
        if '/api/jobs/' not in str(args[0] if args else ''):super().log_message(fmt,*args)
    def end_headers(self):
        self.send_header('Cache-Control','no-store');super().end_headers()
    def send_json(self,data,code=200):
        raw=json.dumps(data,ensure_ascii=False).encode();self.send_response(code);self.send_header('Content-Type','application/json; charset=utf-8');self.send_header('Content-Length',str(len(raw)));self.send_header('Cache-Control','no-store');self.send_header('X-Content-Type-Options','nosniff');self.end_headers();self.wfile.write(raw)
    def api_allowed(self):
        host=self.headers.get('Host','').split(':')[0]
        if host not in {'localhost','127.0.0.1'}:return False
        origin=self.headers.get('Origin')
        return not origin or origin in {f'http://localhost:{self.server.server_port}',f'http://127.0.0.1:{self.server.server_port}'}
    def do_GET(self):
        path=urlparse(self.path).path
        if path.startswith('/api/'):
            if not self.api_allowed():self.send_json({'error':'仅允许本机工作台访问。'},403);return
            if path=='/api/health':self.send_json({'service':'form-modeling','version':1,'provider':'local-codex','available':bool(CODEX_COMMAND),'jobs':len(JOB_MAP)});return
            if path=='/api/project':
                if not PROJECT.exists():self.send_json({'project':None});return
                self.send_json({'project':json.loads(PROJECT.read_text(encoding='utf-8'))});return
            if path=='/api/jobs':
                with LOCK:self.send_json({'jobs':[public(j) for j in JOB_MAP.values()]})
                return
            match=re.fullmatch('/api/jobs/([a-f0-9]{32})(/result)?',path)
            if match:
                job=JOB_MAP.get(match[1])
                if not job:self.send_json({'error':'任务不存在。'},404);return
                if match[2]:
                    if job['status']!='complete':self.send_json({'error':'任务尚未完成。'},409);return
                    self.send_json({'id':job['id'],'recipe':json.loads((JOBS/job['id']/'result.json').read_text(encoding='utf-8'))});return
                self.send_json(public(job));return
            self.send_json({'error':'接口不存在。'},404);return
        super().do_GET()
    def do_POST(self):
        if not self.api_allowed() or self.headers.get('Content-Type','').split(';')[0]!='application/json':self.send_json({'error':'请求来源或格式无效。'},403);return
        path=urlparse(self.path).path
        try:
            length=int(self.headers.get('Content-Length','0'))
            maximum=(100 if path=='/api/project' else 12)*1024*1024
            if not 0<length<maximum:raise ValueError('请求过大或为空。')
            body=json.loads(self.rfile.read(length))
            if path=='/api/project':save_project(body);self.send_json({'saved':True});return
            if path=='/api/generate':
                name=body.get('name','产品图片')
                if not isinstance(name,str) or len(name)>400:raise ValueError('图片名称无效。')
                source=body.get('source','');match=re.fullmatch(r'data:image/(png|jpeg|webp);base64,([A-Za-z0-9+/=\r\n]+)',source)
                if not match:raise ValueError('需要PNG、JPEG或WEBP图片。')
                raw=base64.b64decode(match[2],validate=True)
                if not 20<len(raw)<8*1024*1024:raise ValueError('图片大小无效。')
                fingerprint=hashlib.sha256(raw+b'\0'+name.encode()).hexdigest()
                with LOCK:
                    existing=next((j for j in JOB_MAP.values() if j['fingerprint']==fingerprint and j['status'] not in {'failed','cancelled'} and not(body.get('force') is True and j['status']=='complete')),None)
                    if existing:self.send_json(public(existing),200);return
                    if body.get('force') is not True:
                        failed=sorted((j for j in JOB_MAP.values() if j['fingerprint']==fingerprint and j['status']=='failed'),key=lambda j:j['createdAt'],reverse=True)
                        for previous in failed:
                            if recover_researched_result(previous):self.send_json(public(previous),200);return
                    if sum(j['status'] not in TERMINAL for j in JOB_MAP.values())>=6:self.send_json({'error':'已有6个任务等待或执行，请稍后再添加。'},429);return
                    jobid=uuid.uuid4().hex;directory=JOBS/jobid;directory.mkdir();(directory/'input.png').write_bytes(raw)
                    job={'id':jobid,'name':name,'fingerprint':fingerprint,'status':'queued','phase':'queued','message':'等待本机 Codex 建模代理。','createdAt':time.time(),'updatedAt':time.time(),'webSearches':0}
                    JOB_MAP[jobid]=job;persist(job);TASKS.put(jobid)
                self.send_json(public(job),202);return
            match=re.fullmatch('/api/jobs/([a-f0-9]{32})/cancel',path)
            if match:
                job=JOB_MAP.get(match[1])
                if not job:self.send_json({'error':'任务不存在。'},404);return
                if job['status'] not in TERMINAL:
                    update(job,status='cancelled',phase='cancelled',message='已取消本次建模。');proc=PROCESSES.get(job['id'])
                    if proc and proc.poll() is None:stop_worker(proc)
                self.send_json(public(job));return
            self.send_json({'error':'接口不存在。'},404)
        except (ValueError,TypeError,KeyError) as e:self.send_json({'error':str(e)[:300]},400)
        except (BrokenPipeError,ConnectionResetError):pass
        except Exception:self.send_json({'error':'本机任务服务发生错误，可重试。'},500)

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--port',type=int,default=8765);args=parser.parse_args();load_jobs();threading.Thread(target=worker,daemon=True).start();server=ThreadingHTTPServer(('127.0.0.1',args.port),Handler);print(f'FORM studio + Codex modeling: http://localhost:{args.port}/',flush=True)
    def interrupt(signum,frame):raise KeyboardInterrupt
    signal.signal(signal.SIGTERM,interrupt)
    if hasattr(signal,'SIGBREAK'):signal.signal(signal.SIGBREAK,interrupt)
    try:server.serve_forever()
    except KeyboardInterrupt:pass
    finally:
        STOP.set();TASKS.put(None)
        for proc in list(PROCESSES.values()):
            if proc.poll() is None:stop_worker(proc)
        server.server_close()
if __name__=='__main__':main()

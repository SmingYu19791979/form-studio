"""Build an allowlisted portable release; never copy local authentication/config/log files."""
import argparse,hashlib,json,os,re,shutil,stat,sys,tempfile,zipfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'server'))
from studio_server import validate_project,validate_recipe
VERSION='1.2.1';NAME='FORM-Studio-'+VERSION+'-Mac-Windows'

def build(output):
    output=Path(output);output.mkdir(parents=True,exist_ok=True)
    with tempfile.TemporaryDirectory(prefix='form-build-') as tmp:
        stage=Path(tmp)/NAME;stage.mkdir()
        for folder in ['dist','research']:
            shutil.copytree(ROOT/folder,stage/folder,ignore=shutil.ignore_patterns('__pycache__','.DS_Store'))
        # Source modules only, no runtime logs or machine-specific settings.
        (stage/'server').mkdir()
        for path in (ROOT/'server').iterdir():
            if path.suffix in {'.py','.json','.txt'}:shutil.copy2(path,stage/'server'/path.name)
        for name in ['launch.py','Start-Mac.command','Start-Windows.cmd','Check-Mac.command','Check-Windows.cmd','先读我-双平台使用说明.md','README.md','THIRD-PARTY-NOTICES.txt','LICENSE','跨机器测试记录.md','CHANGELOG.md']:
            shutil.copy2(ROOT/name,stage/name)
        for path in stage.glob('*.cmd'):
            path.write_bytes(path.read_text(encoding='utf-8').replace('\r\n','\n').replace('\n','\r\n').encode('utf-8'))
        (stage/'runtime/jobs').mkdir(parents=True)
        # A clean starter edition: one built-in cream, no personal scene or previous product jobs.
        config={'port':8768,'storageNamespace':'form-product-studio-release-1-2-1','taskNamespace':'form-modeling-release-1-2-1','showQuickGuide':True,'sampleOnly':True}
        (stage/'dist/studio-config.json').write_text(json.dumps(config,ensure_ascii=False),encoding='utf-8')
        cache_count=0
        font=json.loads((ROOT/'dist/assets/fonts/helvetiker_regular.typeface.json').read_text(encoding='utf-8'))
        (stage/'FONT-LICENSE.txt').write_text(font['original_font_information']['license_description'],encoding='utf-8')
        manifest={'name':'FORM 产品布景工作台','version':VERSION,'platforms':['macOS','Windows'],'python':'3.11+','objects':1,'initialScene':'built-in-cream-demo','cachedModels':cache_count,'files':{}}
        for path in sorted(stage.rglob('*')):
            if path.is_file():manifest['files'][path.relative_to(stage).as_posix()]=hashlib.sha256(path.read_bytes()).hexdigest()
        (stage/'release-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
        archive=output/(NAME+'.zip')
        with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as zipped:
            for path in sorted(stage.rglob('*')):
                if not path.is_file():continue
                relative=path.relative_to(stage).as_posix()
                info=zipfile.ZipInfo(NAME+'/'+relative);info.create_system=3;info.compress_type=zipfile.ZIP_DEFLATED
                mode=0o755 if path.suffix=='.command' or relative=='launch.py' else 0o644
                info.external_attr=(stat.S_IFREG|mode)<<16;zipped.writestr(info,path.read_bytes())
        digest=hashlib.sha256(archive.read_bytes()).hexdigest()
        archive.with_suffix('.zip.sha256').write_text(digest+'  '+archive.name+'\n',encoding='ascii')
        print(json.dumps({'archive':str(archive),'bytes':archive.stat().st_size,'objects':manifest['objects'],'cachedModels':cache_count,'files':len(manifest['files']),'sha256':digest},ensure_ascii=False))
        return archive

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--output',default=str(ROOT/'releases'));args=parser.parse_args();build(args.output)

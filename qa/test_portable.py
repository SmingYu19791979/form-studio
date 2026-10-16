import json,os,sys,tempfile,unittest
from pathlib import Path
from unittest.mock import patch
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'server'))
from platform_runtime import resolve_codex,worker_environment,codex_home,codex_capabilities
from studio_server import validate_project,save_project
import studio_server as studio

class PortableRuntime(unittest.TestCase):
    def test_windows_npm_wrapper_uses_node_directly_without_command_shell(self):
        with tempfile.TemporaryDirectory(prefix='FORM 含空格 ') as tmp:
            folder=Path(tmp);wrapper=folder/'codex.cmd';wrapper.touch();script=folder/'node_modules/@openai/codex/bin/codex.js';script.parent.mkdir(parents=True);script.touch()
            which=lambda name:str(wrapper) if name=='codex' else str(folder/'node.exe') if name=='node' else None
            self.assertEqual(resolve_codex(environ={'USERPROFILE':tmp},system='win32',which=which),[str(folder/'node.exe'),str(script)])
    def test_explicit_native_executable_can_live_in_a_unicode_path(self):
        with tempfile.TemporaryDirectory(prefix='FORM 包 ') as tmp:
            binary=Path(tmp)/'codex.exe';binary.touch()
            self.assertEqual(resolve_codex(environ={'FORM_CODEX_PATH':str(binary)},system='win32',which=lambda _:None),[str(binary)])
    def test_missing_codex_remains_optional_for_viewer(self):
        with patch.object(Path,'is_file',return_value=False):self.assertEqual(resolve_codex(environ={},system='win32',which=lambda _:None),[])
    def test_windows_environment_and_only_selected_provider_key_are_retained(self):
        with patch.dict(os.environ,{'SystemRoot':'C:/Windows','USERPROFILE':'C:/Users/测试','TEMP':'C:/Temp','CODEX_HOME':'D:/Codex','PROVIDER_KEY':'needed','UNRELATED_SECRET':'excluded'},clear=True):
            env=worker_environment({'model_provider':'company','model_providers':{'company':{'env_key':'PROVIDER_KEY'}}})
            self.assertEqual(env['SystemRoot'],'C:/Windows');self.assertEqual(env['PROVIDER_KEY'],'needed');self.assertNotIn('UNRELATED_SECRET',env);self.assertEqual(str(codex_home()),'D:/Codex')
    def test_standard_cli_does_not_require_desktop_only_no_daemon_flag(self):
        codex_capabilities.cache_clear()
        def run(command,**kwargs):
            output='--search' if command[-1:] == ['--help'] and 'exec' not in command else '--output-schema --output-last-message --image --json --ephemeral --sandbox --skip-git-repo-check' if 'exec' in command else 'shell_tool stable true\nmulti_agent stable false'
            return type('Result',(),{'stdout':output,'returncode':0})()
        with patch('platform_runtime.subprocess.run',side_effect=run):
            caps=codex_capabilities(('fake-cli',));self.assertTrue(caps['compatible']);self.assertFalse(caps['noDaemon']);self.assertIn('shell_tool',caps['features'])
        codex_capabilities.cache_clear()
    def test_scene_backup_preserves_embedded_assets_and_chinese_names(self):
        scene={'format':'form-product-studio','version':1,'objects':{'object':{'type':'Group','children':[{'name':'致美精华'}]},'images':[{'url':'data:image/png;base64,abcd'}]}}
        with tempfile.TemporaryDirectory() as tmp,patch.object(studio,'PROJECT',Path(tmp)/'runtime/current-project.json'):
            save_project(scene);self.assertEqual(json.loads(studio.PROJECT.read_text(encoding='utf-8')),scene)
        scene['objects']['images'][0]['url']='file:///Users/mac/Desktop/product.png'
        with self.assertRaises(ValueError):validate_project(scene)
    def test_scene_backup_rejects_wrong_format_and_too_many_objects(self):
        for project in [{},{'format':'form-product-studio','version':1,'objects':{'object':{'children':[{}]*31}}}]:
            with self.assertRaises(ValueError):validate_project(project)

if __name__=='__main__':unittest.main()

"""No paid models or GitHub Actions required: mocks only the absent assets."""
import base64,importlib.util,json,os,sys,types,unittest
from pathlib import Path
from PIL import Image,ImageChops
ROOT=Path(__file__).parent
sys.path.insert(0,str(ROOT))
for module in ('visuals','soundscape','cinematic_v4','media_quality'):
    if module not in sys.modules:sys.modules[module]=types.ModuleType(module)
sys.modules['visuals'].paint=lambda bg,*args:bg
sys.modules['soundscape'].create=lambda *args:None
sys.modules['cinematic_v4'].paint_cinematic=lambda bg,*args:bg
sys.modules['cinematic_v4'].paint_overlay=lambda *args:None
sys.modules['cinematic_v4'].create_audio=lambda *args:None
sys.modules['media_quality'].audit=lambda *args:{'apto_tecnicamente':False,'comprobaciones':{}}
spec=importlib.util.spec_from_file_location('mask_engine_branch',str(ROOT/'mask_video_engine_anim_branch.py'))
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)

class TestEngine(unittest.TestCase):
 def setUp(self):
  self.scene={'tipo':'narracion','texto':'La puerta se ha cerrado.','voz_off':'La puerta se ha cerrado.','subtitulo':{'texto':'La puerta se cierra','recuadro':[48,1050,672,1190]},'animacion':{'movimientos':[{'tipo':'door_close','objeto':'puerta','inicio':0,'fin':1.2},{'tipo':'symbol_insert','objeto':'sello','inicio':0,'fin':1.2}]}}
  self.job={'id':'E60-ANIM-TEST','marca':'ENIGMA_60','canal':'enigma60','idioma':'es','titulo':'test','escenas':[self.scene],'aprobado':False,'modo_entrega':'BORRADOR_REVISION_TELEGRAM','autorizado_publicar':False,'editorial':{'animacion_guia':'MG-ANIM-2.2'}}
 def test_rendered_frames_have_physical_change(self):
  a=m.draw_screen(self.job,self.scene,0,'scene','La puerta se cierra',720,1280,m.THEMES['ENIGMA_60'],frame=0)
  b=m.draw_screen(self.job,self.scene,0,'scene','La puerta se cierra',720,1280,m.THEMES['ENIGMA_60'],frame=9)
  with Image.open(a) as i, Image.open(b) as j:
   self.assertIsNotNone(ImageChops.difference(i.convert('RGB'),j.convert('RGB')).getbbox())
 def test_render_duration(self):
  p=m.render_screen(self.job,self.scene,0,'scene','La puerta se cierra',720,1280,m.THEMES['ENIGMA_60'],duration=3.0)
  self.assertIn('%02d',str(p))
  self.assertTrue((m.OUT/'img_000_scene_f23.png').exists())
 def test_voice_gate_prevents_espeak(self):
  old={k:os.environ.get(k) for k in ('ENCARGO_B64','ENCARGO_ID')}
  try:
   os.environ['ENCARGO_ID']='E60-ANIM-TEST'
   os.environ['ENCARGO_B64']=base64.b64encode(json.dumps(self.job).encode()).decode()
   with self.assertRaisesRegex(ValueError,'VOZ_NATURAL_NO_DISPONIBLE'):
    m.main()
  finally:
   for k,v in old.items():
    if v is None:os.environ.pop(k,None)
    else:os.environ[k]=v
if __name__=='__main__':unittest.main()

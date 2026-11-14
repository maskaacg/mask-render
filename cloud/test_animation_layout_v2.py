import unittest
from PIL import Image
from animation_layout import caption_layout,draw_caption,door_panel,validate_animation_spec,animate_scene

class TestAnimationLayout(unittest.TestCase):
 def test_caption_inside_panel(self):
  for t in ['La puerta se cierra.', 'El registrador indica un símbolo correcto, pero en una posición equivocada.', 'UNIDENTIFICADORLARGUISIMOSINESPACIOSXTREINTADEMASIADO']:
   lay=caption_layout(t,(48,1010,672,1205))
   self.assertTrue(lay.lines)
   self.assertGreaterEqual(lay.font_size,22)
 def test_reject_long_caption_in_small_box(self):
  with self.assertRaises(ValueError):caption_layout('La '*120,(48,1050,672,1190))
 def test_draw_caption(self):
  frame=Image.new('RGBA',(720,1280),(10,20,20,255))
  lay=draw_caption(frame,'La puerta se cierra lentamente. Las bisagras chirrían.')
  self.assertTrue(lay.font_size>=22)
 def test_real_door_changes(self):
  a=Image.new('RGBA',(720,1280),(13,26,29,255));b=a.copy()
  door_panel(a,0.1);door_panel(b,1.2)
  self.assertNotEqual(a.tobytes(),b.tobytes())
 def test_valid_action(self):
  scene={'movimientos':[{'tipo':'door_close','objeto':'puerta','inicio':0,'fin':2},{'tipo':'light_pulse','objeto':'luz','inicio':0.2,'fin':1}], 'subtitulo':{'texto':'La puerta se cierra','recuadro':[48,1050,672,1190]}}
  self.assertEqual(validate_animation_spec(scene),['luz','puerta'])
 def test_two_physical_actions_required(self):
  scene={'movimientos':[{'tipo':'caption','objeto':'texto','inicio':0,'fin':1},{'tipo':'door_close','objeto':'puerta','inicio':0,'fin':1}]}
  with self.assertRaisesRegex(ValueError,'DOS_MOVIMIENTOS'):validate_animation_spec(scene)
 def test_horizontal_captions(self):
  lay=caption_layout('No puedes usar el mismo sello dos veces.',(85,570,1195,685),canvas=(1280,720))
  self.assertGreaterEqual(lay.font_size,22)
 def test_animator_changes_scene_without_camera(self):
  scene={'movimientos':[{'tipo':'door_close','objeto':'puerta','inicio':0,'fin':1.4},{'tipo':'symbol_insert','objeto':'sello','inicio':0.1,'fin':1.4}],
         'subtitulo':{'texto':'El sello encaja en la puerta.','recuadro':[48,1050,672,1190]}}
  frame=Image.new('RGBA',(720,1280),(12,32,39,255))
  a=animate_scene(frame,scene,0.3)
  b=animate_scene(frame,scene,1.3)
  self.assertNotEqual(a.tobytes(),b.tobytes())
 def test_reject_script_injection(self):
  scene={'movimientos':[{'tipo':'door_close','objeto':'puerta','inicio':0,'fin':2,'script':'rm -rf /'},{'tipo':'light_pulse','objeto':'luz','inicio':0,'fin':1}]}
  with self.assertRaisesRegex(ValueError,'CODIGO_ARBITRARIO'):validate_animation_spec(scene)
if __name__=='__main__':unittest.main()

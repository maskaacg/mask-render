import unittest
from PIL import Image
from animation_layout import caption_layout,draw_caption,door_panel,validate_animation_spec

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
 def test_reject_script_injection(self):
  scene={'movimientos':[{'tipo':'door_close','objeto':'puerta','inicio':0,'fin':2,'script':'rm -rf /'},{'tipo':'light_pulse','objeto':'luz','inicio':0,'fin':1}]}
  with self.assertRaisesRegex(ValueError,'CODIGO_ARBITRARIO'):validate_animation_spec(scene)
if __name__=='__main__':unittest.main()

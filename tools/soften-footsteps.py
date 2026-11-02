"""Optional audio build: soften captured contacts without touching source ZIP.
Usage: python tools/soften-footsteps.py recursos-publicos.zip (requires FFmpeg).
The game only reads the exported OGG files and needs neither Python nor FFmpeg.
"""
from pathlib import Path
import sys,os,zipfile,tempfile,subprocess
root=Path(__file__).resolve().parents[1]
archive=sys.argv[1]if len(sys.argv)>1 else os.environ.get('TEST_CAPTURE_ZIP')
if not archive:raise SystemExit('Provide recursos-publicos.zip as the first argument or TEST_CAPTURE_ZIP.')
folder=root/'art/audio/steps';folder.mkdir(parents=True,exist_ok=True)
with zipfile.ZipFile(archive)as z,tempfile.TemporaryDirectory()as temp:
    for kind,count in [('caminhada',8),('corrida',6)]:
        for i in range(1,count+1):
            stem=f'{kind}-{i:02d}';name=next(n for n in z.namelist()if n.endswith('_'+stem+'.ogg'));source=Path(temp)/(stem+'.ogg');source.write_bytes(z.read(name))
            subprocess.run(['ffmpeg','-v','error','-y','-i',str(source),'-af','highpass=f=70,lowpass=f=1500,atrim=0:0.22,afade=t=in:st=0:d=0.008,afade=t=out:st=0.12:d=0.10,volume=0.9','-ac','1','-ar','24000','-c:a','libvorbis','-q:a','5',str(folder/(stem+'.ogg'))],check=True)
print('Fourteen softer footsteps: short contact, softened highs, gradual attack/release.')

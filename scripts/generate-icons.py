"""Generate two installable PNG icons without dependencies."""
from pathlib import Path
import struct
import zlib

def inside(x,y,poly):
    on=False
    j=len(poly)-1
    for i,(xi,yi) in enumerate(poly):
        xj,yj=poly[j]
        if (yi>y)!=(yj>y) and x<(xj-xi)*(y-yi)/(yj-yi)+xi:
            on=not on
        j=i
    return on

def chunk(tag,data):
    return struct.pack('!I',len(data))+tag+data+struct.pack('!I',zlib.crc32(tag+data)&0xffffffff)

bolt=[(.58,.10),(.24,.54),(.47,.54),(.41,.90),(.77,.40),(.55,.40)]
for n in (192,512):
    rows=bytearray()
    for y in range(n):
        rows.append(0)
        for x in range(n):
            xx=(x+.5)/n
            yy=(y+.5)/n
            lightning=inside(xx,yy,bolt)
            if lightning:
                rows.extend((255,224,117,255))
            else:
                rows.extend((109,74,255,255))
    png=b'\\x89PNG\\r\\n\\x1a\\n'
    png+=chunk(b'IHDR',struct.pack('!2I5B',n,n,8,6,0,0,0))
    png+=chunk(b'IDAT',zlib.compress(bytes(rows),9))
    png+=chunk(b'IEND',b'')
    Path(f'app/icon-{n}.png').write_bytes(png)
    print(f'Generated icon-{n}.png')

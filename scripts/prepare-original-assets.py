#!/usr/bin/env python3
"""Supply temporary PNG assets needed to compile the original Expo project.
Original image binaries remain only in the private Habit-old repository.
"""
import struct
import zlib
from pathlib import Path

target = Path('original/frontend/assets/images')
target.mkdir(parents=True, exist_ok=True)

def chunk(tag, data):
    return struct.pack('>I', len(data)) + tag + data + struct.pack('>I', zlib.crc32(tag + data) & 0xffffffff)

def png(size):
    # Violet canvas with a golden centered square; placeholders, not original artwork.
    out = bytearray()
    for y in range(size):
        out.append(0)
        for x in range(size):
            gold = size * .25 < x < size * .75 and size * .25 < y < size * .75
            out.extend((255, 211, 90, 255) if gold else (74, 144, 226, 255))
    return (b'\x89PNG\r\n\x1a\n'
        + chunk(b'IHDR', struct.pack('>2I5B', size, size, 8, 6, 0, 0, 0))
        + chunk(b'IDAT', zlib.compress(bytes(out), 9))
        + chunk(b'IEND', b''))

files = {
    'adaptive-icon.png': 512,
    'app-image.png': 512,
    'favicon.png': 192,
    'icon.png': 512,
    'partial-react-logo.png': 192,
    'react-logo.png': 192,
    'react-logo@2x.png': 384,
    'react-logo@3x.png': 512,
    'splash-image.png': 512,
}
for name, size in files.items():
    dest = target / name
    if not dest.exists():
        dest.write_bytes(png(size))
        print('Created temporary image:', dest)

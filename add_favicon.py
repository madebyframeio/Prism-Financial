import glob
import re

html_files = glob.glob('*.html')
favicon_tag = '<link rel="icon" type="image/png" href="logo.png">'

for file in html_files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Remove existing favicon tags
    content = re.sub(r'<link[^>]*rel=["\'](?i:icon|shortcut icon)["\'][^>]*>', '', content)
    
    # Inject the new favicon before closing head
    content = content.replace('</head>', f'    {favicon_tag}\n</head>')
    
    with open(file, 'w', encoding='utf-8') as f:
        f.write(content)

print(f"Injected favicon into {len(html_files)} files.")

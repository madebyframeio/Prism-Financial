import os
import glob
from bs4 import BeautifulSoup

def add_noindex_meta():
    html_files = glob.glob('*.html')
    
    meta_tag_str = '\n    <meta name="robots" content="noindex, nofollow, noarchive, nosnippet, noimageindex">\n    <meta name="googlebot" content="noindex, nofollow">\n'
    
    for file_path in html_files:
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
                
            # Check if meta tag already exists by looking for 'noindex, nofollow'
            if 'noindex, nofollow' in content:
                print(f"Skipping {file_path}, already has anti-bot tags.")
                continue
                
            # Use basic string insertion right after <head> or at the end of <head>
            if '</head>' in content:
                # Insert right before </head>
                content = content.replace('</head>', meta_tag_str + '</head>')
                
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(content)
                print(f"Updated {file_path} with anti-bot meta tags.")
            else:
                print(f"Warning: No </head> found in {file_path}")
                
        except Exception as e:
            print(f"Error processing {file_path}: {e}")

if __name__ == '__main__':
    add_noindex_meta()
    print("Anti-bot injection complete.")

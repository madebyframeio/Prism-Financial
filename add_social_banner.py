import os
import glob

def add_social_meta():
    html_files = glob.glob('*.html')
    
    meta_tag_str = """
    <!-- Social Meta Tags -->
    <meta property="og:title" content="Prism Financials Online">
    <meta property="og:description" content="Secure, simplified, and powerful online banking. Access your dashboard, track your transactions, and manage your assets with Prism Financials.">
    <meta property="og:image" content="https://prism-financial.netlify.app/logo.png">
    <meta property="og:url" content="https://prism-financial.netlify.app/">
    <meta property="og:type" content="website">
    
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="Prism Financials Online">
    <meta name="twitter:description" content="Secure, simplified, and powerful online banking. Access your dashboard, track your transactions, and manage your assets with Prism Financials.">
    <meta name="twitter:image" content="https://prism-financial.netlify.app/logo.png">
"""

    for file_path in html_files:
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
                
            # Avoid duplicate injection
            if 'og:title' in content:
                print(f"Skipping {file_path}, already has social tags.")
                continue
                
            if '</head>' in content:
                content = content.replace('</head>', meta_tag_str + '</head>')
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(content)
                print(f"Injected social banners into {file_path}")
            else:
                print(f"Warning: No </head> found in {file_path}")
                
        except Exception as e:
            print(f"Error processing {file_path}: {e}")

if __name__ == '__main__':
    add_social_meta()
    print("Social meta tag injection complete.")

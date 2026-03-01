import os
import glob

def replace_social_meta():
    html_files = glob.glob('*.html')
    
    old_tags = """
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

    new_tags = """
    <!-- Social Meta Tags -->
    <meta property="og:title" content="Prism Financials Online">
    <meta property="og:description" content="Secure, simplified, and powerful online banking. Access your dashboard, track your transactions, and manage your assets with Prism Financials.">
    <meta property="og:image" content="https://raw.githubusercontent.com/madebyframeio/Prism-Financial/main/logo.png">
    <meta property="og:url" content="https://prism-financial.netlify.app/">
    <meta property="og:type" content="website">
    
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="Prism Financials Online">
    <meta name="twitter:description" content="Secure, simplified, and powerful online banking. Access your dashboard, track your transactions, and manage your assets with Prism Financials.">
    <meta name="twitter:image" content="https://raw.githubusercontent.com/madebyframeio/Prism-Financial/main/logo.png">
"""

    for file_path in html_files:
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
                
            if old_tags in content:
                content = content.replace(old_tags, new_tags)
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(content)
                print(f"Replaced social tags in {file_path}")
            elif 'raw.github' in content:
                 print(f"File {file_path} already has the correct raw tags.")
            else:
                 # If netlify root tags exist but with slight string diff or manual
                 if 'prism-financial.netlify.app/logo.png' in content:
                      content = content.replace('https://prism-financial.netlify.app/logo.png', 'https://raw.githubusercontent.com/madebyframeio/Prism-Financial/main/logo.png')
                      with open(file_path, 'w', encoding='utf-8') as f:
                          f.write(content)
                      print(f"Repatched logo URL string in {file_path}")
                 
        except Exception as e:
            print(f"Error processing {file_path}: {e}")

if __name__ == '__main__':
    replace_social_meta()
    print("Social meta tag replacement complete.")

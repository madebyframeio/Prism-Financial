import os
import glob

def update_social_image_to_meta_png():
    html_files = glob.glob('*.html')
    
    for file_path in html_files:
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Replace logo.png with meta.png in the raw.githubusercontent URLs
            modified_content = content.replace(
                'https://raw.githubusercontent.com/madebyframeio/Prism-Financial/main/logo.png', 
                'https://raw.githubusercontent.com/madebyframeio/Prism-Financial/main/meta.png'
            )
            
            # Also handle any leftover netlify root URLs just in case
            modified_content = modified_content.replace(
                'https://prism-financial.netlify.app/logo.png', 
                'https://raw.githubusercontent.com/madebyframeio/Prism-Financial/main/meta.png'
            )

            if content != modified_content:
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(modified_content)
                print(f"Updated social image to meta.png in {file_path}")
            else:
                print(f"No changes needed in {file_path}")
                 
        except Exception as e:
            print(f"Error processing {file_path}: {e}")

if __name__ == '__main__':
    update_social_image_to_meta_png()
    print("Social meta tag image update complete.")

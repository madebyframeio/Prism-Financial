import os
import glob
import re

def fix_responsive_overlap():
    html_files = glob.glob('*.html')
    
    for file_path in html_files:
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()

            original_content = content
            
            # 1. Prevent body horizontal scroll blowout globally
            content = re.sub(r'<body class="([^"]*?)(?<!overflow-x-hidden)\b([^"]*)">', r'<body class="\1 \2 overflow-x-hidden">', content)
            
            # 2. Fix Grid Col Spans blowing out viewport (by adding min-w-0 to grid children)
            content = content.replace('md:col-span-8 space-y-8"', 'md:col-span-8 space-y-8 min-w-0"')
            content = content.replace('md:col-span-4 space-y-8"', 'md:col-span-4 space-y-8 min-w-0"')

            # 3. Fix tables overlapping / spilling out of grid
            # If the user means text is literally overlapping, we can make flex gaps responsive
            content = content.replace('gap-6 text-[10px]', 'gap-3 sm:gap-6 text-[10px]')
            content = content.replace('gap-8 items-end overflow-x-auto', 'gap-4 sm:gap-8 items-end overflow-x-auto')
            content = content.replace('class="flex items-center gap-6"', 'class="flex items-center gap-3 sm:gap-6"')
            
            # Fix Sidebar overlap (make cards flex-col on mobile if they are breaking)
            content = content.replace('class="account-row group"', 'class="account-row group flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-0"')
            
            # Adjust padding for mobile so accounts don't overlap edges
            content = content.replace('p-5 border-b', 'p-4 sm:p-5 border-b')

            if content != original_content:
                # Clean up multiple spaces in class
                content = content.replace('  ', ' ')
                content = content.replace(' overflow-x-hidden overflow-x-hidden">', ' overflow-x-hidden">')

                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(content)
                print(f"Fixed mobile responsiveness in {file_path}")
            else:
                print(f"No responsive patches required in {file_path}")
                 
        except Exception as e:
            print(f"Error processing {file_path}: {e}")

if __name__ == '__main__':
    fix_responsive_overlap()
    print("Responsive overlap patches applied globally.")

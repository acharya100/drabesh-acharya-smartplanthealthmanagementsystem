import os

def super_clean_generic(path, exclude_files=None):
    if exclude_files and os.path.basename(path) in exclude_files:
        print(f"Skipping (excluded): {path}")
        return

    try:
        with open(path, 'rb') as f:
            raw = f.read()
        
        # Replacement map for common problematic characters (bytes)
        replacements = {
            b'\xe2\x80\x93': b'-',   # en-dash
            b'\xe2\x80\x94': b'-',   # em-dash
            b'\xe2\x80\x98': b"'",   # smart single quote
            b'\xe2\x80\x99': b"'",   # smart single quote
            b'\xe2\x80\x9c': b'"',   # smart double quote
            b'\xe2\x80\x9d': b'"',   # smart double quote
            b'\xe2\x80\xa2': b'*',   # bullet point
            b'\xe2\x80\xa6': b'...', # ellipsis
            b'\xe2\x94\x80': b'-',   # horizontal box line
            b'\xe2\x95\x90': b'=',   # double box line
            b'\xe2\x95\x91': b'|',   # vertical box line
            b'\xe2\x94\x82': b'|',   # vertical single line
            b'\xe2\x86\x92': b'->',  # right arrow
            b'\xe2\x96\xba': b'>',   # pointer
        }
        
        new_raw = raw
        for old, new in replacements.items():
            new_raw = new_raw.replace(old, new)
        
        # Final pass: enforce strict ASCII
        final_bytes = bytearray()
        changed = False
        for b in new_raw:
            if b < 128:
                final_bytes.append(b)
            else:
                # Replace any remaining non-ASCII with space
                final_bytes.append(ord(' '))
                changed = True
        
        if raw != final_bytes:
            with open(path, 'wb') as f:
                f.write(final_bytes)
            print(f"Cleaned: {path}")
    except Exception as e:
        print(f"Error cleaning {path}: {e}")

if __name__ == "__main__":
    # Clean Frontend
    frontend_src = os.path.join('..', 'frontend', 'src')
    for root, dirs, files in os.walk(frontend_src):
        for f in files:
            if f.endswith(('.js', '.jsx', '.ts', '.tsx')):
                super_clean_generic(os.path.join(root, f), exclude_files=['ne.js'])

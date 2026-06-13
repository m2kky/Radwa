import sys
import zipfile
import xml.etree.ElementTree as ET

def extract_text_from_pptx(file_path):
    text_runs = []
    try:
        with zipfile.ZipFile(file_path) as z:
            for file in z.namelist():
                if file.startswith('ppt/slides/slide') and file.endswith('.xml'):
                    xml_content = z.read(file)
                    tree = ET.fromstring(xml_content)
                    for node in tree.iter():
                        if node.tag.endswith('}t'):
                            text_runs.append(node.text)
    except Exception as e:
        return str(e)
    return ' '.join(filter(None, text_runs))

if __name__ == '__main__':
    print(extract_text_from_pptx(sys.argv[1]))

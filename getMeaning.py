import requests, os, sys
from urllib.parse import quote
from bs4 import BeautifulSoup
from xml.etree import ElementTree

def register_all_namespaces(filename):
    namespaces = dict([node for _, node in ElementTree.iterparse(filename, events=['start-ns'])])
    for ns in namespaces:
        ElementTree.register_namespace(ns, namespaces[ns])

register_all_namespaces("assets/0f9a8.svg")

for filename in os.listdir("assets"):
    name = filename.split(".")[0]

    tree = ElementTree.parse(f"assets/{name}.svg")
    root = tree.getroot()

    kanji = ""
    try:
        kanji = root.find("{http://www.w3.org/2000/svg}g").find("{http://www.w3.org/2000/svg}g").attrib["{http://kanjivg.tagaini.net}element"]
    except:
        print(f"Something went wrong i guess: {filename}", file=sys.stderr)
        continue

    r = requests.get("https://jisho.org/search/" + quote(f"{kanji}#kanji"))
    if r.status_code != 200:
        print(f"Could not handle kanji: {kanji}", file=sys.stderr)
        continue

    bs = BeautifulSoup(r.text, "html.parser")
    meaning = ""

    try:
        meaning = bs.find("div", {"class": "kanji-details__main-meanings"}).string.strip()
    except:
        print(f"Something went wrong bs guess: {filename}", file=sys.stderr)
        continue

    root.set("meaning", meaning)
    tree._setroot(root)
    tree.write(f"assets/{name}.svg")
from flask import Flask, render_template, request
from bs4 import BeautifulSoup
import urllib, requests
app = Flask(__name__)

@app.route('/')
def main():
    return render_template('index.html', svg="", name="")

@app.route('/submit_kanji', methods=['GET'])
def submit_kanji():
    try:
        character = request.args.get('kanji')

        url = "https://jisho.org/search/{0}".format(urllib.parse.quote_plus(character + "#kanji"))
        r = requests.get(url, headers={
            "User-Agent": "little-web-project",
            "From": "http://lauchism.com"
        })

        if r.status_code != 200:
            print(f"ERROR: Failed to access Jisho API... {r.status_code}")
            return None
        
        body = BeautifulSoup(r.text, features="html.parser")
        names = body.find("div", {"class": "kanji-details__main-meanings"})

        with open(f"assets/0{format(ord(character), 'x')}.svg", encoding='utf-8') as file:
            return render_template('index.html', svg=file.read(), name=names.string)
    except:
        return render_template('index.html', svg="no", name="no")
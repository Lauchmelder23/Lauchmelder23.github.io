from flask import Flask, render_template, request
app = Flask(__name__)

@app.route('/')
def main():
    return render_template('index.html', svg="")

@app.route('/submit_kanji', methods=['GET'])
def submit_kanji():
    try:
        with open(f"assets/0{format(ord(request.args.get('kanji')), 'x')}.svg", encoding='utf-8') as file:
            return render_template('index.html', svg=file.read())
    except:
        return render_template('index.html', svg="no")
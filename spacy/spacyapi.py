from flask import Flask
from flask import json
from flask import jsonify
from flask import request
from flask import Response

import spacy

nlp = spacy.load('en')

app = Flask(__name__)

@app.route('/')
def api_root():
    return 'Welcome'


@app.route('/nlp', methods = ['POST'])
def api_post():
    data = request.form.getlist('text')
    doc = data[0]
    resp = jsonify(doc)
    resp.status_code = 200
    return resp

if __name__ == '__main__':
    app.run()

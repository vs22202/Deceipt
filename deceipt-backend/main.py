from flask import Flask,request,send_file
from flask_cors import CORS
import os
from werkzeug.utils import secure_filename
from projectNew import process_receipt
app = Flask(__name__)
CORS(app)
os.makedirs(os.path.join(app.instance_path, 'input'), exist_ok=True)
os.makedirs(os.path.join(app.instance_path, 'output'), exist_ok=True)
os.makedirs(os.path.join(app.instance_path, 'ocr'), exist_ok=True)

@app.route("/api/uploadImages",methods=["POST"])
def uploadImage():
  if request.method == "POST":
    files = request.files.getlist("images")
    results ={}
    for f in files:
      f.save(os.path.join(app.instance_path, 'input', secure_filename(f.filename)))
    i=0
    for f in files:
      filename = secure_filename(f.filename)
      temp = (process_receipt(filename))[f'{filename}']
      i=i+1
      print(f"API Called {i} ",flush=True)
      if(temp != 'failed'):
        results[f'{filename}'] = temp
      else:
        print(f"API Failed {i}",flush=True)
    return results

@app.route("/api/getImage/<filename>",methods=['GET'])
def getImage(filename):
  print(os.path.join(app.instance_path, 'output',filename),flush=True)
  return send_file(os.path.join(app.instance_path, 'output',filename))



if __name__ == "__main__":
  app.run(debug = True)

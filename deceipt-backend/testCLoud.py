import requests
import os
from tabulate import tabulate
resTable =[]
resTable.append(["filename","name","date","total"])
for x in range(1,50):
    if ( x%3 ==0 ):
        os.system("sudo protonvpn c -r")
    filename = f"Test{x}.jpg"
    receiptOcrEndpoint = 'https://ocr.asprise.com/api/v1/receipt'
    imageFile = "instance/output/" + filename  # // Modify this to use your own file if necessary
    r = requests.post(receiptOcrEndpoint,data={
        'client_id': 'TEST',        # Use 'TEST' for testing purpose \
        'recognizer': 'auto',       # can be 'US', 'CA', 'JP', 'SG' or 'auto' \
        'ref_no': 'ocr_python_123',  # optional caller provided ref code \
    }, \
        files={"file": open(imageFile, "rb")})
    data = r.json()
    print(data)
    if(data['success']):
        receiptData = data['receipts'][0]
        res = {'name':receiptData["merchant_name"],'total':receiptData["total"],'date':receiptData["date"]}
        print(res)
        resTable.append([filename,res['name'],res['date'],res['total']])
    else:
        os.system("sudo protonvpn c -r")

print(tabulate(resTable,headers='firstrow',tablefmt='fancy_grid',showindex=True))
content2=tabulate(resTable, tablefmt="tsv")
text_file=open("output.csv","w")
text_file.write(content2)
text_file.close()
import requests
import os
from tabulate import tabulate

filename = "AllRec.pdf"
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
resTable =[]
resTable.append(["filename","name","date","total"])
for x in range(0,len(data['receipts'])):
    receiptData = data['receipts'][x]
    res = {'name':receiptData["merchant_name"],'total':receiptData["total"],'date':receiptData["date"]}
    print(res)
    resTable.append([res['name'],res['date'],res['total']])
print(tabulate(resTable,headers='firstrow',tablefmt='fancy_grid',showindex=True))
content2=tabulate(resTable, tablefmt="tsv")
text_file=open("output.csv","w")
text_file.write(content2)
text_file.close()
from asprise_ocr_api import *
from projectNew import find_amounts,find_date,find_name

Ocr.set_up() # one time setup
ocrEngine = Ocr()
ocrEngine.start_engine("eng")
s = ocrEngine.recognize("4.jpeg", -1, -1, -1, -1, -1,
                  OCR_RECOGNIZE_TYPE_ALL, OCR_OUTPUT_FORMAT_PLAINTEXT)
splits = s.splitlines()

# receipt_ocr = {}
# receipt_ocr["name"] = find_name(splits)
# receipt_ocr["date"] = find_date(splits)
# receipt_ocr["total"] = max(find_amounts(splits))
# print(receipt_ocr)
print("Result: " + s)
# recognizes more images here ..
ocrEngine.stop_engine()
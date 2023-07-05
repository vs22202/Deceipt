import requests
import pytesseract
from pytesseract import Output
import cv2
def get_ocr_image(filename):
    file_name = "instance/output/"+filename
    image = cv2.imread(file_name, cv2.IMREAD_GRAYSCALE)
    ocr_dir = "instance/ocr/"+filename
    d = pytesseract.image_to_data(image, output_type=Output.DICT)
    n_boxes = len(d['level'])
    boxes = cv2.cvtColor(image.copy(), cv2.COLOR_BGR2RGB)
    for i in range(n_boxes):
        (x, y, w, h) = (d['left'][i], d['top']
                        [i], d['width'][i], d['height'][i])
        boxes = cv2.rectangle(boxes, (x, y), (x + w, y + h), (0, 255, 0), 2)

    cv2.imwrite(ocr_dir, boxes)

def extrcat_data(filename):
    get_ocr_image(filename)
    receiptOcrEndpoint = 'https://ocr.asprise.com/api/v1/receipt'
    imageFile = "instance/output/" + filename  # // Modify this to use your own file if necessary
    r = requests.post(receiptOcrEndpoint, data={
        'client_id': 'TEST',        # Use 'TEST' for testing purpose \
        'recognizer': 'auto',       # can be 'US', 'CA', 'JP', 'SG' or 'auto' \
        'ref_no': 'ocr_python_123',  # optional caller provided ref code \
    }, \
        files={"file": open(imageFile, "rb")})

    return r.json()

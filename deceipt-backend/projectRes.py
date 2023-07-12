
import re
import cv2
import json
import numpy as np
import pytesseract
from PIL import Image
from datetime import *
from pytesseract import Output
import matplotlib.pyplot as plt
from skimage.filters import threshold_local
import requests
from extractData import extrcat_data
from asprise_ocr_api import *
import requests
from tabulate import tabulate
import pandas as pd
import os


# pytesseract path
# path = 'C:\\Program Files\\Tesseract-OCR\\tesseract.exe'

# regex patterns for extracting field/info from the bill
date_pattern = r'([1-9]|0[1-9]|1[0-9]|2[0-9]|3[0-1])(\.|-|/)([1-9]|0[1-9]|1[0-2])(\.|-|/)(d{2}|([0-9][0-9]|19[0-9][0-9]|20[0-9][0-9]))'
name_pattern = r"^[A-Za-z’. ]+$"
amount_pattern_float = r'(\d+\.\d{2}\b)'
amount_pattern_int = r'[0-9]{1,4}'
address_regex_patterm = r'^[#.0-9a-zA-Z\s,-]+$'
dictOfWordsToExclude=['shop','supermarket','receipt','restuarant','bill']
times =0
Ocr.set_up()



# Utility Methods
# utility method to resize image
def opencv_resize(image, ratio):
    width = int(image.shape[1] * ratio)
    height = int(image.shape[0] * ratio)
    dim = (width, height)
    return cv2.resize(image, dim, interpolation=cv2.INTER_AREA)

# approximate the contour by a more primitive polygon shape


def approximate_contour(contour):
    peri = cv2.arcLength(contour, True)
    return cv2.approxPolyDP(contour, 0.032 * peri, True)

# This function allows us to find a rectangle by looking whether the number of approximated contour points is 4


def get_receipt_contour(contours):
    # loop over the contours
    for c in contours:
        approx = approximate_contour(c)
        # if our approximated contour has four points, we can assume it is receipt's rectangle
        if len(approx) == 4:
            return approx


def bw_scanner(image):
    gray = None
    try:
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        T = threshold_local(gray, 21, offset=5, method="gaussian")
        return True, (gray > T).astype("uint8") * 255
    except:
        return False, None


# function to extract the amounts from the recipt
def find_amounts(splits):
    amounts = [0]
    for field in splits:
        if "total" in field.lower() or "eur" in field.lower():
            amount_f = re.search(amount_pattern_float, field)
            amount_i = re.search(amount_pattern_int, field)
            if amount_f is not None:
                amounts.append(float(amount_f.group()))
            if amount_i is not None:
                amounts.append(float(amount_i.group()))
    if len(amounts) == 0:
        for field in splits:
            amount_f = re.search(amount_pattern_float, field)
            if amount_f is not None:
                amounts.append(float(amount_f.group()))
    unique = list(dict.fromkeys(amounts))
    return unique


def checkDates(date1, date2):
    date1 = date1.replace("-","/")
    date1 = date1.replace(".","/")
    date2 = date2.replace("-","/")
    date2 = date2.replace(".","/")
    d1, m1, y1 = [int(x) for x in date1.split('/')]
    d2, m2, y2 = [int(x) for x in date2.split('/')]
    if(d1 > 31 or d2 >31 or m1 > 12 or m2 > 12):
        return False
    currDate = date(y1, m1, d1)
    maxDate = date(y2, m2, d2)
    if maxDate < currDate:
        return True

    return False

# function to extract the date from the recipt


def find_date(splits):
    def_date = "1/1/1000"
    for field in splits:
        dateField = re.search(date_pattern, field)
        if dateField is not None:
            currDate = str(dateField.group())
            if checkDates(def_date, currDate):
                currDate = currDate.replace("-","/")
                currDate = currDate.replace(".","/")
                x, y, z = [x for x in currDate.split('/')]
                a,b,c =["","",""]
                if(len(x) == 4):
                    c = x
                    a=z
                    b=y
                elif(len(z) == 4):
                    c = z
                    a=y
                    b=x
                else:
                    a=z
                    b=y
                    c=x
                if(len(c) == 2):
                    c = "20"+c
                def_date = ("-").join([c,b,a])

    return def_date

# function to extract the name from the recipt


def find_name(splits):
    name = None
    for field in splits:
        name = re.search(name_pattern, field)
        if name is not None:
            return str(name.group())
    return name


# Code taken from https://pyimagesearch.com/
def contour_to_rect(contour, resize_ratio):
    if contour is not None:
        pts = contour.reshape(4, 2)
        rect = np.zeros((4, 2), dtype="float32")
        # top-left point has the smallest sum
        # bottom-right has the largest sum
        s = pts.sum(axis=1)
        rect[0] = pts[np.argmin(s)]
        rect[2] = pts[np.argmax(s)]
        # compute the difference between the points:
        # the top-right will have the minumum difference
        # the bottom-left will have the maximum difference
        diff = np.diff(pts, axis=1)
        rect[1] = pts[np.argmin(diff)]
        rect[3] = pts[np.argmax(diff)]
        return True, rect / resize_ratio
    else:
        return False, None


# to wrap the image to the desired perspective
def wrap_perspective(img, rect):
    # unpack rectangle points: top left, top right, bottom right, bottom left
    (tl, tr, br, bl) = rect

    # compute the width of the new image
    widthA = np.sqrt(((br[0] - bl[0]) ** 2) + ((br[1] - bl[1]) ** 2))
    widthB = np.sqrt(((tr[0] - tl[0]) ** 2) + ((tr[1] - tl[1]) ** 2))

    # compute the height of the new image
    heightA = np.sqrt(((tr[0] - br[0]) ** 2) + ((tr[1] - br[1]) ** 2))
    heightB = np.sqrt(((tl[0] - bl[0]) ** 2) + ((tl[1] - bl[1]) ** 2))

    # take the maximum of the width and height values to reach the final dimensions
    maxWidth = max(int(widthA), int(widthB))
    maxHeight = max(int(heightA), int(heightB))

    # destination points which will be used to map the screen to a "scanned" view
    dst = np.array([
        [0, 0],
        [maxWidth - 1, 0],
        [maxWidth - 1, maxHeight - 1],
        [0, maxHeight - 1]], dtype="float32")

    # calculate the perspective transform matrix
    M = cv2.getPerspectiveTransform(rect, dst)

    # warp the perspective to grab the screen
    return cv2.warpPerspective(img, M, (maxWidth, maxHeight))


# Pre-Processing
def pre_process(image):
    # 1) Convert to grayscale for further processing
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    # 2) Get rid of noise with Gaussian Blur filter
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)

    # 3) Detect white regions
    rectKernel = cv2.getStructuringElement(cv2.MORPH_RECT, (9, 9))
    dilated = cv2.dilate(blurred, rectKernel)

    # 4) Detect edges
    edged = cv2.Canny(dilated, 100, 200, apertureSize=3)

    return edged

# To find receipt contour, standard edge detection preprocessing is applied:
# - Convert image to grayscale
# - Aplly Gaussian filter 5x5 to get rid of noise
# - Run Canny edge detector


def find_contours(edged, image):
    # Detect all contours in Canny-edged image
    contours, hierarchy = cv2.findContours(
        edged, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
    if contours is not None:
        image_with_contours = cv2.drawContours(
            image.copy(), contours, -1, (0, 255, 0), 3)

        # To find the contour of receipt we follow two assumptions:
        # - receipt is the largest contour whithin image
        # - receipt is expected to be of a rectangular shape

        # Get 10 largest contours
        largest_contours = sorted(
            contours, key=cv2.contourArea, reverse=True)[:10]
        receipt_contour = get_receipt_contour(largest_contours)

        return True, receipt_contour

    return False, image


# We will use of cv2.warpPerspective to restore perspective of the receipt. Some processign to do befoe this is:
# - convert contour into a rectangle-like coordinate array consisting of clockwise ordered points: top-left, top-right, bottom-right,bottom-left
# - use rectangle points to calculate destination points of the "scanned" view
# - feed destination points into cv2.getPerspectiveTransform to calculate transformation matrix
# - use cv2.warpPerspective to restore the perspective!
def crop_and_rotate(status, original, image, receipt_contour, resize_ratio):
    if status:
        status, cont_rect = contour_to_rect(receipt_contour, resize_ratio)
        if status:
            scanned = wrap_perspective(original.copy(), cont_rect)
            return scanned
    else:
        return image


# Colour Transformations
# To obtain black and white scanner effect with the color transformation
def colour_transform(scanned, original, filename):
    status, result = bw_scanner(scanned)
    output_dir = "instance/output/"+filename

    if status:
        output = Image.fromarray(result)
        output.save(output_dir)
    else:
        cv2.imwrite(output_dir, original)


def get_ocr_image(filename):
    file_name = "instance/input/"+filename
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

# OCR and text-Detection
def getExtractedTextFromOcr(filename):
    extracted_text = []
    #Tesseract
    file_name = "instance/input/"+filename
    image = cv2.imread(file_name, cv2.IMREAD_GRAYSCALE)
    extracted_text.append(pytesseract.image_to_string(image) or "")

    #Asprise SDK
    ocrEngine = Ocr()
    ocrEngine.start_engine("eng")
    extracted_text.append (ocrEngine.recognize(file_name, -1, -1, -1, -1, -1,
                  OCR_RECOGNIZE_TYPE_ALL, OCR_OUTPUT_FORMAT_PLAINTEXT) or "")
    ocrEngine.stop_engine()
    #Asprise Cloud
    global times
    times +=1
    if(times%3 ==0 ):
        os.system("sudo protonvpn c -r")
    receiptOcrEndpoint = 'https://ocr.asprise.com/api/v1/receipt'
    imageFile = "instance/input/" + filename  # // Modify this to use your own file if necessary
    r = requests.post(receiptOcrEndpoint,data={
        'client_id': 'TEST',        # Use 'TEST' for testing purpose \
        'recognizer': 'auto',       # can be 'US', 'CA', 'JP', 'SG' or 'auto' \
        'ref_no': 'ocr_python_123',  # optional caller provided ref code \
    }, \
        files={"file": open(imageFile, "rb")})
    data = r.json()
    if(data['success']):
        receiptData = data['receipts'][0]
        extracted_text.append(receiptData["ocr_text"])
        extracted_text.append({'name':receiptData["merchant_name"] or "Name Not Found",'total':receiptData["total"] or 0,'date':receiptData["date"] or "1/1/1000"})
        
    else:
        extracted_text.append("")
        extracted_text.append({'name':"Name Not Found",'total':0,'date':"1/1/100"})
        os.system("sudo protonvpn c -r")
    return extracted_text
def find_values(splits,filename):
    receipt_ocr = {}
    receipt_ocr["name"] = find_name(splits) or "None"
    receipt_ocr["date"] = find_date(splits) or "None"
    receipt_ocr["total"] = max(find_amounts(splits))

    return {filename: receipt_ocr}

def extract_data(filename):
    # Remove
    # pytesseract.pytesseract.tesseract_cmd = path

    get_ocr_image(filename)
    extracted_text = getExtractedTextFromOcr(filename)
    res = []
    res.append(find_values(extracted_text[0].splitlines(),filename))
    res.append(find_values(extracted_text[1].splitlines(),filename))
    res.append(find_values(extracted_text[2].splitlines(),filename))
    res.append({filename:extracted_text[3]})
    return res

# MAIN FUNCTION
def process_receipt(filename):
    file_name = 'instance/input/' + filename
    image = cv2.imread(file_name)

    # Downscale image as finding receipt contour is more efficient on a small image
    resize_ratio = 500 / image.shape[0]
    original = image.copy()
    image = opencv_resize(image, resize_ratio)
    edged = pre_process(image)
    status, receipt_contour = find_contours(edged, image)
    scanned = crop_and_rotate(status, original, image,
                              receipt_contour, resize_ratio)
    colour_transform(scanned, original, filename)
    data = extract_data(filename)
    return data
def generateResults(filelist):
    tessTable =[]
    AspriseSdkTable = []
    AspriseCloudTable =[]
    tessTable.append(["filename","name","date","total"])
    AspriseSdkTable.append(["filename","name","date","total"])
    AspriseCloudTable.append(["filename","name","date","total"])
    resTable =[]
    resTable.append(['Expected-Result','Tesseract','Asprise SDK','Asprise Cloud OCR','Asprise Cloud API'])
    scoreTable = []
    scoreTable.append(['Expected-Result','Tesseract','Asprise SDK','Asprise Cloud OCR','Asprise Cloud API'])
    for image,exp_res in filelist:
        data=process_receipt(image)
        scores =[]
        results = []
        scores.append(3)
        results.append(exp_res["name"] +"\n" + exp_res["date"] + "\n" + str(exp_res["total"]))
        try:
            for count,result in enumerate(data):
                res = result[image]
                print(result)
                print(res)
                string_result = res["name"] +"\n" + res["date"] + "\n" + str(res["total"])
                ocrEngine = ""
                if count == 0:
                    ocrEngine="Tesseract"
                    tessTable.append([image,res['name'],res['date'],res['total']])
                elif count == 1:
                    ocrEngine = "Asprise SDK"
                    AspriseSdkTable.append([image,res['name'],res['date'],res['total']])
                elif count == 2:
                    ocrEngine = "Asprise Cloud OCR"
                elif count == 3:
                    ocrEngine = "Asprise Cloud API"
                    AspriseCloudTable.append([image,res['name'],res['date'],res['total']])
                res_count =[0,0,0]
                if res["name"].strip().upper() == exp_res["name"].strip().upper() :
                    res_count[0]=1
                if res["date"].strip().upper() == exp_res["date"].strip().upper():
                    res_count[1]=1
                if str(res["total"]).strip() == str(exp_res["total"]).strip():
                    res_count[2]=1
                score = sum(res_count)
                scores.append(score)
                results.append(string_result)
            scoreTable.append(scores)
            resTable.append(results)
        except:
            continue
    print(tabulate(resTable,headers='firstrow',tablefmt='fancy_grid',showindex=True))
    print(tabulate(scoreTable,headers='firstrow',tablefmt='fancy_grid',showindex=True))
    print(tabulate(tessTable,headers='firstrow',tablefmt='fancy_grid',showindex=True))
    print(tabulate(AspriseSdkTable,headers='firstrow',tablefmt='fancy_grid',showindex=True))
    print(tabulate(AspriseCloudTable,headers='firstrow',tablefmt='fancy_grid',showindex=True))
    my_df=pd.DataFrame(tessTable)
    my_df.to_csv('./results/pre-processed/tesseract.csv', index=False, header=False)
    my_df2=pd.DataFrame(AspriseSdkTable)
    my_df2.to_csv('./results/pre-processed/AspSdk.csv', index=False, header=False)
    my_df3=pd.DataFrame(AspriseCloudTable)
    my_df3.to_csv('./results/pre-processed/AspCL.csv', index=False, header=False)
    my_df4=pd.DataFrame(resTable)
    my_df4.to_csv('./results/pre-processed/results.csv', index=False, header=False)
    my_df5=pd.DataFrame(scoreTable)
    my_df5.to_csv('./results/pre-processed/scores.csv', index=False, header=False)


import csv
fileList = []
with open('./results/expectedOutput.csv') as file_obj: 
    reader_obj = csv.reader(file_obj)
    for row in reader_obj:
        if row[0].strip() != "filename":
            fileList.append([row[0].strip(),{"name":row[1],'date':row[2],"total":row[3]}])
generateResults(fileList)


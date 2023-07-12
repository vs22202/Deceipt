import re
import cv2
import json 
import datetime
import pytesseract
import numpy as np
from datetime import *
from pytesseract import Output
from deskew import determine_skew
from skimage.color import rgb2gray
from matplotlib import pyplot as plt
from skimage import filters, feature
from skimage.transform import rotate


# pytesseract path
#path = 'C:\\Program Files\\Tesseract-OCR\\tesseract.exe'

# This function is used to find the tilt(skew) of the image
# Calculate skew angle of an image
def getSkewAngle(cvImage) -> float:
    # Prep image, copy, convert to gray scale, blur, and threshold
    newImage = cvImage.copy()
    gray = cv2.cvtColor(newImage, cv2.COLOR_BGR2GRAY)
    blur = cv2.GaussianBlur(gray, (9, 9), 0)
    thresh = cv2.threshold(blur, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)[1]

    # Apply dilate to merge text into meaningful lines/paragraphs.
    # Use larger kernel on X axis to merge characters into single line, cancelling out any spaces.
    # But use smaller kernel on Y axis to separate between different blocks of text
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (30, 5))
    dilate = cv2.dilate(thresh, kernel, iterations=5)

    # Find all contours
    contours, hierarchy = cv2.findContours(dilate, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)
    contours = sorted(contours, key = cv2.contourArea, reverse = True)

    # Find largest contour and surround in min area box
    largestContour = contours[0]
    minAreaRect = cv2.minAreaRect(largestContour)

    # Determine the angle. Convert it to the value that was originally used to obtain skewed image   
    grayscale = rgb2gray(cvImage)
    angle = determine_skew(grayscale)
    return angle

# Rotate the image around its center in direction opposite to its skew
# Deskew image
def deskew(cvImage):
    angle = getSkewAngle(cvImage)    
    rotated = rotate(cvImage, angle, resize=True) * 255
    return rotated.astype(np.uint8)


# Function to get the latest date
def checkDates(date1, date2):
    d1,m1,y1 = [int(x) for x in date1.split('/')]
    d2,m2,y2 = [int(x) for x in date2.split('/')]
    maxDate = date(y1, m1, d1)
    currDate = date(y2, m2, d2)
    if maxDate < currDate:
        return True
    
    return False

def getReceiptData(filename)->json:
    # Read the image
    img = cv2.imread("instance/input/"+filename)

    # Simple thresholding
    ret,thresh1 = cv2.threshold(img,210,255,cv2.THRESH_BINARY)

    # Deskew image
    img = deskew(img)

    # pytesseract OCR
    #pytesseract.pytesseract.tesseract_cmd = path

    # extract text from the image    
    extracted_text = pytesseract.image_to_string(img)
    d = pytesseract.image_to_data(img, output_type=Output.DICT)
    n_boxes = len(d['level'])
    newImg = None
    for i in range(n_boxes):
        (x, y, w, h) = (d['left'][i], d['top'][i], d['width'][i], d['height'][i])    
        newImg = cv2.rectangle(img, (x, y), (x + w, y + h), (0, 0, 255), 2)

    #plt.imshow(newImg, cmap = "gray")
    cv2.imwrite("instance/output/"+filename, newImg)

    # Construct return json object
    receipt_ocr = {}
    splits = extracted_text.splitlines()
    if(len(splits)>1):
        receipt_ocr["name"] = splits[0]+" "+splits[1]        
        
    date_pattern = r'([1-9] |1[0-9]| 2[0-9]|3[0-1])(.|-)([1-9] |1[0-2])(.|-|)20[0-9][0-9]$'
    money_pattern = r'[0-9]+[.][0-9]+$'     
    receipt_ocr["total"] = float(0)
    receipt_ocr["date"] = "1/1/1000"
    for field in splits:    
        dateField = re.search(date_pattern, field)
        money = re.search(money_pattern, field)
        if dateField is not None:
            currDate = str(dateField.group())
            if checkDates(receipt_ocr["date"], currDate):
                receipt_ocr["date"] = currDate
        if money is not None:
            receipt_ocr["total"] = float(money.group())

    # Serializing json  
    #jsonObject = json.dumps({filename:receipt_ocr}, indent = 4) 
    return {filename:receipt_ocr}


jsonObject = getReceiptData("test2.png")
print(jsonObject)
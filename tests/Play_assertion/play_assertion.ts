import { expect, Locator, Page, TestInfo } from '@playwright/test';
import * as fs from 'fs';

interface Field {
    selector: string;
    values: string[];
    type: string;
    ignore: string;
}

function readFileLineByLine(filePath: string): string[] {
    let stringResult: string[] = [];
    const resultfile = fs.readFileSync(filePath, 'utf-8');
    for (const line of resultfile.split(/[\r\n]+/)) {
        stringResult.push(line);
    }

    return stringResult;
}

export function generateTest(filePathReference:string): void {
    const lines = readFileLineByLine(filePathReference);
    let beginTest: boolean = false;
    const newFile = filePathReference.split('.spec.ts')[0] + "_GENERATED.spec.ts";

    if(fs.existsSync(newFile)){
        console.log("Old generated script deleted");
        fs.unlinkSync(newFile);
    }

    for (const line of lines) {
        if (line.match(".*screenSnapshot.*")) {
            const filePath = extractFilePath(line);
            fs.appendFileSync(newFile, "await assert_auto.assertFromJson("+filePath+", page, testinfo);\n", { encoding: "utf8", flag: "a+" });
        }
        else if (line.match(".*generateTest.*")) {
            continue;
        }
        else{
            fs.appendFileSync(newFile, line + "\n", { encoding: "utf8", flag: "a+" });
        }
    }
    console.log("End Playwright Script Generation");
}

function  extractFilePath(inputString: string):string | null{
    const regex = /.*\.screenSnapshot\(([^,]+)/;
    const match = inputString.match(regex);

    if(match && match[1]){
        return match[1];
    }

    return null;
}

export function makeDirectory(outputFile:string){
    const regex = '^(.+)\/([^\/]+)$';
    const match = outputFile.match(regex);
    if(match && match[1]){
        fs.mkdirSync(match[1], { recursive: true });
        console.log("Path " + match[1] +" created.");
    } 
}

function writeJsonFile(fieldArray: Array<Field>, outputFile: string): void {
    const jsonData = JSON.stringify(fieldArray, null, 2)

    //Make directory if not exists
    makeDirectory(outputFile);
	
    try {
        fs.writeFileSync(outputFile, jsonData, { flag: 'w+' });
        console.log('write success');
    }
    catch (error) {
        console.error("erreur : ", error);
    }
}

function readJsonFile(filePath: string): Field[] {
    try {
        const jsonData = fs.readFileSync(filePath, 'utf8');
        const parsedData: Array<Field> = JSON.parse(jsonData);

        if (Array.isArray(parsedData)) {
            return parsedData;
        } else {
            console.error("Json file doesn't contain array")
            return [];
        }
    }
    catch (error) {
        console.error("Error reading json file : ", error);
        return [];
    }
}

async function getSpanLocator(parentLocator: Locator, selector:string): Promise<Locator[]> {
    var allElements = await parentLocator.locator(selector);
    var lenght = await allElements.count()
    let spanLocators: Locator[] = [];

    for(let i = 0; i < lenght; i++){
         const element = allElements.nth(i);

         const tagName = await element.evaluate(el => el.tagName);
         if(tagName === 'SPAN'){
             spanLocators.push(element);
         }
    }
    return spanLocators;
  }

  async function getInputLocator(parentLocator: Locator, selector:string): Promise<Locator[]>  {
    var allElements = await parentLocator.locator(selector);
    var lenght = await allElements.count()
    let inputLocators: Locator[] = [];

    for(let i = 0; i < lenght; i++){
         const element = await allElements.nth(i);
         const tagName = await element.evaluate(el => el.tagName);
         if(tagName === 'INPUT'){
            inputLocators.push(element);
         }
    }
    return inputLocators;
  }


async function testFields(page:Page, filePath: string, parentLocator: Locator, testinfo: TestInfo){
    let errorNb: number = testinfo.errors.length;
    let fields: Array<Field> = readJsonFile(filePath);
    var inputLocators: Locator[] = [];
    var spanLocators: Locator[] = [];

    for (const field of fields) {
        const { selector, values, type, ignore } = field;
        if(ignore =='false'){
			if(type == 'LABEL'){
                spanLocators = await getSpanLocator(parentLocator, selector);

                if(spanLocators.length == 0){
                    console.log("span locator not found for selector :" + selector);
                    await expect.soft(selector).toBeFalsy();
                    errorNb = testinfo.errors.length;
                }
                else{
                    for(var  i = 0; i < spanLocators.length; i++){
                        await expect.soft(spanLocators[i]).toHaveText(values[i]);
                        if (errorNb < testinfo.errors.length) {
                            markErrorOnPage(page, spanLocators[i]);  
                            errorNb = testinfo.errors.length;
                        }
                    }
                }
            }
			
			else if (type =='INPUT'){
                inputLocators = await getInputLocator(parentLocator, selector);
                if(inputLocators.length == 0){
                    console.log("input locator not found for selector :" + selector);
                    await expect.soft(selector).toBeFalsy();
                    errorNb = testinfo.errors.length;
                }
                else{
                    for(var i = 0; i < inputLocators.length; i++){
                        await expect.soft(inputLocators[i]).toHaveValue(values[i]);	
                        if (errorNb < testinfo.errors.length) {
                            markErrorOnPage(page, inputLocators[i]);
                            errorNb = testinfo.errors.length;
                        }    
                    }  
                }
			} 
        }else{
            console.log("ignored field : "+ selector);
        }
    }
}



export async function assertFromJson(filePath: string, page: Page, testinfo: TestInfo): Promise<void> {
    console.log("Start assertion file :" + filePath);

    if (!fs.existsSync(filePath)) {
        await expect.soft(filePath).toBeFalsy();
        console.log("FILE NOT EXISTS : " + filePath);
        return
    }

     let parentLocator = await page.locator("*");
    let modalElement = await getModalElements(page);

    if(modalElement.length > 0){
        let nbModals = await page.locator('.modal').count();
        console.log("NB MODALES : " + nbModals);
        let modaleElements = await page.locator('.modal').nth(nbModals-2);
        console.log("TEST modal fields");
        await testFields(page,filePath, modaleElements, testinfo);

    }else{
        console.log("TEST background fields");
        await testFields(page, filePath, parentLocator, testinfo);
    }
    
    // Add a screenshot of the page to the HTML report
    const screenshot = await page.screenshot();
	testinfo.attach('', { body: screenshot, contentType: 'image/png' });
    
    console.log("Assertion ended");
    
}

async function markErrorOnPage(page: Page, locator:Locator){

    // Add a border to the element that failed the expect
    await page.evaluate((element) => {
        if(element != null){
            element.style.border = '2px solid red';
            element.style.backgroundColor = 'darkred';
        }
    }, await locator.elementHandle());
}

function isSelectorExists(selector:string, array:Array<Field>):boolean{

        for(const field of array){
            if(field.selector == selector){
                return true;
            }
        }
        return false;
}

function addValue(value:string, selector:string, array:Array<Field>):Array<Field>{
    for(let field of array){
        if(field.selector == selector){
             field.values.push(value);
             break;
        }
    }
    return array;
}

async function addElementToFieldArray(elementId:string | null, elementValue:string, fieldArray:Array<Field>, typeField:string):Promise<Array<Field>>{
    const arrayReturn = fieldArray;

    if(elementId != "" && elementId != null && elementId != undefined){
        const labelSelector = '#' + elementId;
        if(!isSelectorExists(labelSelector, arrayReturn)){
            arrayReturn.push({
                selector:labelSelector,
                values:[elementValue],
                type:typeField,
                ignore:'false'
            });
        }
        else{
            addValue(elementValue, labelSelector, arrayReturn);
        }
    }
    return arrayReturn;
}


async function getModalElements(page: Page) : Promise<Array<Field>>{
    var fieldArray = new Array<Field>;
    let nbModals = await page.locator('.modal').count();
    let parentLocator;

    if(nbModals >= 2 ){
        parentLocator = await page.locator('.modal').nth(-2);
    }else if (nbModals==1) {
        parentLocator = await page.locator('.modal').first();
    }
    else {return fieldArray}
    const modalID = await parentLocator.evaluate(el => el.id);
    console.log("PARENT LOCATOR ID :  " + modalID);

    const spanModalElements = await page.$$(modalID+' span');
    for(const spanModalElement of spanModalElements){
        const spanModalId = await spanModalElement.getAttribute('id');
        let  spanModalValue = await spanModalElement.textContent();
        if (spanModalValue == null){
            spanModalValue = "";
        }
        fieldArray = await addElementToFieldArray(spanModalId, spanModalValue, fieldArray,'LABEL');
    }

    var inputModalElements = await page.$$(modalID+' input');
    for(const inputModalElement of inputModalElements){
        const inputModalId = await inputModalElement.getAttribute('id');
        let  inputModalValue = await inputModalElement.inputValue();
        if (inputModalValue == null){
            inputModalValue = "";
        }
        fieldArray = await addElementToFieldArray(inputModalId, inputModalValue, fieldArray,'INPUT');
    }
    return fieldArray;
}


async function getNonModalElements(page: Page) : Promise<Array<Field>>{
    var fieldArray = new Array<Field>;

    const spanNonModalElements = await page.$$('*:not(.modal) span');
    for(const spanNonModalElement of spanNonModalElements){
        const spanNonModalId = await spanNonModalElement.getAttribute('id');
        let  spanNonModalValue = await spanNonModalElement.textContent();
        if (spanNonModalValue == null){
            spanNonModalValue = "";
        }

        fieldArray = await addElementToFieldArray(spanNonModalId, spanNonModalValue, fieldArray,'LABEL' );
    }

    var inputNonModalElements = await page.$$('*:not(.modal) input');
    for(const inputNonModalElement of inputNonModalElements){
        const inputNonModalId = await inputNonModalElement.getAttribute('id');
        let  inputNonModalValue = await inputNonModalElement.inputValue();
        if (inputNonModalValue == null){
            inputNonModalValue = "";
        }
        fieldArray = await addElementToFieldArray(inputNonModalId, inputNonModalValue, fieldArray,'INPUT' );

    }
    return fieldArray;
}

export async function screenSnapshot(outputFile: string, page: Page): Promise<void> {
    var fieldArray = new Array<Field>;
    fieldArray = await getModalElements(page);
console.log("fff"+fieldArray.length);
    if(fieldArray.length == 0){
        fieldArray = await getNonModalElements(page);
    }
    writeJsonFile(fieldArray, outputFile);
    
    console.log("Snapshot created in : " + outputFile); 
}





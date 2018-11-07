import { Position, TextDocument } from "vscode";
import * as path from "path";
import * as fs from "fs";
import * as _ from "lodash";
import { toJson } from 'really-relaxed-json'
const Extractor = require('extract-brackets');


export function getCurrentLine(document: TextDocument, position: Position): string {
    return document.getText(document.lineAt(position).range);
}

export function genImportRegExp(key: string ): RegExp {
    const file = 
    "(.+)";
    //  "(.+\\.(jsx|js|tsx|ts))";
    const fromOrRequire = "(?:from\\s+|=\\s+require(?:<any>)?\\()";
    const requireEndOptional = "\\)?";
    // const pattern = `${key}\\s+${fromOrRequire}["']${file}["']${requireEndOptional}`;
    const pattern = `${key}(.*)${fromOrRequire}["']${file}["']${requireEndOptional}`;
    return new RegExp(pattern);
}

export function findImportPath(text: string, key: string, parentPath: string): string {
    const re = genImportRegExp(key);
    const results = re.exec(text);
    if (!!results && results.length > 0) {
        let importPath = path.resolve(parentPath, results[results.length - 1]);

        if (!fs.existsSync(importPath)) {
            const possibleExtensions = ['js', 'jsx', 'ts', 'tsx'];
            for (let i=0; i < possibleExtensions.length; i++) {
                if (fs.existsSync(importPath + '.' + possibleExtensions[i])) {
                    importPath = importPath + '.' + possibleExtensions[i];
                    break;
                }
            }
        }



        return importPath;
    } else {
        return "";
    }
}

export function getAllMessages(filePath: string, keyword: string): { name: string, defaultMessage: string, description?: string }[] {
    const content = fs.readFileSync(filePath, { encoding: "utf8" });
    let lines = content.match(/.*/g);
    // let lines = content.match(/.*[,{]/g);
    // const lines = content.match(/(defineMessages\()(.*)(?=,})/g);
    if (lines === null) {
        return [];
    }

    const messages = [];
    try {
        const ExtractParams = new Extractor('(');

        const startIndex = lines.findIndex(str => str.match(/(defineMessages\()/g) != null);
        if (startIndex > 0) {
            lines = lines.slice(startIndex);
        }
        const messagesArr = ExtractParams.extract(lines.join(" ")) || [];
        const messagesObj = messagesArr.length ? JSON.parse(toJson(messagesArr[0].str)) : {};

        messages.push(...Object.keys(messagesObj).map((name) => ({ ...messagesObj[name], name })));

    } catch (ex) {
        console.error(ex);
    }
    // 

    // const messageNames = lines.join(" ").match(/\.[_A-Za-z0-9\-]+/g);
 
    return keyword !== "" ? messages.filter(({ name }) => name === keyword) : messages;
}

// from css-loader's implementation
// source: https://github.com/webpack-contrib/css-loader/blob/22f6621a175e858bb604f5ea19f9860982305f16/lib/compile-exports.js
export function dashesCamelCase(str) {
  return str.replace(/-(\w)/g, function(match, firstLetter) {
    return firstLetter.toUpperCase();
  });
}

export type CamelCaseValues = false | true | "dashes";

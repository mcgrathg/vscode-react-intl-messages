import { Position, TextDocument } from "vscode";
import * as path from "path";
import * as fs from "fs";
import { toJson } from 'really-relaxed-json'
import * as Extractor from 'extract-brackets'

const ExtractParams = new Extractor('(');

export function getCurrentLine(document: TextDocument, position: Position): string {
    return document.getText(document.lineAt(position).range);
}

export function genImportRegExp(key: string ): RegExp {
    const file = "(.+)";
    const fromOrRequire = "(?:from\\s+|=\\s+require(?:<any>)?\\()";
    const requireEndOptional = "\\)?";
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
    
    if (lines === null) {
        return [];
    }

    const messages = [];
    try {
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
 
    return keyword !== "" ? messages.filter(({ name }) => name === keyword) : messages;
}
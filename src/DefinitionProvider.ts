import { DefinitionProvider, TextDocument, Position, CancellationToken, Location, Uri } from "vscode";
import { getCurrentLine,  genImportRegExp, getImportPathByPosition } from "./utils";
import * as path from "path";
import * as fs from "fs";

function getPosition(filePath: string, className: string): Position {
    const content = fs.readFileSync(filePath, { encoding: "utf8" });
    const lines = content.split("\n");

    let lineNumber = -1;
    let character = -1;
    const keyWord = className;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        character = line.indexOf(keyWord);

        if (character !== -1) {
            lineNumber = i;
            break;
        }
    }

    if (lineNumber === -1) {
        return null;
    } else {
        return new Position(lineNumber, character);
    }
}

function isImportLineMatch(line: string, matches: RegExpExecArray, current: number): boolean {
    if (matches === null) {
        return false;
    }

    const start1 = line.indexOf(matches[1]) + 1;
    const start2 = line.indexOf(matches[2]) + 1;

    // check current character is between match words
    return (current > start2 && current < start2 + matches[2].length) || (current > start1 && current < start1 + matches[1].length);
}

export class MessagesDefinitionProvider implements DefinitionProvider {

    public provideDefinition(document: TextDocument, position: Position, token: CancellationToken): Thenable<Location> {
        const currentLine = getCurrentLine(document, position);

        const matches = genImportRegExp("(\\S+)").exec(currentLine);
        if (isImportLineMatch(currentLine, matches, position.character)) {
            return Promise.resolve(null);
        }

        const wordRange = document.getWordRangeAtPosition(position);
        if (!wordRange) {
            return Promise.resolve(null);
        }

        const importPath = getImportPathByPosition(document, wordRange.end);
        if (importPath === "") {
            return Promise.resolve(null);
        }

        const field = document.getText(wordRange);

        const targetPosition = getPosition(importPath, field);
        if (targetPosition === null) {
            return Promise.resolve(null);
        } else {
            return Promise.resolve(new Location(Uri.file(importPath), targetPosition));
        }
    }
}

export default MessagesDefinitionProvider;

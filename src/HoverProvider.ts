import { HoverProvider, TextDocument, Position, CancellationToken, Hover, MarkedString } from "vscode";
import * as path from "path";
import {
    findImportPath,
    getAllMessages,
    getCurrentLine,
} from "./utils";

function getWords(line: string, position: Position): string {
    const text = line.slice(0, position.character);
    const index = text.search(/[a-zA-Z0-9\._]*$/);
    if (index === -1) {
        return "";
    }

    return text.slice(index);
}

export class MessagesHoverProvider implements HoverProvider {
    provideHover(document: TextDocument, position: Position, _token: CancellationToken): Thenable<Hover> {
        const currentLine = getCurrentLine(document, position);
        const currentDir = path.dirname(document.uri.fsPath);

        let wordRange = document.getWordRangeAtPosition(position);
        if (!wordRange) {
            return null;
        }

        let field = document.getText(wordRange);

        const words = getWords(currentLine, position);
        if (words === "" || words.indexOf(".") === -1) {
            return null;
        }

        const [obj, _ignored] = words.split(".");

        const importPath = findImportPath(document.getText(), obj, currentDir);
        if (importPath === "") {
            return null;
        }

        const messages = getAllMessages(importPath, field);

        if (messages) {
            const contents: MarkedString[] = [
                ...messages.reduce((arr, message) => ([
                    ...arr,
                    "Text: ",
                    ` - "${message.defaultMessage}"`,
                    ...(message.description !== undefined ? ['Description:', ` - ${message.description}`] : [])
                ]), [])
            ];

            const hover = new Hover(contents, wordRange);

            return Promise.resolve(hover)
        }

        return null;
    }
}

export default MessagesHoverProvider;

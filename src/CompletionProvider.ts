import { CompletionItemProvider, TextDocument, Position, CompletionItem, CompletionItemKind } from "vscode";
import * as path from "path";
import * as _ from "lodash";
import {
    findImportPath,
    getAllMessages,
    getCurrentLine,
} from "./utils";

// check if current character or last character is .
function isTrigger(line: string, position: Position): boolean {
    const i = position.character - 1;
    return line[i] === "." || (i > 1 && line[i - 1] === ".");
}

function getWords(line: string, position: Position): string {
    const text = line.slice(0, position.character);
    const index = text.search(/[a-zA-Z0-9\._]*$/);
    if (index === -1) {
        return "";
    }

    return text.slice(index);
}
export class MessagesCompletionProvider implements CompletionItemProvider {
    provideCompletionItems(document: TextDocument, position: Position): Thenable<CompletionItem[]> {
        const currentLine = getCurrentLine(document, position);
        const currentDir = path.dirname(document.uri.fsPath);

        if (!isTrigger(currentLine, position)) {
            return Promise.resolve([]);
        }

        const words = getWords(currentLine, position);
        if (words === "" || words.indexOf(".") === -1) {
            return Promise.resolve([]);
        }

        const [obj, field] = words.split(".");

        const importPath = findImportPath(document.getText(), obj, currentDir);
        if (importPath === "") {
            return Promise.resolve([]);
        }

        const messages = getAllMessages(importPath, field);

        return Promise.resolve(messages.map(message => {
            const { name, defaultMessage, description } = message;
            const completionItem = new CompletionItem(name, CompletionItemKind.Variable);
            completionItem.detail = `\`${defaultMessage}\``;
            completionItem.documentation = description;

            return completionItem;
        }));
    }
}

export default MessagesCompletionProvider;

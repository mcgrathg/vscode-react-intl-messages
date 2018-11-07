import { HoverProvider, TextDocument, Position, CancellationToken, Hover, MarkedString } from "vscode";
import * as path from "path";
import {
    getAllMessages,
    getImportPathByPosition
} from "./utils";



export class MessagesHoverProvider implements HoverProvider {
    provideHover(document: TextDocument, position: Position, _token: CancellationToken): Thenable<Hover> {
        const wordRange = document.getWordRangeAtPosition(position);
        if (!wordRange) {
            return Promise.resolve(null);
        }
        
        const importPath = getImportPathByPosition(document, wordRange.end);
        if (importPath === "") {
            return Promise.resolve(null);
        }
        
        const field = document.getText(wordRange);

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

        return Promise.resolve(null);
    }
}

export default MessagesHoverProvider;

import {
  HoverProvider,
  TextDocument,
  Position,
  CancellationToken,
  Hover,
  MarkedString,
} from 'vscode';

import {
  getAllMessages,
  getImportPathByWords,
  getWordsAtPosition,
} from './utils';

export class MessagesHoverProvider implements HoverProvider {
  provideHover(
    document: TextDocument,
    position: Position,
    _token: CancellationToken,
  ): Thenable<Hover> {
    const wordRange = document.getWordRangeAtPosition(position);
    if (!wordRange) {
      return Promise.resolve(null);
    }

    const words = getWordsAtPosition(document, wordRange.end);

    const importPath = getImportPathByWords(document, words);
    if (importPath === null) {
      return Promise.resolve(null);
    }

    const field = document.getText(wordRange);
    const isFieldFiltered = field !== words;

    const messages = getAllMessages(importPath, isFieldFiltered ? field : '');

    if (!messages) {
      return Promise.resolve(null);
    }

    const contents: MarkedString[] = [
      { value: JSON.stringify(messages, null, 2), language: 'json' },
    ];
    const hover = new Hover(contents, wordRange);

    return Promise.resolve(hover);
  }
}

export default MessagesHoverProvider;

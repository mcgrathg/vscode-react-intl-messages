import { Position, TextDocument } from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { toJson } from 'really-relaxed-json';
import * as Extractor from 'extract-brackets';

const ExtractParams = new Extractor('(');

export function getCurrentLine(
  document: TextDocument,
  position: Position,
): string {
  return document.getText(document.lineAt(position).range);
}

export function genImportRegExp(key: string): RegExp {
  const file = '(.+)';
  const fromOrRequire = '(?:from\\s+|=\\s+require(?:<any>)?\\()';
  const requireEndOptional = '\\)?';
  const pattern = `${key}(.*)${fromOrRequire}["']${file}["']${requireEndOptional}`;
  return new RegExp(pattern);
}

export function findImportPath(
  text: string,
  key: string,
  parentPath: string,
): string {
  const re = genImportRegExp(key);
  const results = re.exec(text);
  if (!!results && results.length > 0) {
    const importPath = path.resolve(parentPath, results[results.length - 1]);

    return getFileWithExtension(importPath);
  } else {
    return '';
  }
}

export function getAllMessages(
  filePath: string,
  keyword: string,
): { name: string, defaultMessage: string, description?: string }[] {
  const content = fs.readFileSync(filePath, { encoding: 'utf8' });
  let lines = content.match(/.*/g);

  if (lines === null) {
    return [];
  }

  const messages = [];
  try {
    const startIndex = lines.findIndex(
      str => str.match(/(defineMessages\()/g) != null,
    );
    if (startIndex > 0) {
      lines = lines.slice(startIndex);
    }
    const messagesArr = ExtractParams.extract(lines.join(' ')) || [];
    const messagesObj = messagesArr.length
      ? JSON.parse(toJson(messagesArr[0].str))
      : {};

    messages.push(
      ...Object.keys(messagesObj).map(name => ({ ...messagesObj[name], name })),
    );
  } catch (ex) {
    console.error(ex);
  }

  return keyword !== ''
    ? messages.filter(({ name }) => name === keyword)
    : messages;
}

export function getWordsAtPosition(
  document: TextDocument,
  position: Position,
): string {
  const currentLine = getCurrentLine(document, position);
  const words = getWords(currentLine, position);
  if (words === '') {
    return null;
  }

  return words;
}

export function getWords(
  line: string,
  position: Position,
  includeLastCharPeriod?: boolean,
): string {
  let endIndex = position.character;
  if (includeLastCharPeriod && line.charAt(position.character) === '.') {
    endIndex += 1;
  }

  const text = line.slice(0, endIndex);
  const index = text.search(/[a-zA-Z0-9\._]*$/);
  if (index === -1) {
    return '';
  }

  return text.slice(index).replace('...', '');
}

function getFileWithExtension(file: string): string {
  if (!fs.existsSync(file)) {
    const possibleExtensions = ['js', 'jsx', 'ts', 'tsx'];
    for (let i = 0; i < possibleExtensions.length; i++) {
      if (fs.existsSync(file + '.' + possibleExtensions[i])) {
        file = file + '.' + possibleExtensions[i];
        break;
      }
    }
  }

  return file;
}

export function getImportPathByWords(document: TextDocument, words: string) {
  const [obj] = words.split('.');
  const currentDir = path.dirname(document.uri.fsPath);
  const importPath = findImportPath(document.getText(), obj, currentDir);
  if (importPath === '') {
    return null;
  }

  return importPath;
}

import dart from 'highlight.js/lib/languages/dart';
import ini from 'highlight.js/lib/languages/ini';
import java from 'highlight.js/lib/languages/java';
import javascript from 'highlight.js/lib/languages/javascript';
import json from 'highlight.js/lib/languages/json';
import kotlin from 'highlight.js/lib/languages/kotlin';
import markdown from 'highlight.js/lib/languages/markdown';
import python from 'highlight.js/lib/languages/python';
import swift from 'highlight.js/lib/languages/swift';
import typescript from 'highlight.js/lib/languages/typescript';
import xml from 'highlight.js/lib/languages/xml';
import yaml from 'highlight.js/lib/languages/yaml';

/**
 * The languages a code block is coloured in unless the application says which,
 * loaded together the first time a block is drawn (cf `code-block.js`).
 *
 * Each answers for its aliases too: json for jsonc, xml for html, ini for toml,
 * markdown for md.
 */
export const languages = { javascript, typescript, python, dart, json, xml, yaml, ini, markdown, swift, java, kotlin };

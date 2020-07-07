/* eslint-disable */
/**
 * Copied from https://github.com/microsoft/vscode-python/blob/61b179b2092050709e3c373a6738abad8ce581c4/src/datascience-ui/common/index.ts
 */
import * as nbformat from '@jupyterlab/nbformat'

// tslint:disable-next-line:no-empty
export function noop() {}

function concatMultilineString(str: nbformat.MultilineString, trim: boolean): string {
    const nonLineFeedWhiteSpaceTrim = /(^[\t\f\v\r ]+|[\t\f\v\r ]+$)/g // Local var so don't have to reset the lastIndex.
    if (Array.isArray(str)) {
        let result = ''
        for (let i = 0; i < str.length; i += 1) {
            const s = str[i]
            if (i < str.length - 1 && !s.endsWith('\n')) {
                result = result.concat(`${s}\n`)
            } else {
                result = result.concat(s)
            }
        }

        // Just trim whitespace. Leave \n in place
        return trim ? result.replace(nonLineFeedWhiteSpaceTrim, '') : result
    }
    return trim ? str.toString().replace(nonLineFeedWhiteSpaceTrim, '') : str.toString()
}

export function concatMultilineStringOutput(str: nbformat.MultilineString): string {
    return concatMultilineString(str, true)
}
export function concatMultilineStringInput(str: nbformat.MultilineString): string {
    return concatMultilineString(str, false)
}

export function formatStreamText(str: string): string {
    // Do the same thing jupyter is doing
    return fixCarriageReturn(fixBackspace(str))
}

// Using our own version for fixCarriageReturn. The jupyter version seems to not work.
function fixCarriageReturn(str: string): string {
    // Go through the string, looking for \r's that are not followed by \n. This is
    // a special case that means replace the string before. This is necessary to
    // get an html display of this string to behave correctly.

    // Note: According to this:
    // https://jsperf.com/javascript-concat-vs-join/2.
    // Concat is way faster than array join for building up a string.
    let result = ''
    let previousLinePos = 0
    for (let i = 0; i < str.length; i += 1) {
        if (str[i] === '\r') {
            // See if this is a line feed. If so, leave alone. This is goofy windows \r\n
            if (i < str.length - 1 && str[i + 1] === '\n') {
                // This line is legit, output it and convert to '\n' only.
                result += str.substr(previousLinePos, i - previousLinePos)
                result += '\n'
                previousLinePos = i + 2
                i += 1
            } else {
                // This line should replace the previous one. Skip our \r
                previousLinePos = i + 1
            }
        } else if (str[i] === '\n') {
            // This line is legit, output it. (Single linefeed)
            result += str.substr(previousLinePos, i - previousLinePos + 1)
            previousLinePos = i + 1
        }
    }
    result += str.substr(previousLinePos, str.length - previousLinePos)
    return result
}

// Took this from jupyter/notebook
// https://github.com/jupyter/notebook/blob/b8b66332e2023e83d2ee04f83d8814f567e01a4e/notebook/static/base/js/utils.js
// Remove characters that are overridden by backspace characters
function fixBackspace(txt: string) {
    let tmp = txt
    do {
        txt = tmp
        // Cancel out anything-but-newline followed by backspace
        // eslint-disable-next-line
        tmp = txt.replace(/[^\n]\x08/gm, '')
    } while (tmp.length < txt.length)
    return txt
}
